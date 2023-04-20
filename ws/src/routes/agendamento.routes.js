const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const pagarme = require('../services/pagarme');
const _ = require('lodash');
const util = require('../util');
const keys = require('../data/keys.json')

const Cliente = require('../models/cliente');
const Salao = require('../models/salao');
const Servico = require('../models/servico');
const Colaborador = require('../models/colaborador');
const Agendamento = require('../models/agendamento');
const Horario = require('../models/horario');

router.post('/', async (req, res) => {
    const db = mongoose.connection;
    const session = await db.startSession();
    session.startTransaction()    
    
    try{
        const { clienteId, salaoId, servicoId, colaboradorId} = req.body;

        /*
            Fazer Verificação se ainda existe aquele horario disponivel
        */

        //Recuperar o Cliente
        const cliente = await Cliente.findById(clienteId).select(
            'nome endereco customerId'
            );

        // Recuperar o Salão
        const salao = await Salao.findById(salaoId).select(
            'recipientId'
            );

        //Recuperar o Serviço
        const servico = await Servico.findById(servicoId).select(
            'preco titulo comissao'
            );
        
        //Recuperar o Colaborador
        const colaborador = await Colaborador.findById(colaboradorId).select(
            'recipientId'
            );

        //Criando Pagamento
        const precoFinal = util.toCents(servico.preco) * 100; //49.90 => 4990

        //Colaborador Split Rules
        const colaboradorSplitRule = {
            recipient_id: colaborador.recipientId,
            amount: parseInt(precoFinal * (servico.comissao / 100)),
        }

        const creatPayment = await pagarme('/transaction', { 
            //Preço total
            amount: precoFinal,

            //Dados do cartão
            card_number: '411157880978542',
            card_cvv: '159',
            card_expiration_date: '0930',
            card_holder_name: 'Isaque de Jesus',

            //Dados do cliente
            customer:{
                id: cliente.customerId 
            },
            //Dados de endereço do cliente
            billing: {
                name: cliente.nome,
                address: {
                    country: cliente.endereco.pais,
                    state: cliente.endereco.uf,
                    city: cliente.endereco.cidade,
                    street: cliente.endereco.logradouro,
                    street_number: cliente.endereco.numero,
                    zipcode: cliente.endereco.cep,
                },
            },

            //Itens da venda
            items: [
                {
                    id: servicoId,
                    title: servico.titulo,
                    unit_price: precoFinal,
                    quantity: 1,
                    tangible: false,
                },
            ],
            split_rules: [
                //Taxa do Salao
                {
                    recipient_id: salao.recipientId,
                    amount: precoFinal - keys.api_key - colaboradorSplitRule.amount,
                },
                //Taxa do colaborador
                colaboradorSplitRule,
                //Taxa do App
                {
                    recipient_id: keys.recipient_id,
                    amount: keys.app,
                },
            ],
        });

        if (creatPayment.error) {
            throw creatPayment;
        }

        //Criar Agendamento
        const agendamento = await new Agendamento({
            ...req.body,
            transactionId: creatPayment.data.id,
            comissao: servico.comissao,
            valor: servico.preco,
        }).save({ session })

        await session.commitTransaction();
        session.endSession();

        res.json({ error: false, agendamento })
    } catch (err) {
        await session.abortTransaction();
        session.endSession();     
        res.json({ error: true, message: err.message });
    }
})

