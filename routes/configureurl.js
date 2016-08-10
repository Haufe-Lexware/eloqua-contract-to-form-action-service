var express = require('express');
var https = require('https');
var url = require("url");
var router = express.Router();
var request = require('request');

var config = require('../config.js');
var instanceModel = require('../models/instance.js');

var baseUrlHandler = require("../js/baseUrl.js");
var promiseHandler = require("../js/promise.js");


//The accessToken and refreshToken are added in case oAuth will be implemented
function saveInstanceInDb(clientId, instanceId, accessToken, refreshToken) {
    // get the instance from DB
    instanceModel.findOne({ instanceId: instanceId }, function (err, instance) {
        if (err) throw err;

        if (instance != null) {
            instance.clientId = clientId;
            instance.accessToken = accessToken;
            instance.refreshToken = refreshToken;
        }
        else {
            instance = instanceModel({
                instanceId: instanceId,
                clientId: clientId,
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        }
        instance.save(function (err) {
            if (err) {
                throw err;
            }
        });
    });
}

function renderView(req, res, instanceId) {
    console.log("\n===== Connected to view URL successfuly =====");

    if (instanceId != null) {
        console.log('\n Deliver html page \n');
        res.render('configure', { instanceId: instanceId });
    }
    else {
        console.log("\n Instance not set, here is the request Query:..." + JSON.stringify(req.query));
    }
}

/* GET. */
router.get('/',
    function (req, res, next) {
        console.log("\n===== Connected to CONFIGURE URL successfuly =====");

        var consumer_key = req.query.oauth_consumer_key;
        var instanceId = req.query.instance;

        saveInstanceInDb(consumer_key, instanceId, "", "");
        renderView(req, res, instanceId);

        res.end();
    });

router.post('/update', function (req, res, next) {
    console.log("\n===== Updating form configuration =====");

    config.init(req.query.instanceId);

    baseUrlHandler.getBaseUrl().then(function () {
        updateConfiguration(req.body);
        res.end();
    });
});

//PUT
function updateConfiguration(formUpdate) {
    var updateOptions = config.getConfig('updateOptions');
    updateOptions.path = updateOptions.path.replace('{instanceId}', formUpdate.instanceId);

    console.log('===== Updating configuration for instance path: ' + updateOptions.hostname + updateOptions.path + ' =====');

    var req = https.request(updateOptions, updateConfigurationCallback);

    req.on('error', function (e) {
        console.log('Problem with request: ' + e.message);
    });

    req.write(getDataTransferObject(formUpdate));
    req.end();
}

function updateConfigurationCallback(res) {
    res.setEncoding('utf8');
    var str = '';
    res.on('data', function (chunk) {
        str += chunk;
    });
    res.on('end', function () {
        console.log('BODY: ' + str);
    })
}

router.get('/forms', function (req, res, next) {
    console.log("===== Retrieving form list =====");

    var instanceId = req.query.instanceId;
    console.log('\n Get forms query Instance: ' + instanceId);

    config.init(instanceId);
    baseUrlHandler.getBaseUrl().then(function () {

        getFormsWithPromises().then(function (str) {
            console.log(str);

            var eloquaForms = JSON.parse(str).elements;
            res.write(JSON.stringify(eloquaForms));
            res.end();
        })
    })
});

function getFormsWithPromises() {
    console.log('===== Getting form List ====');
    return promiseHandler.getBodyPromiseByPath(config.getConfig('formListOptions'));
}

router.get('/formsdetails/:id', function (req, res, next) {
    console.log("===== Retrieving form details =====");

    config.init(req.query.instanceId);
    baseUrlHandler.getBaseUrl().then(function () {
        getFormDetailsWithPromises(req.params.id).then(function (str) {
            var eloquaFormFields = JSON.parse(str).elements;

            console.log('===== Updating form details ======');
            res.write(JSON.stringify(eloquaFormFields));
            res.end();
        })
    })
});

function getFormDetailsWithPromises(formId) {
    console.log('===== Getting details for form with Id: ' + formId + '=====');

    var formDetailOptions = config.getConfig('formDetailOptions');
    formDetailOptions.path = formDetailOptions.path.replace('{id}', formId);
    return promiseHandler.getBodyPromiseByPath(config.getConfig('formDetailOptions'));
}

router.get('/getcontactfields', function (req, res, next) {
    console.log("===== Retrieving Contact fields =====");

    config.init(req.query.instanceId);
    baseUrlHandler.getBaseUrl().then(function () {
        getContactFiedsWithPromises().then(function (str) {
            eloquaContactFields = JSON.parse(str).elements;

            console.log('===== Updating contact fields values =====');
            res.write(JSON.stringify(eloquaContactFields));
            res.end();
        })
    })
});

function getContactFiedsWithPromises() {
    console.log('===== Getting contact fields =====');

    return promiseHandler.getBodyPromiseByPath(config.getConfig('contactFieldOptions'));
}

function getDataTransferObject(formData) {
    var dataTransferObject = '';
    dataTransferObject += '{\"recordDefinition\":{';

    dataTransferObject += '\"formId\":\"' + formData.formId + '\",';
    dataTransferObject += '\"instanceId\":\"' + formData.instanceId + '\",';
    dataTransferObject += '\"ContactID\":\"{{Contact.Id}}\",';

    instanceModel.findOne({ instanceId: formData.instanceId }, function (err, instance) {
        if (err) throw err;
        if (instance != null) {
            instance.formId = formData.formId;
            instance.save(function (err) {
                if (err) {
                    throw err;
                }
                console.log('\nInstance with formId was saved');
            });
        }
        else {
            console.log('\nThere is no Instance with this instanceId in db');
        }
    });

    var staticValues = [];

    formData.elements.forEach(function (element) {
        if (element.mapping != '') {
            if (element.status != null) {
                if (element.status == 'static') {
                    console.log('\n Static Element: ' + JSON.stringify(element));

                    if (element.mapping.indexOf('{{') === 0) {
                        dataTransferObject += '\"id_' + element.id + '\":\"' + element.mapping + '\",';
                    }
                    else {
                        staticValues[staticValues.length] = element;
                    }
                }
            }
            else {
                dataTransferObject += '\"id_' + element.id + '\":\"' + element.mapping + '\",';
            }
        }
    });

    instanceModel.findOne({ instanceId: formData.instanceId }, function (err, instance) {
        if (err) throw err;
        if (instance != null) {
            instance.staticFields = staticValues;

            instance.save(function (err) {
                if (err) {
                    throw err;
                }
            });
        }
    });

    dataTransferObject = dataTransferObject.slice(0, -1);
    dataTransferObject += '},\"requiresConfiguration\":false}';

    console.log("===== CONFIGURE BODY: ===== \n" + dataTransferObject);
    return dataTransferObject;
}

module.exports = router;