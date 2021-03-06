'use strict'

var express = require('express');
var FollowController = require('../controllers/follow');
var api = express.Router();
var md_auth =require('../middlewares/authenticated');

//api.get('/pruebas-follow', md_auth.ensureAuth, FollowController.prueba); //ensureAuth mira el token si es correcto o incorrecto
api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow); //ensureAuth mira el token si es correcto o incorrecto
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow); //ensureAuth mira el token si es correcto o incorrecto
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;