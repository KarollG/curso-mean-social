'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_desarrollar_red_social_angular'; //si no se conce la clave el token va hacer dificil de descifrarlo

exports.createToken = function(user){ //usuario que yo quiero generarle el token
	var payload = {
		sub: user._id,  //identificador del documento la id
		name: user.name,
		surname: user.surname,
		nick: user.nick,
		email: user.email,
		role: user.role,
		image: user.image,
		iat: moment().unix(), //fecha de creación del token .. momento exacto
		exp: moment().add(30,'days').unix
	};
 //con el payload se genera un token
 	return jwt.encode(payload, secret);
};