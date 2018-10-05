'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_desarrollar_red_social_angular'; 

exports.ensureAuth = function(req, res, next){ //req datos que recivimos en la peticion , la respon la respuesta que se va a estar dando y next la funcionalidad que nos permite saltar a otra cosa 
	if(!req.headers.authorization){
		return res.status(403).send({message: 'La peticion no tiene la cabecera de autenticación'});
	}

	var token = req.headers.authorization.replace(/["']+/g, '');

	try	{
		var payload = jwt.decode(token, secret); //payload sensible a excepciones por eso se mete al try catch
		if(payload.exp <= moment().unix()){
			return res.status(401).send({
				message:'El token ha expirado'
			});
		}
	}catch(ex){
		return res.status(404).send({
				message:'El token no es valido'
			});
	}
	
	req.user = payload; //EL pay se resetea en la propiedad user en una req  
	next();
}