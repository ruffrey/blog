/* Used to refresh the global variables
 * and save them to disk */

exports.blogs = function(req, objBlogs){
	var fs;!fs && (fs = require('fs'));
	
	fs.writeFileSync('./blogs.json', JSON.stringify(objBlogs));
		
	req.app.set('blogs', objBlogs);
	console.log('Blogs saved.');
};

exports.users = function(req, objUsers){
	var fs;!fs && (fs = require('fs'));
	
	fs.writeFileSync('./users.json', JSON.stringify(objUsers));
		
	req.app.set('users', objUsers);
	console.log('Users saved.');
};

exports.general = function(req, objGen){
	var fs;!fs && (fs = require('fs'));
	
	fs.writeFileSync('./general.json', JSON.stringify(objGen));
		
	req.app.set('general', objGen);
	console.log('General settings saved.');
};