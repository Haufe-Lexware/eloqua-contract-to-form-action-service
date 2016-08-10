var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var mongoIP = process.env.MONGO_CONTAINER_PORT_27017_TCP_ADDR;
var mongoPORT = process.env.MONGO_CONTAINER_PORT_27017_TCP_PORT;
console.log(JSON.stringify(process.env));
var mongodbURL = "mongodb://"+mongoIP+":"+mongoPORT+"/exampleDb";

mongoose.connect(mongodbURL);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

var staticField = new Schema({
    name: String,
    value: String
});

var instanceSchema = new Schema({
    instanceId: { type: String, required: true, unique: true},
    formId: String,
    accessToken: String,
    refreshToken: String,
    clientId: String,
    staticFields:[]
});

//Create an instance model
var instance = mongoose.model('instance', instanceSchema);

// Make it available to the application
module.exports = instance;
