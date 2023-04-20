const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const servico = new Schema({
        salaoId: {
            type: mongoose.Types.ObjectId,
            ref: 'Salao',
            required: true
        },
        titulo: {
            type: String,
            required: true
        },
        preco: {
            type: Number,
            required: true
        },
        comissao: {
            type: Number, // % de comissão sobre o preço
            required: true
        },
        duracao: {
            type: Date, // Duração em minutos do serviço
            required: true
        },
        recorrencia: {
            type: Number, // Periodo de refação do serviço
            required: true
        },
        descricao: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ['A','I', 'E'],
            default: 'A',   
        },
    dataCadastro: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Servico', servico);