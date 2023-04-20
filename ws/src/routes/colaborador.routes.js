const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const pagarme = require('../services/pagarme');
const Colaborador = require('../models/colaborador');
const SalaoColaborador = require('../models/relationship/salaoColaborador');
const ColaboradorServico = require('../models/relationship/colaboradorServico');

router.post('/', async (req, res)=> {

        const db = mongoose.connection;
        const session = await db.startSession();
        session.startTransaction();

        try{
            const { colaborador, salaoId } = req.body;
            let newColaborador = null;

        //Verificar se o colaborador existe
        const existentColaborador = await Colaborador.findOne({
            $or: [
                { email: colaborador.email },
                { telefone: colaborador.telefone }
            ]
        });

        if (!existentColaborador) {
            //Criar Conta Bancaria
            const { contaBancaria } = colaborador;
            const pagarmeBankAccount = await pagarme('bank_accounts', { 
                agencia: contaBancaria.agencia,
                bank_code: contaBancaria.banco,
                conta: contaBancaria.numero,
                conta_dv: contaBancaria.dv,
                type: contaBancaria.tipo,
                document_number: contaBancaria.cpfCnpj,
                legal_name: contaBancaria.titular,
             });

             if (pagarmeBankAccount.error){
                throw pagarmeBankAccount;
             }

            //Criar Recebedor
            const pagarmeRecipient = await pagarme('/recipients', {
                transfer_interval: 'daily',
                transfer_enabled: true,
                bank_account_id: pagarmeBankAccount.data.id, 
            });

            if (pagarmeRecipient.error) {
                throw pagarmeRecipient;
            }

            //Criar Colaborador
            newColaborador = await Colaborador({
                ...colaborador,
                recipientId: pagarmeRecipient.data.id,
            }).save({ session });
        };

        //Relacionamento
        const colaboradorId = existentColaborador 
            ? existentColaborador._id
            : newColaborador._id;

        //Verificar se ja existe o relacionamento com o Salão

        const existentRelationship = await SalaoColaborador.findOne({
            salaoId,
            colaboradorId,
            status: { $ne: 'E' },
        });

        //Se não esta vinculado
    if (!existentRelationship){
        await new SalaoColaborador({
            salaoId,
            colaboradorId,
            status: colaborador.vinculo,
        }).save({ session });
    }

        //Se ja existe o vinculo entre colaborador e salao
        if (existentColaborador){
            await SalaoColaborador.findOneAndUpdate(
                {
                salaoId,
                colaboradorId,
            },  
            { status: colaborador.vinculo },
            { session }
        );    
    }

        //Relação com as especialidades
        // ['123', '234', '567']
        await ColaboradorServico.insertMany(
            colaborador.especialidades.map(servicoId => ({
                servicoId,
                colaboradorId,
            }),
                { session }
            )
        );

        await session.commitTransaction();
        session.endSession();

        if (existentColaborador && existentRelationship) {
            res.json({ error: true, message: 'Colaborador já cadastrado.' });
        } else{
            res.json({ error: false });
        }
    }   catch (err) {
        await session.abortTransaction();
        session.endSession();     
        res.json({ error: true, message: err.message });
        }
    }
);

router.put('/:colaboradorId', async (req, res) => {
    try{

        const { vinculo, vinculoId, especialidades } = req.body;
        const { colaboradorId } = req.params;

        //Vinculo
        await SalaoColaborador.findByIdAndUpdate(vinculoId, { status: vinculo });

        //Especialidades
        await ColaboradorServico.deleteMany({
            colaboradorId,
        });

        await ColaboradorServico.insertMany(
            colaborador.especialidades.map(
                (servicoId) => ({
                    servicoId,
                    colaboradorId,
                }))
        );

        res.json({ error: false });

    } catch(err) {
        res.json({ error: true, message: err.message })
    }
});

router.delete('/vinculo/:id', async (req, res) => { 
    try{
        await SalaoColaborador.findByIdAndUpdate(req.params.id, { status: 'E' });
        res.json({ error: false });
    } catch (err) {
        res.json({ error: false, message: err.message });
    }
})
    
router.post('/filter', async (req, res) => {
    try{

        const colaboradores = await Colaborador.find(req.body.filters);
        res.json({ error: false, colaboradores });

    } catch (err) {
      res.json({ error: false, message: err.message });
    }
})

router.get('/salao/:salaoId', async (req, res) => {
    try{

        const { salaoId } = req.params;
        let listaColaboradores = [];

        //Recuperar Vinculos
        const salaoColaboradores = await SalaoColaborador.find({
            salaoId,
            status: { $ne: 'E'},
        })
        .populate({ path: 'colaboradorId', select: '-senha -recipientId' })
        .select('colaboradorId dataCadastro status');

        for (let vinculo of salaoColaboradores) {
            const especialidades = await ColaboradorServico.find({
                colaboradorId: vinculo.colaboradorId._id
            });

            listaColaboradores.push({
                ...vinculo._doc,
                especialidades,
            });
        }

        res.json({
            error: false, 
            colaboradores: listaColaboradores.map((vinculo) => ({
                ...vinculo.colaboradorId._doc,
                vinculoId: vinculo._id,
                vinculo: vinculo.status,
                especialidades: vinculo.especialidades,
                dataCadastro: vinculo.dataCadastro,
            })),
        });

    } catch (err) {
      res.json({ error: false, message: err.message });
    }
}) 

module.exports = router;