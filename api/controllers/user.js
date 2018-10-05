'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs'); //fi system de node - permite trabajar con archivos 
var path = require('path'); //permite trabajar con ficheros

var User = require('../models/user'); // primera letra en mayuscula para indicarque es un modelo
var Follow = require('../models/follow'); 
var jwt = require('../services/jwt');

//Métodos de prueba
function home(req,res){
	res.status(200).send({
		message: 'Hola mundo desde el servidor de NodeJS'
	});
}
function pruebas(req,res){
	console.log(req.body);
	res.status(200).send({
		message: 'Acción de pruebas en el servidor de NodeJS'
	});
}

//Registro
function saveUser(req, res){ //req =request y res= responsive
	var params = req.body;
	var user = new User();

	if(params.name && params.surname &&
		params.nick && params.email && params.password){

		user.name = params.name;
		user.surname = params.surname;
		user.nick = params.nick;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;

		//Controlar usuarios duplicados  
		User.find({ $or: [  //coma(,) es un and y el or (o) es así.  VALIDACION para poder crear (no crea si y existe el correo y el nick)
							 {email: user.email.toLowerCase()},  //busca los usuarios que ya tengan este correo
							 {nick: user.nick.toLowerCase()} //busca los usuarios que ya tengan este nick 
							 ]
					}).exec((err, users) =>{
						if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});

						if(users && users.length >= 1){
							return res.status(200).send({message: 'El usuario que intenta registrar ya existe!'}); //clasusula de guardas .. hacer un return antes de ejecutar cosas para ahorrar lineas de codigo --Ejecución mas rapida
						}else{
							//Cifra la password y me guarda los datos 
		bcrypt.hash(params.password, null, null, (err, hash) => { //encriptar contraseñas
			user.password = hash;

			user.save((err, userStored) => {
				if(err) return res.status(500).send({message: 'Error al guardar el usuario'});

				if(userStored){
					res.status(200).send({user: userStored});
				}else{
					res.status(404).send({message: 'No se ha registrado el usuario'});
				}

			}); // funcion de calvac yque se le hace una funcion de flecha
		});

						}
					}); 

			} else {
		res.status(200).send({
			message: 'Envia todos los campos necesarios!!'
		});
	}
}
//metodo del registro ya realizado

//Login 
function loginUser(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;

	//comprobar usuarios y contraseñas con la db
	User.findOne({email: email }, (err, user) => { //findOne para sacar un solo registro y la , es un and
		if(err)  return res.status(500).send({message: 'Error en la petición'});
		//en el caso no se devuelva nada y de que todo vaya bien
		if(user){
			bcrypt.compare(password, user.password, (err, check) => { //comprobar la clave para dejar pasar
				if(check){
					
					if(params.gettoken){
						//generar y devolver el token  
						return res.status(200).send({
							token: jwt.createToken(user)
						});
					}else{
						//devolver datos de usuario 
						user.password = undefined; //Eliminando la propiedad del objeto javascript para que no la devuelva 
						return res.status(200).send({user})
					}
					
				} else {
					//error devolver 
					return res.status(404).send({message: 'El usuario no se ha podido identificar'});
				}
			}); 
		} else{
			return res.status(404).send({message: 'El usuario no se ha podido identificar!!'});
		}
	}); 
}

// Metodo que devuelva los datos del usuario ( metodo para conseguir datos de un usuario)
function getUser(req, res){
	var userId = req.params.id;  //llegan datos por la url -- params , cuando llegan datos por post y put se utiliza el body
//devuelveun objetocon el usuario y otro con el seguido
	//Dentro de una llamada se haceotra  
	User.findById(userId, (err, user) => { //model User y metodo findById() - llamada
		if(err) return res.status(500).send({message: 'Error en la petición'});
		//ver si el usurio no llega
		if(!user) return res.status(404).send({message: 'El usuario no existe'});
		// usuario solicitado
		followThisUser(req.user.sub, userId).then((value) =>{
			user.password = undefined;
			
			return res.status(200).send({
				user,
				following: value.following,
				followed: value.followed
			});
		});	
	});
}

