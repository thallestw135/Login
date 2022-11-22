const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")
const bcrypt = require("bcryptjs")
const passport = require("passport")

router.get("/registro" , (req, res) =>{
    res.render("usuarios/registro")
})

router.post("/registro", (req, res) =>{
    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "nome inválido"})
    }

    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
        erros.push({texto: "email inválido"})
    }

    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
        erros.push({texto: "senha inválida"})
    }

    if(req.body.senha.length < 4){
        erros.push({texto: "senha muito pequena"})
    }

    if(req.body.senha != req.body.senha2){
        erros.push({texto: "As senha são diferentes"})
    }

    if(erros.length > 0){
        res.render("usuarios/registro", {erros: erros})

    }else{

        Usuario.findOne({email: req.body.email}).then((usuario) =>{
            if(usuario){
                req.flash("error_msg", "Já existe uma conta com este e-mail")
                res.redirect("/usuarios/registro")
            }else{
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(req.body.senha, salt);

                const UserData = {
                    nome : req.body.nome,
                    email : req.body.email,
                    senha : hash
                }


                new Usuario(UserData).save().then(() => {
                    req.flash('success_msg', 'Usuario cadastrado com sucesso!')
                    res.redirect('/')
                }).catch((err) => {
                    req.flash('error_msg', 'Erro ao cadastrar o usuario')
                    res.redirect("/usuarios/registro")
                })
            }
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")
        })
    }
})

router.get("/login", (req, res) =>{
    res.render("usuarios/login")
})

//autenticando
router.post('/login', (req, res, next) =>{
    passport.authenticate('local', {
        successRedirect: "/" ,
        failureRedirect: '/usuarios/login', 
        failureFlash: true 
    })(req, res, next)
})
 
router.get("/logout", (req, res, next) =>{
    req.logout((err) =>{
        if(err){return next(err)}
        req.flash("success_msg", "Deslogado com sucesso")
        res.redirect("/")
    })
})


module.exports = router