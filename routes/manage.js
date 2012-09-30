var meat = require('./../lib/meat')
   ,fs = require('fs');

/* manage - dashboard */
exports.manage = {};
exports.dash = function(req,res){
	res.render('manage/dash', {
		title : 'Dashboard'
	});
};

exports.blogs = {};

/* create a blog */
exports.blogs.create = function(req,res){
	res.render('manage/create_blog', {
		title: 'Blog - create new '
	});
};

/* edit a blog */
exports.blogs.edit = function(req,res){
	var blogClassname = req.params.urltitle.replace(/\-/g, '_');
	
	var b = req.app.settings.blogs[blogClassname] || {};
	
	b.classname = blogClassname;
	
	var title = 'Editing: ' + b.blogtitle;
	
	res.render('manage/edit_blog', {title: title, b: b });
	
};

/* toggle published */
exports.blogs.unpublish = function(req,res){
	
	var blogs = req.app.settings.blogs;
	
	blogs[ req.params.urltitle.replace(/\-/g, '_') ].published = false;
	
	meat.refresh.blogs( req, blogs );
	
	res.render('manage/dash', {
		title : 'Dashboard'
		,notify: 'Blog was unpublished.'
	});
}
exports.blogs.publish = function(req,res){

	var blogs = req.app.settings.blogs;
	
	blogs[ req.params.urltitle.replace(/\-/g, '_') ].published = true;
	
	meat.refresh.blogs( req, blogs );
	
	res.render('manage/dash', {
		title : 'Dashboard'
		,notify: 'Blog was published.'
	});
}
/* receiving blog creation/save */
exports.blogs.save = function(req,res){
	
	/* Delete unnecessary properties after they are no longer needed */
	
	var action = req.body.origClassname ? 'saved' : 'created';
	
	var oblogs = req.app.settings.blogs;
	
	var cl = req.body.classname.replace(/[^0-9a-z\_]/g,'_');
	
	delete req.body.classname;
	
	oblogs[cl] = oblogs[cl] || {};
	
	/* is it a save and did the filename change? */
	if( req.body.origClassname
		&& req.body.origClassname != cl 
	)
	{
		fs.unlinkSync('./views/blogs/'+req.body.origClassname+'.ejs');
		delete oblogs[req.body.origClassname];
		delete req.body.origClassname;
	}
	
	/* write out the changes */
	fs.writeFileSync('./views/blogs/'+cl+'.ejs', req.body.blogtext);
	delete req.body.blogtext;
	
	/* trimming tags and turning into array */
	oblogs[cl].tags = req.body.tags
						.replace(/\,\s/g,',')
						.replace(/\s\,/g,',')
						.split(',');
	
	delete req.body.tags;
	
	/* parse into boolean */
	req.body.published = req.body.published ? true : false;
	
	for( var b in req.body )
	{
		oblogs[cl][b] = req.body[b];
	}
	
	meat.refresh.blogs(req, oblogs);
	
	res.render('manage/dash', {
		title: 'Dashboard'
	   ,notify: '"'+req.body.blogtitle+'" was '+action+' successfully.'
	});
};

exports.general={};
/* Saving general settings */
exports.general.save = function (req, res) {
	
	req.body.blogs_on_homepage = parseFloat(req.body.blogs_on_homepage) || 5;
	
	meat.refresh.general(req, req.body);
	
	res.render('manage/dash', {
		title: 'Dashboard'
	   ,notify: 'Settings were saved successfully.'
	});

};