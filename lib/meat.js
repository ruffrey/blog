/* Meat.
 * Blogging in Node.js
 * MIT Licensed. Copyright 2012 Wiggleware
 **/
var crypto = require('crypto')
  , fs = require('fs');


/* Sort functions */
exports.compare = require('./compare');

/* hashing password */
exports.hash = function(passwd, salt) {
	var hashed = crypto
		.createHmac('sha256', salt.toString('base64') )
		.update(passwd)
		.digest('base64');
	console.log(hashed);
    return hashed;
};

/* refreshing global variables */
exports.refresh = require('./fresh');