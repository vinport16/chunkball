var express = require('express');
var app = express();
var server = require('http').createServer(app);

var port = 3030;

app.use('/client', express.static('client'));
app.use('/mapEditor', express.static('mapEditor'));
app.use('/maps', express.static('maps'));
app.use('/start', express.static('start'));

app.use('/favicon.ico', express.static('favicon.ico'));
app.get('/', (req, res, next) => res.redirect('/start'));
console.log("created index");

server.listen(port);
console.log("listening");