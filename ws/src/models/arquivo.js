const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Armazenar os arquivos que forem feitos upload em qualquer model

const arquivo = new Schema({
    referenciaId:{
        type: String,
        required: Schema.Types.ObjectId,
        refPath: 'model',
    },
    model: {
        type: String,
        required: true,
        enum: ['Servico', 'Salao']
    },
    caminho: {
        type: String,
        require: true,
    },
    dataCadastro: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Arquivo', arquivo);