//funciona como cucalquier leng de programación de manera asyncrono -sincrono
//EL metodo async me devuelve una promesa por lo tanto se puede llamr
async function followThisUser(identity_user_id, user_id){
	try{
		var following = await Follow.findOne({user: identity_user_id, followed:user_id}).exec()
			.then((following) => {
				console.log(following);
				return following;
			})  //exec para ejecutaar laquery. //guardando el resultado que devuelve el find
			.catch((err)=>{
				return handleerror(err);
			});

		var followed = await Follow.findOne({user: user_id, followed:identity_user_id}).exec()
			.then((followed) => {
				console.log(followed);
				return followed;
			})
			.catch((err)=>{
				return handleerror(err);
			});
			
		return{
			following: following,
			followed: followed
		}
	} catch(e){
		console.log(e);
	}	
}
//Devolver un listado de usuarios paginados
function getUsers(req, res) {
	var identity_user_id = req.user.sub;  //recoger el id del usuario que este logeado en el momento , consiguiendolo (se vindeo con el middleware se obtiene un objeto completodel usuario quenos mandael token ) del token 'codificado '
					//propiedad sub ... por que ahi esta el usuario ... asi se obtiene le id del usuario logeado

	// llegue url la pagina
	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}
    
    //cantidad de usuarios que se mostraron por pagina
	var itemsPerPage = 5;  // cinco usuarios por pagina 

	User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
	
		return res.status(200).send({
			users, // node interpreta que users: users que users esta dentro de luna propieda users .. para modificar el nombre si se pone con los dos puntos
			total,
			pages: Math.ceil(total/itemsPerPage) //numeros de paginas .. redondeo con el num de pages ..para sacar el num se divide total(num total de publicaciones ) entre / la cantidad de items por pag es decir usuarios por pages 
			});
		});   //es una promesa y tiene el metodo then
		
}
/**
function getUsers(req, res) {
	var identity_user_id = req.user.sub;  //recoger el id del usuario que este logeado en el momento , consiguiendolo (se vindeo con el middleware se obtiene un objeto completodel usuario quenos mandael token ) del token 'codificado '
					//propiedad sub ... por que ahi esta el usuario ... asi se obtiene le id del usuario logeado

	// llegue url la pagina
	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}
    
    //cantidad de usuarios que se mostraron por pagina
	var itemsPerPage = 5;  // cinco usuarios por pagina 

	User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});

		followUserIds(identity_user_id).then((value) => {
			
			return res.status(200).send({
				users, // node interpreta que users: users que users esta dentro de luna propieda users .. para modificar el nombre si se pone con los dos puntos
				users_following: value.following,
				users_follow_me: value.followed,
				total,
				pages: Math.ceil(total/itemsPerPage) //numeros de paginas .. redondeo con el num de pages ..para sacar el num se divide total(num total de publicaciones ) entre / la cantidad de items por pag es decir usuarios por pages 
			});
		});   //es una promesa y tiene el metodo then
		
	});
}**/
//ultimo
/**async function followUserIds(user_id){  //.select para desactivar que no me llegue ese campo 
//	var following = await Follow.find({"user":user_id}).select({'_id':0,'_v':0,'user':0}).exec((err, follows) =>{
	try{
		var following = await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec().then((follows) =>{
			return follows;
		}).catch((err) =>{
			return handleerror (err)
		});
		var followed = await Follow.find({"followed":user_id}).select({'_id':0,'__v':0,'followed':0}).exec().then((follows) =>{
			return follows;
		}).catch((err) =>{
			return handleerror(err)
		});

		var following_clean= [];
		following.forEach((follow)=>{
			following_clean.push(follow.followed);
		});

		var followed_clean= [];
		following.forEach((follow)=>{
			followed_clean.push(follow.user);
		});

		return {
			following: following_clean,
			followed: followed_clean
		}
	} catch(e){
		console.log(e);
	}
}
**/
/**async function followUserIds(user_id){  //.select para desactivar que no me llegue ese campo 
//	var following = await Follow.find({"user":user_id}).select({'_id':0,'_v':0,'user':0}).exec((err, follows) =>{
	var following = await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec().then((follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.followed);  //para tener un array limpio de ids
		});
		
		console.log(follows_clean);
		return follows_clean;
	}).catch((err) =>{
		return handleerror(err);
	});

	var followed = await Follow.find({"followed":user_id}).select({'_id':0,'__v':0,'followed':0}).exec().then((follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.user);  //para tener un array limpio de ids
		});

		return follows_clean;
	}).catch((err) =>{
		return handleerror(err);
	});
	
	console.log(following);
	return {
		following: following,
		followed: followed
	}
}**/
/**async function followUserIds(user_id){  //.select para desactivar que no me llegue ese campo 
//	var following = await Follow.find({"user":user_id}).select({'_id':0,'_v':0,'user':0}).exec((err, follows) =>{
	var following = await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec((err, follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.followed);  //para tener un array limpio de ids
		});
		
		return follows_clean;
	});

	var followed = await Follow.find({"followed":user_id}).select({'_id':0,'__v':0,'followed':0}).exec((err, follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.user);  //para tener un array limpio de ids
		});

		return follows_clean;
	});

	console.log(following);
	return {
		following: following,
		followed: followed
	}
}**/
/**
async function followUserIds(user_id){  //.select para desactivar que no me llegue ese campo 
//	var following = await Follow.find({"user":user_id}).select({'_id':0,'_v':0,'user':0}).exec((err, follows) =>{
	var following = await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec((err, follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.followed);  //para tener un array limpio de ids
		});
		
		return follows_clean;
	});

	var followed = await Follow.find({"followed":user_id}).select({'_id':0,'__v':0,'followed':0}).exec((err, follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.user);  //para tener un array limpio de ids
		});

		return follows_clean;
	});

	return {
		following: following,
		followed: followed
	}
}**/

