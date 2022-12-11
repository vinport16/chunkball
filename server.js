var express = require('express');
var app = express();
var http = require('http').createServer(app);

var port = 3030;

http.listen(port);

app.use('/client', express.static('client'));