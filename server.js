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


var socket = require('socket.io')
var io = socket(server);
var parseMagicaVoxel = require('parse-magica-voxel');

io.sockets.on("connection", function(Socket){
  console.log("new connection " + Socket.id);
  Socket.on("parseVox", function(data){
    console.log(data)
    result = JSON.stringify(parseMagicaVoxel(data))
    io.emit("jsonStrVox", result);
  });
});


server.listen(port);
console.log("listening");