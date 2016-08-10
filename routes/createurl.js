var express = require('express');
var router = express.Router();
var b64 = require('b64');
var https = require('https');

/* POST initialise eloqua settings. */
router.post('/', function (req, res, next) {
	console.log("\n===== Connected to CREATE URL successfuly =====");
	res.json({
		"recordDefinition":{
			"ContactID":"{{Contact.Id}}",
		},
		"requiresConfiguration": true
	});
});

module.exports = router;

