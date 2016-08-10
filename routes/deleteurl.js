var express = require('express');
var router = express.Router();
var b64 = require('b64');
var https = require('https');

var instanceModel = require('../models/instance.js');

/* POST delete eloqua settings. */
router.delete('/', function (req, res, next) {
	console.log("\n===== Connected to delete URL successfuly =====");

    // Cleanup if needed
    var instanceId = req.query.instance;
    instanceModel.findByIdAndRemove(instanceId,function(err, obj) {
        //if (err) next(err);
        //res.json(200, obj);
    });
    
	res.end();
});

module.exports = router;