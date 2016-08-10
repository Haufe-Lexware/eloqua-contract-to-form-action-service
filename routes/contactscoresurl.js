var express = require('express');
var router = express.Router();
var b64 = require('b64');
var https = require('https');
var config = require('../config.js');

var baseUrlHandler = require("../js/baseUrl.js");
var promiseHandler = require("../js/promise.js");
var fs = require('fs');

var configFile;

/* GET. the main view of the app*/
router.get('/contacts/',
    function (req, res, next) {
        console.log("\n===== Connected to GET URL successfuly =====");

        res.render('contact', { contactScore: [] });
        res.end();
    });

router.get('/contacts/:id',
    function (req, res, next) {

        //Use referer to secure the endpoint
        console.log("referer: " + req.headers['referer']);

        var contactId = req.params.id;
        if (contactId) {
            config.init('');
            baseUrlHandler.getBaseUrl().then(function () {
                console.log("\n ===== Got base Path... =====");
                var scoreModels = config.getConfig('scoreModels');

                promiseHandler.getBodyPromiseByPath(scoreModels).then(function (results) {
                    console.log('===== Updating model =====');

                    var resultsObject = JSON.parse(results);
                    var currentModels = resultsObject.items;

                    var promises = [];

                    for (i in currentModels) {
                        var modelId = currentModels[i].id;
                        var promise = getScores(contactId, modelId);
                        promises[i] = promise;
                    }

                    Promise.all(promises).then(function (value) {
                        console.log('===== Got all scores =====');

                        var scores = JSON.parse('[' + value + ']');

                        var valueToDisplay = setModel(scores, currentModels);

                        res.render('contact', { contactScore: valueToDisplay });
                        res.end();

                    }, function (error) {
                        console.log(error);
                        res.error(error);

                    });
                }, function (error) {
                    console.log(error);
                    res.error(error);

                })
            });
        }
        else {
            res.render('contact', { contactScore: [] });
        }
    });

function fileExists(filePath) {
    try {
        fs.statSync(filePath);
    }
    catch (err) {
        return false;
    }
    return true;
}

function setModel(scores, currentModels) {
    var valueToDisplay = [];

    for (i in scores) {
        var valuesForModel = scores[i];

        if (valuesForModel.length > 0) {
            var lastIndex = valuesForModel.length - 1;
            var currentScores = valuesForModel.sort(comp);

            var currentScore = valuesForModel[lastIndex];

            var score = currentScore.aspectScores[1].unmappedScore;
            if (score > 0) {
                var exists = fileExists(appRoot + "/config/models.json");
                if (exists) {
                    configFile = require("../config/models.json");
                    for (j in configFile) {
                        if (currentScore.model.id == configFile[j].id) {
                            currentScore.model.name = configFile[j].name;
                            valueToDisplay.push(currentScore);
                        }
                    }
                }
                else {
                    //display all if no config file present 
                    for (j in currentModels) {

                        console.log(currentScore.model.id);

                        if (currentScore.model.id == currentModels[j].id) {
                            currentScore.model.name = currentModels[j].name;

                            valueToDisplay.push(currentScore);
                        }
                    }
                }
            }
        }
    }

    return valueToDisplay;
}

function isNumeric(n) {
    return (typeof n == "number" && !isNaN(n));
}

function getScores(contactId, modelId) {

    var contactDetailOptions = config.getConfig('allScores');

    if (!isNumeric(contactId)) {
        contactId = "";
    }
    contactDetailOptions.path = contactDetailOptions.path.replace('{id}', contactId);

    var shortUrl = contactDetailOptions.path.substring(0, contactDetailOptions.path.lastIndexOf("/")) + '/' + modelId;
    contactDetailOptions.path = shortUrl;
    return promiseHandler.getBodyPromiseByPath(contactDetailOptions);
}

function comp(a, b) {
    return a.lastScoredAt - b.lastScoredAt;
}

module.exports = router;