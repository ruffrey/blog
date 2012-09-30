exports.byPubdate = function(a, b) {
	var ap = a.pubdate
	   ,bp = b.pubdate
	;

	if (ap < bp)
	{
		return -1;
	}
	if (ap > bp)
	{
		return 1;
	}
	
	return 0;
};

exports.byMatches = function(a, b) {
	if (a.matches < b.matches)
		return -1;
	if (a.matches > b.matches)
		return 1;
	return 0;
};