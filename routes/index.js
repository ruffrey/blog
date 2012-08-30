
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

var fs = require('fs');

/* View Rendering / Routing */

exports.index = function (req, res) {
	var blogs = JSON.parse(fs.readFileSync('./blogs.json', 'utf8'));
	
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
		blogs : mostRecent
	});
};

exports.allBlogs = function (req, res) {
	var blogs = JSON.parse(fs.readFileSync('./blogs.json', 'utf8'));
	
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
		blogs : allb
	});
	
};

// View a blog
exports.blogs = function (req, res) {
	var blogClassname = req.params.urltitle.replace(/\-/g, '_');
	
	var blogs = JSON.parse(fs.readFileSync('./blogs.json', 'utf8'));
	
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
		 ? decodeURIComponent(req.params.query)
		 : decodeURIComponent(req.query.query)
		// split on spaces and commas
	,
	queryTerms = query.toLowerCase().split(/[\s,]+/),
	blogs = JSON.parse(fs.readFileSync('./blogs.json', 'utf8')),
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
