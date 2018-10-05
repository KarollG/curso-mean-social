'use strict'

var mongoose = require('mongoose');
//var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var UserSchema = Schema({
		name: String,
		surname: String,
		nick: String,
		email: String,
		password: String,
		role: String,
		image: String
},	{
	collection:'users'
});

//UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User',UserSchema);