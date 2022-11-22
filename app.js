//importando modulos.
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const admin = require('./routes/admin')
const path = require('path')
const mongoose = require('mongoose');
const session = require("express-session")
const flash = require("connect-flash") //a menssagem só vai aparecer uma vez, quando carregar a pagina dnv vai ter sumido, serve como menssagens rápidas.
require("./models/Postagem")
const Postagem = mongoose.model("postagens")
require("./models/Categoria")
const Categoria = mongoose.model("categorias")
const usuarios = require("./routes/usuario")
const passport = require("passport")
require("./config/auth")(passport)

//Config.
    //Sessão
        app.use(session({
            secret: "podecolocarqualquercoisa",
            resave: true,
            saveUninitialized: true
        }))
    //tem que ser aqui essas config.
        app.use(passport.initialize())
        app.use(passport.session())
    //Flash, tem q ser abaixo da Sessão.
        app.use(flash())    

    //Middleware, algo que esta entre as conexões entre cliente e servidor.
        app.use((req, res, next) =>{
            res.locals.success_msg = req.flash("success_msg"), //.locals = criar variaveis globais.
            res.locals.error_msg = req.flash("error_msg")
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null //armazenar dados do usuario logado
            next()
        })

    //Body-Parser.
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());

    //Handlebars.
        app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}));
        app.set('view engine', 'handlebars')

    //Mongoose.
        mongoose.connect('mongodb://localhost/Usuarios').then(() =>{
            console.log('Conectado ao Banco de Dados.')
        }).catch((err) =>{
            console.log("Erro: " + err)
        })

    //Public.
        app.use(express.static(path.join(__dirname, 'public'))) // falando pro express que a pasta que esta guardando todos os arquivos estaticos é a pasta public, "path.join(__dirname" falando para pegar o caminho absoluto, assim evitando alguns erros.


//Rota padrão, rota inicial.
    app.get("/", (req, res) =>{
        Postagem.find().lean().populate("categoria").sort({data: "desc"}).then((posatagens) =>{
            res.render("index", {postagens: posatagens})
        }).catch((err)=>{
            return res.status(404).send(err.message);
        })
    })

    app.get("/postagem/:slug", (req, res) =>{
        Postagem.findOne({slug: req.params.slug}).lean().then((postagem) =>{
            if(postagem){
                res.render("postagem/index", {postagem, postagem})
            }else{
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect("/")
            }
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")
        })
    })

    app.get("/categorias" , (req, res) =>{
        Categoria.find().lean().then((categorias) =>{
            res.render("categorias/index" , {categorias: categorias})
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao carregar as categorias")
            res.redirect("/")
        })
    })


    app.get("/categorias/:slug", (req, res) =>{
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) =>{
            if(categoria){
                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render("categorias/postagem" , {postagens: postagens , categoria: categoria})
                }).catch((err) =>{
                    req.flash("error_msg", "Houve um erro ao listar os posts!")
                    res.redirect("/")
                })
            }else{
                req.flash("error_msg", "Esta categoria não existe")
                res.redirect("/")
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")
        })
    })

//Grupo de rotas.
app.use('/admin' , admin)
app.use('/usuarios', usuarios)

//Ligando o servidor.
app.listen(8080, () =>{
    console.log("Servidor rodando...")
})