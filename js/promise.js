var https = require('https');

module.exports.getBodyPromiseByPath = function getBodyPromiseByPath(path){
    console.log(path);

    var promise = new Promise(function (resolve, reject) {
        console.log("\n Enter Promise");
        var req = https.get(path, function (response) {
            // Continuously update stream with data
            var body = '';
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                console.log("\n Body Promise");
                resolve(body);
            });
        });
        req.on('error', function (e) {
            console.log("\n Error Promise");
            reject(e);
        });
    });

    return promise;
}