router.post('/filter', async (req, res) => {
    try{

        const { periodo , salaoId } = req.body;

        const agendamento = await Agendamento.find({
            salaoId,
            data:{
                $gte: moment(periodo.inicio).startOf('day'),
                $lte: moment(periodo.final).endOf('day'),
            },
        })
        .populate([
            { path: 'servicoId', select: 'titulo duracao' },
            { path: 'colaboradorId', select: 'nome' },
            { path: 'clienteId', select: 'nome' },
        ]);

        res.json({ error: false, agendamento });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
})

router.post('/dias-disponiveis', async (req, res) => {
    try{

        const { data, salaoId, servicoId } = req.body;
        const horarios = await Horario.find({ salaoId });
        const servico = await Servico.findById(servicoId).select('duracao');

        let agenda = [];
        let colaboradores = [];
        let lastDay = moment(data);

        //Duração do Serviço
        const servicoMinutos = util.hourToMinutes(
            moment(servico.duracao).format('HH:mm')
            );

            const servicoSlot = util.sliceMinutes(
                servico.duracao,
                moment(servico.duracao).add(servicoMinutos, 'minutes'),
                util.SLOT_DURATION
            ).length;

            //Procure nos próximos 365 dias até a agendar conter 7 dias disponiveis

            for (let i = 0; i < 365 && agenda.length < 7; i++){
                const espacoValidos = horarios.filter(horario => {
                    //Verificar dia da semana
                    const diaSemanaDisponivel = horario.dias.includes(moment(lastDay).day()); //0 - 6

                    //Verificar especialidade disponivel
                    const servicoDisponivel = horario.especialidades.includes(servicoId);


                    return diaSemanaDisponivel && servicoDisponivel;
                });

                /*Todos os colaboradores disponiveis no dia e seus horarios
                [
                    {
                        "2023-05-20": {
                            "18941913019":[
                                '12:30',
                                '13:00',
                                '13:30'
                            ]
                        }
                    }
                ]
                */

                if (espacoValidos.length > 0) {
                    
                    let todosHorarioDia = {};

                    for (let espaco of espacoValidos) {
                        for (let colaboradorId of espaco.colaboradores){
                            if (!todosHorarioDia[colaboradorId]) {
                                todosHorarioDia[colaboradorId] = []
                            }

                            //Pegar todos os horarios do espaço e jogar para dentro do colaborador

                            todosHorarioDia[colaboradorId] = [
                                ...todosHorarioDia[colaboradorId],
                                ...util.sliceMinutes(
                                    util.mergeDateTime(lastDay, espaco.inicio),
                                    util.mergeDateTime(lastDay, espaco.fim),
                                    util.SLOT_DURATION
                                ),
                            ];
                        }
                    }

                    //Ocupação de cada especialista no dia
                    for (let colaboradorId of Object.keys(todosHorarioDia)){
                        //Recuperar agendamentos 
                        const agendamento = await Agendamento.find({
                            colaboradorId,
                            data: {
                                $gte: moment(lastDay).startOf('day'),
                                $lte: moment(lastDay).endOf('day'),
                            },
                        })
                            .select('data servicoId -_id')
                            .populate('servicoId', 'duracao');

                        //Recuperar Horarios agendados
                        let horariosOcupados = agendamentos.map((agendamento) => ({
                            inicio: moment(agendamento.data),
                            final: moment(agendamento.data).add(
                                util.hourToMinutes(
                                moment(agendamento.servicoId.duracao).format('HH:mm')
                            ), 
                            'minutes'
                        ),
                    }));


                    //Recuperar todos os slots entre os agendamentos
                    horariosOcupados = horariosOcupados
                    .map(horario => 
                        util.sliceMinutes(
                            horario.inicio, 
                            horario.fim, 
                            util.SLOT_DURATION
                            )
                        )
                        .flat();

                    //Removendo todos os horarios ocupados/slots ocupados
                    let horariosLivres = util.splitByValue(
                        todosHorarioDia[colaboradorId].map((horarioLivre) => {
                            return horariosOcupados.includes(horarioLivre)
                                ? '-'
                                : horarioLivre;
                        }),
                        '-'
                    ).filter((espaco) => espaco.length > 0);

                    //Verificando se existe espaço suficiente no slot
                    horariosLivres = horariosLivres.filter(
                        (horarios) => horarios.length >= servicoSlot
                        );

                        //Verificando se os horarios dentro do slot tem a quantidade necessaria
                        horariosLivres = horariosLivres
                        .map((slot) =>
                        slot.filter(
                            (horario, index) => slot.length - index >= servicoSlot
                            )
                        )
                        .flat();

                        //Formatando horarios livres em 2 e 2
                        horariosLivres = _.chunk(horariosLivres, 2)

                        //Remover colaborador caso não tenha nenhum horario/slot
                        if (horariosLivres.length == 0) {
                            todosHorarioDia = _.omit(todosHorarioDia, colaboradorId);
                        } else{
                            todosHorarioDia[colaboradorId] = horariosLivres;
                        }
                    }

                    //Verificar se tem especialista disponivel naquele dia
                    const totalEspecialistas = Object.keys(todosHorarioDia).length;

                    if(totalEspecialistas > 0){
                        colaboradores.push(Object.keys(todosHorarioDia));
                        agenda.push({
                            [lastDay.format('YYYY-MM-DD')]: todosHorarioDia,
                        });
                    }
            
            }
            lastDay = lastDay.add(1, 'day');
        }

        //Recuperando dados dos colaboradores
        colaboradores = _.uniq(colaboradores.flat());

        colaboradores = await Colaborador.find({
            _id: { $in: colaboradores }
        }).select('nome foto');

        colaboradores = colaboradores.map(c => ({
            ...c._doc,
            nome: c.nome.split('')[0]
        }))

        res.json({ 
            error: false,
            colaboradores,
            agenda,
        });

        } catch (err) {
        res.json({ error: true, message: err.message });
    }
})

module.exports = router;