/**
async function followUSerIds(user_id){  
	try{
		//objter los usuarios que sefuimos 
		// El select para mostrar los campos que yo quiera
		var following = await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec().then((follows) =>{
			return follows;
		}).catch((err) =>{
			return handleerror(err)
		});
     	//Objetar los usuarios que seguimos
		var followed = await Follow.find({'followed':user_id}).select({'_id':0,'__v':0,'followed':0}).exec().then((follows) =>{
			return follows;
		}).catch((err) =>{
			return handleerror(err)
		});
		
		//procesar following Ids

		var following_clean =[];

		following.forEach((follow) =>{
			following_clean.push(follow.followed);  
		});

		// procesar followed ids
		var followed_clean =[];

		followed.forEach((follow) =>{
			followed_clean.push(follow.user);
		});

		return {
			following: following_clean,
			followed: followed_clean
		}
	} catch(e){
		console.log(e);
	}

} **/

		

		
/**async function followUSerIds(user_id){  //.select para desactivar que no me llegue ese campo 
//	var following = await Follow.find({"user":user_id}).select({'_id':0,'_v':0,'user':0}).exec((err, follows) =>{
		var following = await Follow.find({"user":user_id}).select({'_id':0,'__uv':0,'user':0}).exec().then((follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.followed);  //para tener un array limpio de ids
		});
		
		console.log(follows_clean);
		return follows_clean;
	}).catch((err)=>{
		return handleerror(err);
	});

	var followed = await Follow.find({"followed":user_id}).select({'_id':0,'__uv':0,'followed':0}).exec().then((follows) =>{
		var follows_clean =[];

		follows.forEach((follow) =>{
			follows_clean.push(follow.user);  //para tener un array limpio de ids
		});

		return follows_clean;
	}).catch((err) =>{
		return handleerror(err);
	});

	console.log(following);

	return {
		following: following,
		followed: followed
	}
}
**/
/**
	var options= {
		sort: '_id',
		page: page,
		limits: itemsPerPage
	};

	User.paginate({}, options, (err, users, total) => {
		if(err){
			return res.status(500).send({message: 'Error'});
		}

		if(!users) {
			return res.status(404).send({ message: 'No hay datos'});
		}

		return res.status(200).send({
			users,
			total,
			pages: Math.ceil(total/itemsPerPage)
		});
	})
}
**/
/** **/

