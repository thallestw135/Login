const express = require('express');
const router = express.Router(); //criar rotas em arquivos separados
const mongoose = require('mongoose')
require("../models/Categoria")
const Categoria = mongoose.model('categorias')
require("../models/Postagem")
const Postagem = mongoose.model("postagens")
const { eAdmin } = require("../helpers/eAdmin") //{ eAdmin }, pegar appenas a função eAdmin

//Rota categoria, listando as categorias.
router.get('/categorias', eAdmin, (req,res) =>{
    Categoria.find().lean().sort({date: 'desc'}).then((categorias) =>{
        res.render('admin/categorias', {categorias: categorias})
    }).catch((err) =>{
        req.flash("error_msg", "houve um erro ao listar as categorias")
        res.redirect("/admin")
    })
})

router.get('/categorias/add', eAdmin, (req, res) =>{
    res.render('admin/addcategorias')
})

//criando categoria.
router.post('/categorias/nova', eAdmin, (req, res) =>{

    var erros = []

    if(!req.body.nome || typeof req.body.nome === undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.slug || typeof req.body.slug === undefined || req.body.slug == null){
        erros.push({texto: "Slug inválido"})
    }

    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da categoria é muito pequeno"})

    }

    if(erros.length > 0){
        res.render("admin/addcategorias", {erros: erros})
    }else{
        const novaCategoria= {
            nome: req.body.nome,
            slug : req.body.slug
        }
    
        new Categoria(novaCategoria).save().then(() =>{
            req.flash("success_msg", "Categoria criada com sucesso")
            res.redirect("/admin/categorias")
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro, tente novamente")
            res.redirect('/admin')
        })
    
    }
})

//mostrando categorias já criadas
router.get('/categorias/edit/:id' , eAdmin, (req, res) =>{
    Categoria.findOne({_id: req.params.id}).lean().then((categoria) =>{
        res.render('admin/editcategorias' , {categoria: categoria})
    }).catch((err) => {
        req.flash("error_msg", "Categoria inexistente")
        res.redirect('/admin/categorias')
    })
})

//editando categoria já salva no banco de dados.
router.post("/categorias/edit", eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.body.id }).then((categoria) => {
        let erros = []

        if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
            erros.push({ texto: "Nome invalido ou igual ao anterior" })
        }
        if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
            erros.push({ texto: "Slug invalido ou igual ao anterior" })
        }
        if (req.body.nome.length < 2) {
            erros.push({ texto: "Nome da categoria muito pequeno" })
        }
        if (erros.length > 0) {
            Categoria.findOne({ _id: req.body.id }).lean().then((categoria) => {
                res.render("admin/editcategorias", { erros: erros})
            }).catch((err) => {
                req.flash("error_msg", "Erro ao pegar os dados")
                res.redirect("admin/categorias")
            })
            
        } else {
            categoria.nome = req.body.nome
            categoria.slug = req.body.slug

            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso!")
                res.redirect("/admin/categorias")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao salvar a edição da categoria")
                res.redirect("admin/categorias")
            })

        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar a categoria")
        res.redirect("/admin/categorias")
    })
})

//deletando categorias.
router.post('/categorias/deletar', eAdmin, (req, res) =>{
    Categoria.remove({_id: req.body.id}).then(() =>{
        req.flash("success_msg" , "Categoria deletada com sucesso!")
        res.redirect("/admin/categorias")
    }).catch((err) =>{
        req.flash("error_msg", "Erro ao deletar categoria")
        res.redirect("/admin/categorias")
    })
})



//Postagem, listando as postagens.
router.get('/postagens', eAdmin, (req, res) =>{

    Postagem.find().lean().populate("categoria").sort({date: "desc"}).then((postagens) =>{
        res.render("admin/postagens", {postagens: postagens})
    }).catch((err) =>{
        req.flash("error_msg", "Houve um erro ao listar as postagens")
        res.render("/admin")
    })
})

router.get("/postagens/add", eAdmin, (req, res) =>{
    Categoria.find().sort({name: "asc"}).then((categorias)=>{

        //tem que mudar a forma que o json dá as informacoes na hora de renderizar
        res.render("admin/addpostagem", {categorias: categorias.map(categorias => categorias.toJSON())})
    }).catch((err)=>{
        req.flash("error_msg", "Houve um erro ao carregar o formulario")
        res.redirect("/admin/postagens");
    })
})

//criando postagens e salvando no banco de dados.
router.post("/postagens/nova", eAdmin, (req, res) =>{

    var erros = []
    
    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria invalida, resgiste uma categoria"})
    }
    if(erros.length > 0){
        res.render('admin/addpostagem', {erros: erros})
    }

    else{
        const novaPostagem = {         // or const { titulo, slug, descricao, categoria, conteudo } = req.body
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            categoria: req.body.categoria,
            conteudo: req.body.conteudo
        }
        new Postagem(novaPostagem).save().then(() =>{
            req.flash("success_msg", "Postagem salve com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao tentar criar a postagem, tente novamente")
            res.redirect("/admin/postagens")
        })
    }
})

//listando postagens e categorias já salvos para edição.
router.get("/postagens/edit/:id", eAdmin, (req, res) =>{

    Postagem.findOne({_id: req.params.id}).lean().then((postagem) =>{
        Categoria.find().lean().then((categorias) =>{
            res.render("admin/editpostagens" , {categorias: categorias, postagem: postagem})
        }).catch((err)=>{
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin/postagens")
        })
    }).catch((err) =>{
        req.flash("error_msg", "Houve um erro ao listar as postagens")
        res.redirect("/admin/postagens")
    })

})

//editando postagens.
router.post("/postagem/id", eAdmin, (req, res) =>{
    
    Postagem.findOne({_id: req.body.id}).then((postagem) =>{ 
        
        postagem.titulo = req.body.titulo                   // or const { postagem.titulo, postagem.slug, postagem.descricao, postagem.categoria, postagem.conteudo } = req.body 
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.categoria = req.body.categoria
        postagem.conteudo = req.body.conteudo
        postagem.date - req.body.date
        

        postagem.save().then(() =>{
            req.flash("success_msg" , "Postagem editada com sucesso")
            res.redirect("/admin/postagens")
        }).catch((err) =>{
            req.flash("error_msg" , "Erro interno")
            res.redirect("admin/postagens")
        })
    }).catch((err) =>{
        req.flash("error_msg" , "Houve um erro ao salver a edição")
        res.redirect("/admin/postagens")
    })
})

//deletando postagens
router.get("/postagens/deletar/:id", eAdmin, (req, res) =>{
    Postagem.remove({_id: req.params.id}).then(() =>{
        req.flash("success_msg", "Postagem removida")
        res.redirect("/admin/postagens")
    }).catch((err) =>{
        req.flash("error_msg", "Erro ao remover a postagem")
        res.redirect("/admin/postagens")
    })
})

module.exports = router