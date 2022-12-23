/*
Server manages connections to client peers
*/

// this is the client struct that the server uses
// to keep track of clints - different from Client
// in client.js (sorry for any confusion here)
var Client = function (id_, conn_) {
  this.id = id_;
  this.conn = conn_;
  this.name = "username";
  this.position = new THREE.Vector3();
  this.removed = false;
};
Client.prototype.constructor = Client;


var Server = function (world_, scene_) {
  
  var world = world_;
  var scene = scene_;

  var clients = [];

  // map of chunk -> list of clients
  // representing the clients who are currently listening for updates
  // on that chunk (within their render distance)
  var chunkFollowers = [];

  var idCounter = 0;

  this.addClient = function(conn){
    let client = new Client(idCounter++, conn);

    console.log("user id:" + client.id + " just joined");

    clients.push(client);

    this.introduceNewPlayer(client);

    conn.on("data", function(data){
      if(data.updatePosition){
        client.position = new THREE.Vector3(...data.updatePosition.position);
      }
      if(data.updateName){
        client.name = data.updateName;
        sendNameUpdateFor(client);
      }
    });

    conn.on("close", function(){
      // FIREFOX DOES NOT SUPPORT ? maybe it does now let's see...
      console.log("user " + client.name +" id:" + client.id + " just left");
      announcePlayerLeft(client);
      clients.splice(clients.findIndex(c => c == client));
      client.removed = true;
    });
  }

  this.sendUpdates = function(){
    let allPositions = clients.map(function(client){
      return {id: client.id, position: client.position.toArray()};
    });
    clients.forEach(function(client){
      // send positions of other players
      client.conn.send({playerPositions:allPositions});
    });
  }

  this.introduceNewPlayer = function(client){
    console.log("introducing new player? other players: ", clients.length);
    clients.forEach(function(other){
      if(other !== client){
        console.log("introducing", client.name, "to", other.name);
        other.conn.send({newPlayer:{id: client.id, username: client.name}});
        client.conn.send({newPlayer:{id: other.id, username: other.name}});
      }
    });
  }

  function sendNameUpdateFor(client){
    clients.forEach(function(other){
      if(other !== client){
        other.conn.send({nameUpdate:{id: client.id, username: client.name}});
      }
    });
  }

  function announcePlayerLeft(client){
    clients.forEach(function(other){
      if(other !== client){
        other.conn.send({playerLeft:{id: client.id}});
      }
    });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // on instantiation, start sending updates to clients (if any):
  (async () => {
    while ("Vincent" > "Michael") {
      await sleep(20);
      this.sendUpdates();
    }
  })();

};

Server.prototype.constructor = Server;

export { Server };