//Edición de datos de usuario
function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;

	//Borrar propiedad password  ... la password se manipula en otro
	delete update.password;

	if(userId != req.user.sub){ //req.user = objeto del usuario identificado - .sub = usuario identificado
		return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
	}

	User.findByIdAndUpdate(userId, update, {new: true} , (err, userUpdate) =>{ //tercer parametrro para que el mongoose devuelva un dato actulizado (new: true) mas no el parametro original 
		if(err) return res.status(500).send({message: 'Error en la petición'});	
		
		if(!userUpdate) return res.status(404).send({message: 'Nose ha podido identificar el usuario'});

		return res.status(200).send({user: userUpdate}); 	
	});


}

//Subir archivos de imagen/ avatar de usuario
function uploadImage(req, res ){
	var userId = req.params.id;

	 if(req.files){ //comprobar sillegan los archivos
	 	var file_path = req.files.image.path; //recoger camporimagen que se esta cogiendo por post
	 	console.log(file_path);
	 	
	 	var file_split = file_path.split('/');  //del path que llega cortar el nombre del archivo
	 	console.log(file_split);

	 	var file_name = file_split[2]; //posicion dos - image
	 	console.log(file_name);

	 	var ext_split = file_name.split('\.'); //cortar info archive
	 	console.log(ext_split);
	 	
	 	var file_ext = ext_split[1]; //el que contiene la extension del fichero 
	 	console.log(file_ext); //para comprobar

	 	if(userId != req.user.sub){ //req.user = objeto del usuario identificado - .sub = usuario identificado
			return removerFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
			//return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
		}

	 	if(file_ext== 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
	 			//actualizar documento de usuario logeado
	 			User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdate) =>{
	 						if(err) return res.status(500).send({message: 'Error en la petición'});	
		
							if(!userUpdate) return res.status(404).send({message: 'Nose ha podido identificar el usuario'});

							return res.status(200).send({user: userUpdate}); 	
	 			});
	 	}else{
	 		//no se ha subido y no es valida  - la esxt sea mala
	 		return removerFilesOfUploads(res, file_path, 'Extensión no válida');
	 	}

	 }else{
	 	return res.status(200).send({message: 'No se han subido imagenes'});
	 }
}

function removerFilesOfUploads(res, file_path, message ){
	fs.unlink(file_path, (err) =>{
	 			return res.status(200).send({message: message});
	 		});
}

//Devolver la imagen de un usuario  - url que se protege y esa url no espuira la imagen de ese usuario .. sera accesible por usuario identificado
function getImageFile(req, res){
	var image_file = req.params.imageFile;
	var path_file = './uploads/users/'+image_file;

	fs.exists(path_file, (exists) => {
		if (exists){
			res.sendFile(path.resolve(path_file));//escupira el fichero metodo senfile de express
		}else{
			res.status(200).send({message: 'No existe la imagen...'});
		}
	}); // comprobar que ese fichero exista
}

//Controlador del sistema de seguimiento 

//para usarlos fuera de este fichero 
module.exports = {
	home,
	pruebas,
	saveUser,
	loginUser,
	getUser,
	getUsers, 
	updateUser,
	uploadImage,
	getImageFile
}