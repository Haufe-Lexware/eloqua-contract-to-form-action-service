var express = require('express');
var b64 = require('b64');
var https = require('https');
var url = require("url");
var router = express.Router();

var querystring = require('querystring');

var config = require('../config.js');
var instanceModel = require('../models/instance.js');

var baseUrlHandler = require("../js/baseUrl.js");
var promiseHandler = require("../js/promise.js");

router.post('/', function (req, res, next) {
	console.log("===== Connected to NOTIFY URL successfuly from POST! =====");
    var query = require('url').parse(req.url, true).query;
    var instanceId = query.instance;

	config.init(instanceId);
	baseUrlHandler.getBaseUrl().then(function () {

        var query = require('url').parse(req.url, true).query;
        var instanceId = query.instance;

        instanceModel.findOne({ instanceId: instanceId }, function (err, instance) {
			if (err) throw err;
			if (instance) {
				submitForms(instance, req);
			}
		});
		res.status(204).send();
	});
});

function submitForms(instance, req) {
	if (instance != null) {
		var count = req.body.count;

		if (count > 0) {
			var contactId = req.body.items[0].contactId;
			var formId = instance.formId;

			if (formId != null) {
				getFormDetails(formId).then(function (str) {
					var formFields = JSON.parse(str).elements;
					var myFormFields = formatFormFields(formFields);

					getAllPicklists().then(function (str) {
						var allPicklists = JSON.parse(str).elements;

						var myPicklists = formatPicklists(allPicklists);
						for (var key in req.body.items) {
							var requestItem = req.body.items[key];

							var xformData = formatFinalForm(requestItem, contactId, myFormFields, myPicklists, instance.staticFields);
							console.log('\nNotify FORM DATA ELEMENTS: ' + JSON.stringify(xformData) + '\n');
							submitForm(xformData, formId);
						}
					});
				});
			}
			else {
				console.log("===== The form Id is undefined =====");
			}
		}
		else {
			//No data to process
			console.log("\n Notify request body: " + req.body);
		}
	}
	else {
		console.log("\n===== Notify request has no Instance =====\n");
	}
}

//POST
function submitForm(formData, formId) {
	console.log("\n=====  Submitting Form =====");

	var formSubmitOptions = config.getConfig('formSubmitOptions');
	formSubmitOptions.path = formSubmitOptions.path.replace('{id}', formId);

	console.log('\n===== Submitting for to: ' + formSubmitOptions.hostname + formSubmitOptions.path + ' =====');

	var req = https.request(formSubmitOptions, submitFormCallback);

	req.on('error', function (e) {
		console.log('Problem with request: ' + e.message);
	});

	// Write data to request body
	req.write(JSON.stringify(formData));
	req.end();
}

function submitFormCallback(res) {
	console.log('\nSTATUS: ' + res.statusCode);
	console.log('HEADERS: ' + JSON.stringify(res.headers));
	res.setEncoding('utf8');
	var str = '';
	res.on('data', function (chunk) {
		str += chunk;
	});
	res.on('end', function () {
		console.log('BODY: ' + str);
	})
}

//GET
function getFormDetails(formId) {
	console.log('===== Getting details for form with Id: ' + formId + '=====');

	var formDetailOptions = config.getConfig('formDetailOptions');
	formDetailOptions.path = formDetailOptions.path.replace('{id}', formId);

	return promiseHandler.getBodyPromiseByPath(formDetailOptions);
}

//GET
function getAllPicklists(formId) {
	var pickListOptions = config.getConfig('pickListOptions');
	console.log('\n===== Getting picklist details from Path: ' + pickListOptions.hostname + pickListOptions.path + ' =====\n');

	return promiseHandler.getBodyPromiseByPath(pickListOptions);
}

function formatFormFields(formFields) {
	var temp = '{';
	for (var key in formFields) {
		var field = formFields[key];
		if (field) {
			temp += '\"' + field.id + '\":';
			temp += JSON.stringify(field); temp += ',';
		}
	};
	temp = temp.slice(0, -1);
	temp += '}';
	return JSON.parse(temp);
}

function formatPicklists(allPicklists) {
	var temp = '{';
	for (var key in allPicklists) {
		var pick = allPicklists[key];
		if (pick.elements) {
			temp += '\"' + pick.id + '\":';
			temp += JSON.stringify(pick.elements); temp += ',';
		}
	}
	temp = temp.slice(0, -1);
	temp += '}';
	return JSON.parse(temp);
}

function formatFinalForm(requestItem, contactId, myFormFields, myPicklists, staticFields) {
	var tempForm = {
		"submittedAt": null,
		"submittedByContactId": contactId,
		"fieldValues": []
	};
	for (var key in requestItem) {
		if (key.indexOf('id_') === 0) {
			var element = {
				"type": 'FieldValue',
				"id": key.replace('id_', ''),
				"value": requestItem[key]
			};;
			if (myFormFields[element.id].displayType == 'singleSelect') {
				var tempPicklist = myPicklists[myFormFields[element.id].optionListId];
				for (key in tempPicklist) {
					var temp = tempPicklist[key];
					if (temp.value == element.value) {
						element.value = temp.displayName;
					}
				}
			}
			tempForm.fieldValues.push(element);
		}
	}
    // Add Static fields from DB to the request
    console.log("\n Static Field: " + JSON.stringify(staticFields));
    for (var key in staticFields) {
        var element = {
			"type": 'FieldValue',
			"id": staticFields[key].id,
			"value": staticFields[key].mapping
        };

        tempForm.fieldValues.push(element);
    }

	return tempForm;
}

module.exports = router;