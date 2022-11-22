const mongoose = require('mongoose')
const Schema = mongoose.Schema;

//Criando as colections = categorias = tabela
const Categoria = new Schema({
    nome: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

mongoose.model('categorias', Categoria)