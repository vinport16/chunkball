import {Loadout} from './server/loadout.js';

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
  this.loadout = new Loadout(Loadout.SCOUT);

  this.sendAnnouncement = function(text){
    this.conn.send({message:{from:'server', text:text}});
  }
};
Client.prototype.constructor = Client;


var Server = function (world_, scene_) {
  
  var world = world_;
  var scene = scene_;

  var clients = [];
  var projectiles = [];

  // map of chunk -> list of clients
  // representing the clients who are currently listening for updates
  // on that chunk (within their render distance)
  var chunkFollowers = [];

  var idCounter = 0;

  this.addClient = function(conn){
    let client = new Client(idCounter++, conn);

    clients.push(client);

    this.introduceNewPlayer(client);

    conn.on("data", function(data){
      if(data.updatePosition){
        client.position = new THREE.Vector3(...data.updatePosition.position);
      }
      if(data.updateName){
        client.name = data.updateName;
        sendNameUpdateFor(client);
        client.sendAnnouncement("name changed to "+data.updateName);
      }
      if(data.message){
        sendMessage(client, data.message);
      }
      if(data.launch){
        launch(client, new THREE.Vector3(...data.launch.angle));
      }
    });

    conn.on("close", function(){
      console.log(client.name +" just left");
      announcePlayerLeft(client);
      clients.splice(clients.findIndex(c => c == client));
      client.removed = true;
    });
  }

  this.sendUpdates = function(){
    let allPositions = clients.map(function(client){
      return {id: client.id, position: client.position.toArray()};
    });
    let allProjectiles = projectiles.map(function(p){
      return {id: p.id, position: p.getPosition().toArray()};
    })
    clients.forEach(function(client){
      client.conn.send({
        playerPositions: allPositions,
        projectilePositions: allProjectiles,
      });
    });
  }

  this.introduceNewPlayer = function(client){
    clients.forEach(function(other){
      if(other !== client){
        other.conn.send({newPlayer:{id: client.id, username: client.name}});
        client.conn.send({newPlayer:{id: other.id, username: other.name}});
      }
    });
  }

  var detectCollisions = function(projectile){
    let collisions = [];
    // colliding with world?
    if(world.blockAt(projectile.getPosition())){
      collisions.push(world);
    }
    // colliding with players? TODO
    return collisions;
  }

  function launch(client, angle){
    let projectile = client.loadout.launch(client.position, angle);
    projectiles.push(projectile);

    sendNewProjectile(projectile);

    let collisions = [];
    (async () => {
      let seconds_alive = 0;
      while (collisions.length == 0 && seconds_alive < 10) {
        await sleep(10);
        seconds_alive += 0.01;
        projectile.step10ms();
        // every 10ms, check collisions
        collisions = detectCollisions(projectile);
      }
      projectile.destroy();
      if(collisions.includes(world)){
        // set position to position of hit
        projectile.moveToHitPosition(world);
      }
      announceProjHit(projectile);
    })();
  }

  function sendNewProjectile(p){
    clients.forEach(function(client){
      client.conn.send({newProjectile:{
        id: p.id,
        position: p.getPosition().toArray(),
        radius: p.getRadius(),
      }});
    });
  }

  function announceProjHit(p){
    clients.forEach(function(client){
      client.conn.send({projectileHit:{
        id: p.id,
        position: p.getPosition().toArray(),
      }});
    });
  }

  function sendNameUpdateFor(client){
    clients.forEach(function(other){
      if(other !== client){
        other.conn.send({nameUpdate:{id: client.id, username: client.name}});
      }
    });
  }

  function sendMessage(sender, messageText){
    clients.forEach(function(client){
      client.conn.send({message:{from: sender.name, text: messageText}});
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