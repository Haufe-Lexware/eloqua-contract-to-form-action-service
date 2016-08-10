var config = require('../config.js');
var https = require('https');

module.exports.getBaseUrl = function getBaseUrl() {

    console.log('===== Getting base URL Contact =====');
    var baseUrl = config.getConfig('baseUrlOptions');
    var promise = new Promise(function (resolve, reject) {

        if (baseUrl != null) {
            var req = https.get(baseUrl, function (response) {
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    console.log('Get Base URL BODY: ' + str);
                    var jsonResponse = JSON.parse(str);
                    setEloquaBaseUrlSettings(jsonResponse);

                    resolve(str);
                });
            });

            req.on('error', function (e) {
                console.log("Got error: " + e.message);
                reject(e.message);
            });
        }
    })

    return promise;
}

function setEloquaBaseUrlSettings(jsonResponse) {
    var eloquaSettings = config.getConfig('eloquaSettings');

    if (jsonResponse.urls.base) {
        eloquaSettings.baseURL = jsonResponse.urls.base.replace('https://', '');
    }
    if (jsonResponse.urls.apis.rest.bulk) {
        eloquaSettings.bulkUrl = jsonResponse.urls.apis.rest.bulk.replace('https://', '');
    }

    if (jsonResponse.urls.apis.rest.standard) {
        eloquaSettings.restUrl = jsonResponse.urls.apis.rest.standard.replace('https://', '');
    }
    config.updateEloquaSettings(eloquaSettings);
}