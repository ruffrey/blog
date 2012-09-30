var meat = require('./../lib/meat');

/* logging in */
exports.login = function(req, res, next){
	if(req.session.failedAttempts>5) 
	{
		console.info('Login locked');
		res.render('accounts/disabled', { 
			title: 'LOCKED'
		   ,danger: 'Site has been temporarily locked.'
		});
	}
	else{
		!req.session.failedAttempts && (req.session.failedAttempts=1);
		
		var failmessage = 'Invalid username/password combo, or user does not exist.';
		var hpw = meat.hash( req.body.password, req.app.settings.secret );
		var users = req.app.settings.users;
		
		if( users[ req.body.login ].password != hpw )
		{
			var thisAttempt = req.session.failedAttempts;
			req.session.failedAttempts++;
			
			res.render('login', {
				title : 'Log in'
			   ,danger: failmessage
			   ,message: 'Failed attempt number '+thisAttempt+'.'
			});
		} 
		else {
			var usr = req.app.settings.users[ req.body.login ];
			
			usr.login = req.body.login;
			
			for( var u in usr )
			{
				req.session[u] = usr[u];
			}
			
			res.render('manage/dash', {
				title: 'Dashboard'
			});
		}
	}
};

/* logging out */
exports.logout = function(req,res){
	req.session.regenerate(function(err){
		if(err){ 
			console.log(err); 
			res.send(500,'Oops.');
		} else {
			res.render('logout', {
				title: 'Wigglebytes'
			   ,notify: 'Logout successful.'
			});			
		}
	});
};

/* new account creation */
var account = {
	properties: {
		login: ''
	   ,display: ''
	   ,password: ''
	   ,confirmPassword: ''
	   ,origLogin: ''
	   ,admin: false
	},
	validations: {
		login: function(v){
			if( v.length>0 ) 
			{ 
				if( (v.match(/\s/g) || '').length>0 ) 
				{ 
					return 'Login cannot have spaces.' ;
				}
				if( (v.match(/[^a-zA-Z0-9]/) || '').length>0 ) 
				{ 
					return 'Login cannot have special chars.' 
				}
			}
			else{ 
				return 'Login cannot be blank.'; 
			}
			
			return true;
		},
		display: function(v){
			if( v.length==0 ) { return 'Display cannot be blank.' };
			return true;
		},
		password: function(v,c){
			if( v!=c.confirmPassword ) {return 'Passwords must match.';}
			if( v.length==0 && !c.origLogin ) {return 'Password cannot be blank';}
			else {return true;}
		},
		confirmPassword: function(v){
			return true;
		},
		origLogin: function(v){
			return true;
		}
		
	}
};

exports.views = {
	create: function(req,res){
		res.render('accounts/create', {
			title: 'User Management'
		   ,create: account.properties
		});
	},
	edit: function(req,res){
		var acct = req.app.settings.users[req.params.login];
		acct.login = acct.origLogin = req.params.login;
		// empty password
		acct.password = acct.confirmPassword = '';
		
		res.render('accounts/create', {
			title: 'User Management - editing ' + req.params.login
		   ,create: acct
		});
	},
	remove: function(req,res){
		res.render('accounts/confirmDelete', {
			title: 'User Management - deleting ' + req.params.deleteLogin
		   ,deleteLogin: req.params.deleteLogin
		});
	}
};

/* admin role */
exports.admin = {};

exports.admin.makeAdmin = function(req,res){
	var users = req.app.settings.users;
	
	users[ req.params.login ].admin = true;
	
	meat.refresh.users(req,users);
	
	res.render('manage/dash', {
		title: 'User Management'
	   ,notify: 'Account '+req.params.login+' is now an admin.'
	});
};

exports.admin.unmakeAdmin = function(req,res){
	var users = req.app.settings.users;
	
	users[ req.params.login ].admin = false;
	
	meat.refresh.users(req,users);
	
	res.render('manage/dash', {
		title: 'User Management'
	   ,notify: 'Account '+req.params.login+' is now not an admin.'
	});
};

exports.remove = function(req,res){
	var users = req.app.settings.users;
	
	delete( users[ req.params.deleteLogin ]);
	
	meat.refresh.users(req,users);
	
	res.render('manage/dash', {
		title: 'User Management'
	   ,notify: 'Account '+req.params.deleteLogin+' was deleted.'
	});
};

// for create and update
exports.create = function(req,res){
	var users = req.app.settings.users;
	var errors=[],_v,create=req.body;
	
	for( var a in create )
	{
		_v = account.validations[a](create[a], create);
		if( _v != true )
		{
			errors.push(_v);
		}
	}
	
	if(errors.length>0) 
	{
		create.success='no';
		create.errors = errors;
		
		res.render('accounts/create', {
			title: 'User Management'
		   ,create: create
		});
	}
	else{
		delete create.confirmPassword;
		
		/* add to global user object, but first delete the previous object if
		 * the login changed.
		 * also hash password first.
		 */
		
		users[create.login] = typeof(users[create.login])!='undefined'?users[create.login]:{}; 
		
		if(create.origLogin.length>0 && create.origLogin!=create.login)
		{
			for(var ol in users[create.origLogin])
			{
				users[create.login][ol] = users[create.origLogin][ol];
			}
			delete users[create.origLogin];
		}
		
		/* only reset password if this is a new account or if the password wasn't blank */
		if( create.origLogin.length==0
			|| (create.origLogin.length>0 && create.password.length>0)
		)
		{
			users[create.login].password = meat.hash(create.password, req.app.settings.secret)
		}
		
		/* load additional properties onto copy of global user object */
		for( var c in create )
		{
			if(c!='login' && c!='confirmPassword' && c!='password')
			{ 
				users[create.login][c] = create[c];
			}
		}
		
		/* save */
		meat.refresh.users(req,users);
		
		res.render('manage/dash', {
			title: 'User Management'
		   ,notify: 'Account settings saved successfully.'
		});
	}
	
};
