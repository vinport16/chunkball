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
  this.isTeleporting = false;
  this.loadout = new Loadout(Loadout.SCOUT);

  this.sendAnnouncement = function(text){
    this.conn.send({message:{from:'server', text:text}});
  }

  this.hitBy = function(projectile){
    if(this.position.clone().sub(projectile.getPosition()).length() < projectile.getRadius() + 2){
      // they are close.. but do they touch?

      // currently only detects collisions with the center of the projectile
      // TODO: detect collisions with the edge of the projectile

      let p = projectile.getPosition();
      var dz = this.position.z - p.z;
      var dx = this.position.x - p.x;
      var bottom = this.position.y - (1.5/2);
      var top = this.position.y + (1.5/2);

      if( Math.sqrt(dz*dz + dx*dx) < 0.375 && p.y < top && p.y > bottom ){
        return true;
      }
    }
    return false;
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
      if(data.doneMovingTo){
        client.position = new THREE.Vector3(...data.doneMovingTo);
        client.isTeleporting = false;
      }
      if(data.requestChunk){
        let p = new THREE.Vector3(...data.requestChunk.position);
        sendChunk(client, p);
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
    return clients.filter(function(client){
      return client.hitBy(projectile);
    });
  }

  var detectCollisions = function(projectile){
    let collisions = [];

    // colliding with world?
    if(world.blockAt(projectile.getPosition())){
      collisions.push(world);
    }
    collisions.push(...playersAt(projectile).filter(player => player != projectile.owner && !player.isTeleporting));
    return collisions;
  }

  function launch(client, angle){
    let launched = client.loadout.launch(client.position, angle);

    launched.forEach(function(projectile){
      projectile.owner = client;
      projectiles.push(projectile);
      sendNewProjectile(projectile);
    });
  }

  function handleProjCollision(projectile, collisions){
    if(collisions.includes(world)){
      // set position to position of hit
      projectile.moveToHitPosition(world);
    }else if(collisions.length != 0){
      collisions.forEach(function(collision){
        if(collision != world){
          // collision is a client
          respawn(collision);
          collision.conn.send({youWereHit:{by:projectile.owner.id}});
        }
      });
    }else{
      // expired
    }
    projectile.destroy();
    projectiles = projectiles.filter(p => p != projectile);

    announceProjHit(projectile);
  }

  function moveProjectiles10ms(){
    projectiles.forEach(function(projectile){
      projectile.step10ms();
      let collisions = detectCollisions(projectile);
      if(collisions.length != 0 || projectile.expired()){
        handleProjCollision(projectile, collisions);
      }
    });

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

  function respawn(client){
    // find a new position ?
    let moveto = new THREE.Vector3(4,6,4);
    client.isTeleporting = true;
    client.conn.send({moveTo:moveto.toArray()});
  }

  function sendNameUpdateFor(client){
    clients.forEach(function(other){
      if(other !== client){
        other.conn.send({nameUpdate:{id: client.id, username: client.name}});
      }
    });
  }

  function sendChunk(client, p){
    let chunk = world.chunkAt(p);
    if (!chunk) return;
    client.conn.send({chunk:{
      position: chunk.getPosition().toArray(),
      blocks: chunk.getBlocks(),
    }});
  }

  function sendMessage(sender, messageText){
    clients.forEach(function(client){
      client.conn.send({message:{from: sender.name, text: messageText}});
    });
  }

  function announcePlayerLeft(client){
    clients.forEach(function(other){
      if(other !== client){
        other.sendAnnouncement(client.name + " left the game");
        other.conn.send({playerLeft:{id: client.id}});
      }
    });
  }

  function worldStep10ms(){
    moveProjectiles10ms();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // on instantiation, start sending updates to clients (if any):
  (async () => {
    while ("Vincent" > "Michael") {
      await sleep(10);
      worldStep10ms();
      await sleep(10);
      worldStep10ms();
      this.sendUpdates();
    }
  })();

};

Server.prototype.constructor = Server;

export { Server };