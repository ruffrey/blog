
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/blogs/:urltitle', routes.blogs);
app.get('/blogs', routes.allBlogs);
app.get('/search/:query', routes.search);
app.get('/search', routes.search);

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
