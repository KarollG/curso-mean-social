'use strict'

var express = require('express');
var UserController = require('../controllers/user');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty'); //middleware de subida
var md_upload = multipart({uploadDir: './uploads/users'}); 

api.get('/home', UserController.home);
api.get('/pruebas', md_auth.ensureAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth,  UserController.getUser); // parametro por la url es con los :'parametro' así es obligatorio 
			//y si quisiera opciona seria :id?  ... md_auth.ensureAuth para comprobar si esta autenticado el usuario o logeado correctamente
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers); //:page?  num de pages optional 
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);   //cuando se va actualizar alguna informacion en un servicio resful se usa el metodo put .. es el metodo para actualizar recursos del api
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage); //para usar varios middlewares por un array
api.get('/get-image-user/:imageFile', UserController.getImageFile);

module.exports = api;