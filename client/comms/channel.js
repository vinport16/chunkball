/*
Channel implements the API for a webRTC connection so that the serving peer can
run a Server object and connect to it as though it is a normal peer.
*/
var Channel = function () {
  
  var andre = {};
  var betty = {};

  var andreFuncs = [];
  var bettyFuncs = [];

  andre.on = function(event, func){
    if(event == "data"){
      andreFuncs.push(func);
    }else{
      // do nothing
      // will not close
      // will not err
      // already open
    }
  }

  betty.on = function(event, func){
    if(event == "data"){
      bettyFuncs.push(func);
    }else{
      // do nothing
      // will not close
      // will not err
      // already open
    }
  }

  andre.send = function(data){
    bettyFuncs.forEach(function(func){
      func(data);
    });
  }

  betty.send = function(data){
    andreFuncs.forEach(function(func){
      func(data);
    });
  }

  this.getSides = function(){
    return [andre, betty];
  }

};

Channel.prototype.constructor = Channel;

export { Channel };