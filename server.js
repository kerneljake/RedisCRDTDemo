/*
* Copyright © 2018 Redis Labs, Inc.
* This program should be used for demo puposes only. The software
* is provided “as is”, without warranty of any kind.
*
* Usage: node server.js <HTTP port> <Redis port>
* Example: node server.js 3000 6379
*/


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var cfenv = require("cfenv");

var appEnv = cfenv.getAppEnv().services.redislabs[0];

var redisPort = appEnv.credentials.port || 6379;
var redisHost = appEnv.credentials.ip_list[0] || 'localhost';
var redisPassword = appEnv.credentials.password || null;
var httpPort = process.env.PORT || 3000;
process.env.location = redisHost;

// Redis client to query and publish to a channel
var redisClient = redis.createClient({
  port : redisPort,
  host : redisHost,
  password: redisPassword
});

// Redis client to listen to a channel
var redisSub = redis.createClient({
  port : redisPort,
  host : redisHost,
  password: redisPassword
});

// Init modules to process get and post parameters
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser());

var session = require('express-session');
// All static files are under $HOME/public
app.use(express.static('public'))
app.set('view engine','ejs');
require('./app/routes.js')(app, redisClient);

// Initialize socket.io for asynchronous communication between the Server
// and the web application
io.on('connection', function(socket){
});

// Listen to pub/sub messages on a Redis channel
msglistener = require('./app/msglistener.js');
msglistener.listen(redisSub, redisClient, io);

// Start the HTTP server
http.listen(httpPort, function(){
  console.log('HTTP listening on :'+httpPort);
});
