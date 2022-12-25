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
      clients = clients.filter(c => c != client);
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

  var playersAt = function(projectile){
    let hits = [];
    clients.forEach(function(client){
      if(client.position.clone().sub(projectile.getPosition()).length() < projectile.getRadius() + 2){
        //console.log("near player...", client.position.clone().sub(projectile.getPosition().length()));
        // they are close.. but do they touch?
        let p = projectile.getPosition();

        var dz = client.position.z - p.z;
        var dx = client.position.x - p.x;
        var bottom = client.position.y - (1.5/2);
        var top = client.position.y + (1.5/2);


        if( Math.sqrt(dz*dz + dx*dx) < 0.375 && p.y < top && p.y > bottom ){
          console.log("hit player:",client.name);
          hits.push(client);
        }
      }
    });
    return hits;
  }

  var detectCollisions = function(projectile){
    let collisions = [];
    // colliding with world?
    if(world.blockAt(projectile.getPosition())){
      collisions.push(world);
    }
    collisions.push(...playersAt(projectile).filter(player => player != projectile.owner));
    return collisions;
  }

  function launch(client, angle){
    let launched = client.loadout.launch(client.position, angle);

    launched.forEach(function(projectile){
      projectile.owner = client;
      projectiles.push(projectile);
      sendNewProjectile(projectile);
      activateProjectile(projectile);
    });
  }

  function activateProjectile(projectile){
    let collisions = [];
    (async () => {
      while (collisions.length === 0 && !projectile.expired()) {
        await sleep(10);
        projectile.step10ms();
        // every 10ms, check collisions
        collisions = detectCollisions(projectile);
      }
      projectile.destroy();
      if(collisions.includes(world)){
        // set position to position of hit
        projectile.moveToHitPosition(world);
      }else if(collisions.length != 0){
        // hit player
        console.log(projectile.id, "hit player");
        console.log("collisions",collisions);
      }else{
        // expired
      }
      projectiles = projectiles.filter(p => p != projectile);

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