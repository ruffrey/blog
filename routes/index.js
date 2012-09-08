
function comparePubdate(a, b) {
	if (a.pubdate < b.pubdate)
		return -1;
	if (a.pubdate > b.pubdate)
		return 1;
	return 0;
}

function compareMatches(a, b) {
	if (a.matches < b.matches)
		return -1;
	if (a.matches > b.matches)
		return 1;
	return 0;
}

function hash(passwd, salt) {
    return crypto
		.createHmac('sha256', salt.toString('base64') )
		.update(passwd)
		.digest('base64');
}

function refreshBlogs(req, objBlogs){
	var fs;!fs && (fs = require('fs'));
	
	fs.writeFileSync('./blogs.json', JSON.stringify(objBlogs));
		
	req.app.set('blogs', objBlogs);
	console.log('Blogs saved.');
}

function refreshUsers(req, objUsers){
	var fs;!fs && (fs = require('fs'));
	
	fs.writeFileSync('./users.json', JSON.stringify(objUsers));
		
	req.app.set('users', objUsers);
	console.log('Users saved.');
}

var fs = require('fs')
   ,crypto = require('crypto');

/* auth */
exports.requireAuthentication = function(req, res, next){
	if(
		!req.session.login
	)
	{
		res.render('login', {
			title : 'Log in'
		});
	}
	else{
		next();
	}
};


exports.accounts = {};

/* logging in */
exports.accounts.login = function(req, res, next){
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
		var hpw = hash( req.body.password, req.app.settings.secret );
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
			req.session.login = req.body.login;
			req.session.display = users[req.body.login].display;
			res.render('manage/dash', {
				title: 'Dashboard'
			});
		}
	}
};

/* logging out */
exports.accounts.logout = function(req,res){
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

exports.accounts.views = {
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

exports.accounts.remove = function(req,res){
	var users = req.app.settings.users;
	
	delete( users[ req.params.deleteLogin ]);
	
	refreshUsers(req,users);
	
	res.render('manage/dash', {
		title: 'User Management'
	   ,notify: 'Account '+req.params.deleteLogin+' was deleted.'
	});
};

// for create and update
exports.accounts.create = function(req,res){
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
		/* add to global user object, but first delete the previous object if
		 * the login changed.
		 * also hash password first.
		 */
		if(create.origLogin.length>0 && create.origLogin!=create.login)
		{
			delete users[create.origLogin];
		}
		users[create.login] = {};
		
		/* only reset password if this is a new account or if the password wasn't blank */
		if( create.origLogin.length==0
			|| (create.origLogin.length>0 && create.password.length>0)
		)
		{
			users[create.login].password = hash(create.password, req.app.settings.secret)
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
		refreshUsers(req,users);
		
		res.render('manage/dash', {
			title: 'User Management'
		   ,notify: 'Account settings saved successfully.'
		});
	}
	
};

/* manage - dashboard */
exports.manage = {};
exports.manage.dash = function(req,res){
	res.render('manage/dash', {
		title : 'Dashboard'
	});
};

/* View Rendering / Routing */
exports.index = function (req, res) {
	var blogs = req.app.settings.blogs;
	
	var mostRecent = [];
	
	// put into an array first
	for (var b in blogs) {
		mostRecent.push(blogs[b]);
		mostRecent[mostRecent.length - 1].blogClassname = b;
	}
	
	// then sort by the date, the most recent first
	mostRecent.sort(comparePubdate).reverse();
	
	// cut off the end
	mostRecent.splice(2);
	
	res.render('index', {
		title : 'wigglebytes',
		recent : mostRecent
	});
};

// archive
exports.allBlogs = function (req, res) {
	var blogs = req.app.settings.blogs;
	var allb = [];
	
	// put into an array first
	for (var b in blogs) {
		allb.push(blogs[b]);
		allb[allb.length - 1].blogClassname = b;
	}
	
	// then sort by the date, the most recent first
	allb.sort(comparePubdate).reverse();
	
	res.render('archive', {
		title : 'wigglebytes',
		allb : allb
	});
	
};

// View a blog
exports.blogs = function (req, res) {
	var blogClassname = req.params.urltitle.replace(/\-/g, '_');
	
	var blogs = req.app.settings.blogs;
	
	if (typeof(blogs[blogClassname]) == 'object'
		 && blogs[blogClassname].published) {
		// view name is the same as the classname
		blogs[blogClassname].view = blogClassname;
		
		blogs[blogClassname].title = '[wigglebytes] ' + blogs[blogClassname].blogtitle;
		
		res.render('blogwrap', blogs[blogClassname]);
	} else {
		res.render('404', {
			title : '[wigglebytes] - Not found'
		});
	}
};

/* Search by tags or keywords */
exports.search = function (req, res) {
	var query = typeof(req.query.query) == 'undefined'
		// if in url segment
		 ? decodeURIComponent(req.params.query)
		// if in querystring
		 : decodeURIComponent(req.query.query)
		// split on spaces and commas
	,
	queryTerms = query.toLowerCase().split(/[\s,]+/),
	blogs = req.app.settings.blogs,
	found = [],
	matches = 0,
	t = 0,
	q = 0;
	
	for (var b in blogs) {
		matches = 0;
		// need to find any matching tags
		for (t = 0; t < blogs[b].tags.length; t++) {
			for (q = 0; q < queryTerms.length; q++) {
				if (blogs[b].tags[t].toLowerCase().indexOf(queryTerms[q]) > -1) {
					matches++;
				}
			}
			
		}
		// find any matching title words too
		for (q = 0; q < queryTerms.length; q++) {
			if (b.toLowerCase().indexOf(queryTerms[q]) > -1) {
				matches++;
			}
		}
		
		if (matches > 0) {
			blogs[b].matches = matches;
			blogs[b].blogClassname = b;
			found.push(blogs[b]);
		}
	}
	
	if (found.length == 1) {
		
		var blog = found[0];
		blog.view = blog.blogClassname;
		blog.title = '[wigglebytes] ' + blog.blogtitle;
		
		res.render('blogwrap', blog);
	} else {
		// need to show the most relevant first
		found.sort(compareMatches).reverse();
		
		res.render('search', {
			found : found,
			title : "Search for '" + query + "'"
		});
	}
	
};
