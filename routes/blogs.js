var meat = require('./../lib/meat');

/* Front page */
exports.mostRecent = function (req, res) {
	var blogs = req.app.settings.blogs;
	
	var mostRecent = [];
	
	// put into an array first
	for (var b in blogs) 
	{
		if( blogs[b].published )
		{		
			mostRecent.push(blogs[b]);
			mostRecent[mostRecent.length - 1].blogClassname = b;
		}
	}
	
	// then sort by the date, the most recent first
	mostRecent.sort(meat.compare.byPubdate).reverse();
	
	// cut off the end
	mostRecent.splice( req.app.settings.general.blogs_on_homepage );
	
	res.render('index', {
		title : 'wigglebytes',
		recent : mostRecent
	});
};

// archive
exports.archive = function (req, res) {
	var blogs = req.app.settings.blogs;
	var allb = [];
	
	// put into an array first
	for (var b in blogs) {
		if( blogs[b].published )
		{
			allb.push(blogs[b]);
			allb[allb.length - 1].blogClassname = b;
		}
	}
	
	// then sort by the date, the most recent first
	allb.sort(meat.compare.byPubdate).reverse();
	
	res.render('archive', {
		title : 'wigglebytes',
		allb : allb
	});
	
};

// View a blog
exports.view = function (req, res) {
	
	var blogClassname = req.params.urltitle.replace(/\-/g, '_');
	
	var isPreview = req.path.lastIndexOf('preview') > req.path.lastIndexOf(req.params.urltitle);
		
	var blogs = req.app.settings.blogs;
	
	if(
		typeof(blogs[blogClassname]) == 'object' 
		&& 
		( blogs[blogClassname].published || isPreview )
	)
	{
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
	
	for (var b in blogs) 
	{
		if( blogs[b].published )
		{
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
			for (q = 0; q < queryTerms.length; q++) 
			{
				if (b.toLowerCase().indexOf(queryTerms[q]) > -1) 
				{
					matches++;
				}
			}
			
			if (matches > 0) 
			{
				blogs[b].matches = matches;
				blogs[b].blogClassname = b;
				found.push(blogs[b]);
			}
		}
	}
	
	if (found.length == 1) 
	{
		
		var blog = found[0];
		blog.view = blog.blogClassname;
		blog.title = '[wigglebytes] ' + blog.blogtitle;
		
		res.render('blogwrap', blog);
	} else {
		// need to show the most relevant first
		found.sort(meat.compare.byMatches).reverse();
		
		res.render('search', {
			found : found,
			title : "Search for '" + query + "'"
		});
	}
	
};
