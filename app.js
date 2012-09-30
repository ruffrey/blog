
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
  , general = JSON.parse(fs.readFileSync('./general.json', 'utf8'))
  , secret = '98Jns104bf76zzx4'
  , app = module.exports = express.createServer()
;

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('users', users);
  app.set('secret', secret);
  
  app.set('general', general);
  
  app.set('blogs', JSON.parse(fs.readFileSync('./blogs.json', 'utf8')) );
  
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: secret }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.dynamicHelpers({
    session: function (req, res) {
        return req.session;
    },
	blogs: function (req, res) {
		return req.app.settings.blogs;
	},
	users: function (req, res) {
		return req.app.settings.users;
	},
	general: function (req, res) {
		return req.app.settings.general;
	}
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

/* ROUTES */

/* always auth */
app.all('/accounts/*', routes.requireAuthentication);
app.all('/accounts', routes.requireAuthentication);
app.all('/manage/*', routes.requireAuthentication);
app.all('/manage', routes.requireAuthentication);
app.all('/accounts/*', routes.requireAdminOrUser);
app.all('/accounts/admin/*', routes.requireAdmin);
app.all('/manage/general/save', routes.requireAdmin);

/* account stuff */
app.get('/login', routes.manage.dash);
app.post('/login', routes.accounts.login);
app.get('/logout', routes.accounts.logout);

app.get('/accounts/create', routes.accounts.views.create);
app.post('/accounts/create', routes.accounts.create);
app.get('/accounts/admin/makeAdmin/:login', routes.accounts.admin.makeAdmin);
app.get('/accounts/admin/unmakeAdmin/:login', routes.accounts.admin.unmakeAdmin);

app.get('/accounts/edit/:login', routes.accounts.views.edit);

app.get('/accounts/remove/:deleteLogin', routes.accounts.views.remove);

app.post('/accounts/remove/:deleteLogin', routes.accounts.remove);

/* blog management */
app.get('/manage/blogs/create', routes.manage.blogs.create);
app.get('/manage/blogs/edit/:urltitle', routes.manage.blogs.edit);
app.post('/manage/blogs/save', routes.manage.blogs.save);
app.get('/manage/blogs/:urltitle/publish', routes.manage.blogs.publish);
app.get('/manage/blogs/:urltitle/unpublish', routes.manage.blogs.unpublish);

app.get('/manage/blogs/:urltitle/preview', routes.blogs.view);

app.post('/manage/general/save', routes.manage.general.save);


/* app management */
app.get('/manage', routes.manage.dash);
app.get('/manage/dash', routes.manage.dash);

/* general viewer stuff */
app.get('/', routes.blogs.mostRecent);

app.get('/blogs/:urltitle', routes.blogs.view);
app.get('/blogs', routes.blogs.archive);

app.get('/search/:query', routes.blogs.search);
app.get('/search', routes.blogs.search);

// custom 404
app.use(function(req,res){
    res.render('404', {title: "[wigglebytes] - Not found"});
});

app.listen(3000, function(){
	console.info("Express server listening at http://localhost:%d in %s mode"
	   ,app.address().port
	   ,app.settings.env
	);

});
