var fs = require('fs')
   ,meat = require('./../lib/meat');

/* auth */
exports.requireAuthentication = function(req, res, next){
	if( !req.session.login )
	{
		res.render('login', {
			title : 'Log in'
		});
	}
	else{
		next();
	}
};

exports.requireAdmin = function(req, res, next){
	if( !req.session.admin )
	{
		res.render('manage/dash', {
			title : 'Dashboard'
			,danger: 'You are not allowed to do that.'
		});
	}
	else{
		next();
	}
};

exports.requireAdminOrUser = function(req, res, next){
	if( !req.session.admin 
		&& req.session.login != req.params.login  
		&& req.session.login != req.params.deleteLogin  
	)
	{
		res.render('manage/dash', {
			title : 'Dashboard'
			,danger: 'You are not allowed to do that.'
		});
	}
	else{
		next();
	}
};

/* View Rendering / Routing */
exports.accounts = require('./accounts');
exports.manage = require('./manage');
exports.blogs = require('./blogs');


