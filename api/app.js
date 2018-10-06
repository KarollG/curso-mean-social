'use strict'

var express =require('express');
var app = express();
//var app = express(); 
var bodyParser = require('body-parser')
var lodash = require('lodash');

var output = lodash.without([1,2,3],1);
console.log(output);

//cargar rutas 
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');

//middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
//cors


//exportar 
module.exports = app;

//rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);

/*app.get('/', (req,res) => {
	res.status(200).send({
		message: 'Hola mundo desde el servidor de NodeJS'
	});
});
app.post('/pruebas', (req,res) => {
	console.log(req.body);
	res.status(200).send({
		message: 'Acción de pruebas en el servidor de NodeJS'
	});
});*/

