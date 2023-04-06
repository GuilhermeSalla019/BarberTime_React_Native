const express = require('express');
const router = express.Router();
const Salao = require('../models/salao');
const Servico = require('../models/servico');

//requisição e resposta
router.post('/', async (req, res) => { //Metodo Post para Criação
    try {
        const salao = await new Salao(req.body).save(); //Construtor de salão e salvando
        res.json({ salao });
    } catch (err) {
        res.json({ error: true, message: err.message })
    }
});

router.get('/servicos/:salaoId', async (req, res) =>{
    try{
        const { salaoId } = req.params;
        const servicos = await Servico.find({
            salaoId,
            status: 'A'
        }).select('_id titulo');

        /* formato dos serviços = [{label: 'Servico', value: '123123123' }]*/
        res.json({
            servicos: servicos.map((s) => ({ label: s.titulo, value: s._id })),
        });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }

})

module.exports = router;