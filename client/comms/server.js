import {Client} from './server/client.js';
import {Loadout} from './server/loadout.js';

/*
Server manages connections to client peers
*/

var Server = function (world_) {
  
  var worldState = {
    world: world_,
    clients: [],
    projectiles: [],
  }

  var fallDepthLimit = -30; // if you fall off the world, respawn at y=-30

  var loadouts = [
    Loadout.SCOUT,
    Loadout.BOUNCE,
    Loadout.BOMB,
    Loadout.SNIPER,
    Loadout.SCATTER,
    Loadout.HEAVY,
    Loadout.SEEKING,
  ];

  // map of chunk -> list of clients
  // representing the clients who are currently listening for updates
  // on that chunk (within their render distance)
  var chunkFollowers = [];

  var idCounter = 0;

  this.addClient = function(conn){
    let client = new Client(idCounter++, conn);

    worldState.clients.push(client);

    conn.on("data", function(data){
      if(data.updatePosition){
        if(!client.isTeleporting){
          client.position = new THREE.Vector3(...data.updatePosition.position);
          client.direction = new THREE.Quaternion(...data.updatePosition.direction);
          if(client.position.y < fallDepthLimit){
            client.sendAnnouncement("you fell!");
            client.assailants.push("fell");
            respawn(client);
            updateLeaderboard();
          }
        }
      }
      if(data.updateName){
        client.name = data.updateName;
        sendNameUpdateFor(client);
        client.sendAnnouncement("name set to "+data.updateName);
        updateLeaderboard();
      }
      if(data.updateColor){
        client.color = data.updateColor;
        sendColorUpdateFor(client);
      }
      if(data.changeLoadout){
        client.loadoutIDX++;
        if(client.loadoutIDX >= loadouts.length){
          client.loadoutIDX = 0;
        }
        client.loadout = new Loadout(loadouts[client.loadoutIDX]);
        announceLoadout(client);
        client.sendAnnouncement("loadout updated to: " + client.loadout.name);
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
      announcePlayerLeft(client);
      worldState.clients = worldState.clients.filter(c => c != client);
      client.removed = true;
      updateLeaderboard();
    });

    this.introduceNewPlayer(client);
    updateLeaderboard();
    respawn(client);
  }

  this.sendUpdates = function(){
    let allPositions = worldState.clients.map(function(client){
      return {
        id: client.id,
        position: client.position.toArray(),
        direction: client.direction.toArray(),
      };
    });
    let allProjectiles = worldState.projectiles.map(function(p){
      return {
        id: p.id,
        position: p.getPosition().toArray(),
        radius: p.getRadius(),
      };
    })
    worldState.clients.forEach(function(client){
      client.conn.send({
        playerPositions: allPositions,
        projectilePositions: allProjectiles,
      });
    });
  }

  this.introduceNewPlayer = function(client){
    worldState.clients.forEach(function(other){
      if(other !== client){
        other.conn.send({newPlayer:{id: client.id, username: client.name, color: client.color}});
        client.conn.send({newPlayer:{id: other.id, username: other.name, color: other.color}});
      }
    });
  }

  var playersAt = function(projectile){
    return worldState.clients.filter(function(client){
      return client.hitBy(projectile);
    });
  }

  var detectCollisions = function(projectile){
    let collisions = [];

    // colliding with world?
    if(worldState.world.blockAt(projectile.getPosition())){
      collisions.push(worldState.world);
    }
    collisions.push(...playersAt(projectile).filter(
      player => (projectile.getFriendlyFire() || player != projectile.owner) && !player.isTeleporting)
    );
    return collisions;
  }

  function launch(client, angle){
    client.direction = angle;
    client.loadout.launch(client, worldState);
  }

  function handleProjCollision(projectile, collisions){
    if(collisions.includes(worldState.world)){
      // set position to position of hit
      projectile.moveToHitPosition(worldState.world);
    }
    collisions.forEach(function(collision){
      if(collision != worldState.world){
        // collision is a client
        respawn(collision);

        collision.assailants.push(projectile.owner);
        projectile.owner.victims.push(collision);

        collision.conn.send({youWereHit:{by:projectile.owner.id}});
        collision.sendAnnouncement("you were hit by " + projectile.owner.name);
        projectile.owner.sendAnnouncement("you hit "+ collision.name);
        updateLeaderboard();
      }
    });

    projectile.destroy();
    worldState.projectiles = worldState.projectiles.filter(p => p != projectile);

    announceProjHit(projectile);
  }

  function moveProjectiles10ms(){
    worldState.projectiles.forEach(function(projectile){
      let op = projectile.getPosition();
      // estimate next position
      let np = projectile.nextPosition(10, worldState);
      let direction = np.clone().sub(op).normalize();
      let delta = np.distanceTo(op);

      let numSteps = Math.ceil(delta/(projectile.getRadius() * 1.8));
      let p = op.clone();

      for(let step = 1; step <= numSteps; step++){
        let oldp = p.clone();
        p.add(direction.clone().multiplyScalar(delta/numSteps));
        projectile.setPosition(p);
        let collisions = detectCollisions(projectile);
        if(collisions.length != 0 || projectile.expired()){
          handleProjCollision(projectile, collisions);
          break;
        }
      }
      
      if(!projectile.expired()){
        // reset
        projectile.setPosition(op);
        // apply actual step
        projectile.step(10, worldState);
      }
      
    });

  }

  function announceProjHit(p){
    worldState.clients.forEach(function(client){
      client.conn.send({projectileHit:{
        id: p.id,
        position: p.getPosition().toArray(),
        radius: p.getRadius(),
      }});
    });
  }

  function respawn(client){
    // Valid spawn locations are stored in each chunk
    //check if spawn chunk is valid
    var spawnChunk = null
    var spawnLocation = null
    while (spawnLocation == null){
      spawnChunk = worldState.world.getRandomChunk()
      if (spawnChunk != null){
        spawnLocation = spawnChunk.getRandomSpawnPosition()
      }
    }
    
    client.isTeleporting = true;
    sendChunk(client, spawnChunk.getPosition());
    client.conn.send({moveTo:spawnChunk.getPosition().add(spawnLocation).toArray()});
  }

  function sendNameUpdateFor(client){
    worldState.clients.forEach(function(other){
      if(other !== client){
        other.conn.send({nameUpdate:{id: client.id, username: client.name}});
      }
    });
  }

  function sendColorUpdateFor(client){
    worldState.clients.forEach(function(other){
      if(other !== client){
        other.conn.send({colorUpdate:{id: client.id, color: client.color}});
      }
    });
  }

  function sendChunk(client, p){
    let chunk = worldState.world.chunkAt(p);
    if (!chunk) return;
    client.conn.send({chunk:{
      position: chunk.getPosition().toArray(),
      blocks: chunk.getBlocks(),
      colors: chunk.getColors(),
    }});
  }

  function sendMessage(sender, messageText){
    worldState.clients.forEach(function(client){
      client.conn.send({message:{from: sender.name, text: messageText}});
    });
  }

  function announceLoadout(client){
    client.conn.send({loadoutUpdate:{
      name: client.loadout.name,
      reloadTime: client.loadout.reloadTime,
      loadStatus: 0,
      magazine: client.loadout.maxMagazine,
      maxMagazine: client.loadout.maxMagazine,
    }})
  }

  function announcePlayerLeft(client){
    worldState.clients.forEach(function(other){
      if(other !== client){
        other.sendAnnouncement(client.name + " left the game");
        other.conn.send({playerLeft:{id: client.id}});
      }
    });
  }

  function updateLeaderboard(){
    let list = worldState.clients.map(function(client){
      return {
        name: client.name,
        id: client.id,
        assailants: client.assailants.map(a => a.name || a),
        victims: client.victims.map(v => v.name || v),
      };
    });
    let lb = {list: list};
    worldState.clients.forEach(function(client){
      lb.myId = client.id; // each client can check their ID here
      client.conn.send({leaderboard:lb});
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