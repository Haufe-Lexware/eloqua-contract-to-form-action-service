var b64 = require('b64');
var instanceModel = require('./models/instance.js');

var config = {};

module.exports.addConfig = function (name, value) {
    config[name] = value;
};

module.exports.getConfig = function (name) {
    return config[name];
};

module.exports.updateConfig = function (name, value) {
	delete config[name];
	config[name] = value;
};

module.exports.delConfig = function (name) {
    delete config[name];
};

module.exports.list = function () {
    return Object.keys(config);
};



var site;
var user;
var pass;
if (process.argv.length < 2) {
	//Set the environment in ./docker/docker-compose.yml
	site = process.env.SITE;
	user = process.env.USER;
	pass = process.env.PASS;
}
else {
	//Start node or forever with parameters 
//forever start --minUptime 1000 --spinSleepTime 1000 ./bin/www site username password
	site = process.argv[2];
	user = process.argv[3];
	pass = process.argv[4];
}

module.exports.init = function (instanceId) {
	var eloquaSettings = {
		'site': site,
		'user': user,
		'password': pass,
		'instanceId': '{instanceId}',
		'formsPath': '/assets/forms',
		'formDataPath': '/data/form/{id}',
		'formsDetailsPath': '/assets/form/{id}',
		'optionListsPath': '/assets/optionLists?depth=complete',
		'contactFieldsPath': '/assets/contact/fields?depth=complete',
		'contactApiPath': 'data/contact/{id}/scores/current',
		'allContactApiPath': 'data/contact/{id}/scores/recent/model/{modelId}',
		'modelsApiPath': 'contacts/scoring/models/',
		'authHeader': '',
		'baseURL': '',
		'restUrl': '',
		'bulkUrl': ''
	};

    //This is used for basic auth
	var authHeader = 'Basic ' + b64.encode(eloquaSettings.site + "\\" + eloquaSettings.user + ":" + eloquaSettings.password);
    var self = this;

    initPaths(self, eloquaSettings, authHeader);
}

function initPaths(self, eloquaSettings, authHeader) {
    eloquaSettings.authHeader = authHeader;

    console.log('\n Authorization token in eloquaSettings: ' + authHeader + '\n');

    self.updateConfig('eloquaSettings', eloquaSettings);

	var baseUrlOptions = {
		host: 'login.eloqua.com',
		path: '/id',
		json: true,
		headers: {
			'Authorization': eloquaSettings.authHeader
		}
	};
	self.updateConfig('baseUrlOptions', baseUrlOptions);

	var contactDetailOptions = {
		hostname: eloquaSettings.baseURL,
		port: 443,
		path: '',
		method: 'GET',
		headers: {
			'Authorization': config.eloquaSettings.authHeader,
		}
	};

	self.updateConfig('contactDetailOptions', contactDetailOptions);

	var allScores = {
		hostname: eloquaSettings.baseURL,
		port: 443,
		path: '',
		method: 'GET',
		headers: {
			'Authorization': config.eloquaSettings.authHeader,
		}
	};

	self.updateConfig('allScores', allScores);

	var scoreModels = {
		hostname: eloquaSettings.baseURL,
		port: 443,
		path: '',
		method: 'GET',
		headers: {
			'Authorization': config.eloquaSettings.authHeader,
		}
	};

	self.updateConfig('scoreModels', scoreModels);

	var contactFieldOptions = {
		hostname: '',
		port: 443,
		path: '',
		method: 'GET',
		headers: {
			'Authorization': eloquaSettings.authHeader,
		}
	};
	self.updateConfig('contactFieldOptions', contactFieldOptions);

	var formListOptions = {
		hostname: eloquaSettings.baseURL,
		port: 443,
		path: eloquaSettings.restUrl.replace(eloquaSettings.baseURL, '').replace('{version}', '1.0') + eloquaSettings.formsPath,
		method: 'GET',
		headers: {
			'Authorization': eloquaSettings.authHeader,
		}
	};
	self.updateConfig('formListOptions', formListOptions);

	var formDetailOptions = {
		hostname: '',
		port: 443,
		path: '',
		method: 'GET',
		headers: {
			'Authorization': eloquaSettings.authHeader,
		}
	};
	self.updateConfig('formDetailOptions', formDetailOptions);

	var updateOptions = {
		hostname: '',
		port: 443,
		path: '',
		method: 'PUT',
		headers: {
			'Authorization': eloquaSettings.authHeader,
			'Content-Type': 'application/json'
		}
	};
	self.updateConfig('updateOptions', updateOptions);

	var formSubmitOptions = {
		hostname: '',
		port: 443,
		path: '',
		method: 'POST',
		headers: {
			'Authorization': eloquaSettings.authHeader,
			'Content-Type': 'application/json'
		},
	};
	self.updateConfig('formSubmitOptions', formSubmitOptions);

	var pickListOptions = {
		hostname: '',
		port: 443,
		path: '',
		method: 'GET',
		headers: {
			'Authorization': eloquaSettings.authHeader
		},
	};
	self.updateConfig('pickListOptions', pickListOptions);

}
module.exports.updateEloquaSettings = function (val) {

	this.updateConfig('eloquaSettings', val);

	var contactFieldOptions = this.getConfig('contactFieldOptions');
	contactFieldOptions.hostname = val.baseURL;
	contactFieldOptions.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '1.0') + val.contactFieldsPath;
	this.updateConfig('contactFieldOptions', contactFieldOptions);

	var contactDetailOptions = this.getConfig('contactDetailOptions');
	contactDetailOptions.hostname = val.baseURL;
	contactDetailOptions.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '2.0') + val.contactApiPath;
	this.updateConfig('contactDetailOptions', contactDetailOptions);

	var allScores = this.getConfig('allScores');
	allScores.hostname = val.baseURL;
	allScores.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '2.0') + val.allContactApiPath;
	this.updateConfig('allScores', allScores);

	var scoreModels = this.getConfig('scoreModels');
	scoreModels.hostname = val.baseURL;
	scoreModels.path = val.bulkUrl.replace(val.baseURL, '').replace('{version}', '2.0') + val.modelsApiPath;
	this.updateConfig('scoreModels', scoreModels);

	var formListOptions = this.getConfig('formListOptions');
	formListOptions.hostname = val.baseURL;
	formListOptions.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '1.0') + val.formsPath;
	this.updateConfig('formListOptions', formListOptions);

	var formDetailOptions = this.getConfig('formDetailOptions');
	formDetailOptions.hostname = val.baseURL;
	formDetailOptions.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '1.0') + val.formsDetailsPath;
	this.updateConfig('formDetailOptions', formDetailOptions);

	var updateOptions = this.getConfig('updateOptions');
	updateOptions.hostname = val.baseURL;
	updateOptions.path = '/api/cloud/1.0/actions/instances/' + val.instanceId;
	this.updateConfig('updateOptions', updateOptions);

	var formSubmitOptions = this.getConfig('formSubmitOptions');
	formSubmitOptions.hostname = val.baseURL;
	formSubmitOptions.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '1.0') + val.formDataPath;
	this.updateConfig('formSubmitOptions', formSubmitOptions);

	var pickListOptions = this.getConfig('pickListOptions');
	pickListOptions.hostname = val.baseURL;
	pickListOptions.path = val.restUrl.replace(val.baseURL, '').replace('{version}', '1.0') + val.optionListsPath;
	this.updateConfig('pickListOptions', pickListOptions);
}
