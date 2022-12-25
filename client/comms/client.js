import {Agent} from '../agent.js';
import {Projectile} from '../projectile.js';
/*
Client manages the connection to the server peer
*/
var Client = function (world_, scene_) {
  
  var world = world_;
  var scene = scene_;

  var name = "username";

  var connection;
  var agents = {};
  var projectiles = {};
  var player;

  this.connectServer = function(conn, player_){
    player = player_;

    // can't connect if already connected
    if(connection){
      console.error("you already connected to a server");
      return;
    }
    connection = conn;

    connection.send({updateName:name});

    conn.on("data", function(data){
      if(data.newPlayer){
        let npd = data.newPlayer;
        let agent = new Agent(scene);
        agent.draw();
        agent.setName(npd.username);
        agent.updateNameTag();
        agents[npd.id] = agent;
      }
      if(data.newProjectile){
        let npd = data.newProjectile;
        projectiles[npd.id] = new Projectile(scene, new THREE.Vector3(...npd.position), npd.radius);
      }
      if(data.projectileHit){
        let hd = data.projectileHit;
        projectiles[hd.id].setPosition(new THREE.Vector3(...hd.position));
        projectiles[hd.id].destroy();
      }
      if(data.playerPositions){
        data.playerPositions.forEach(function(player){
          if(agents[player.id]){
            agents[player.id].updatePosition(new THREE.Vector3(...player.position));
          }else{
            // this is your position
          }
        });
      }
      if(data.projectilePositions){
        data.projectilePositions.forEach(function(p){
          projectiles[p.id].setPosition(new THREE.Vector3(...p.position));
        });
      }
      if(data.nameUpdate){
        let update = data.nameUpdate;
        agents[update.id].setName(update.username);
        agents[update.id].updateNameTag();
      }
      if(data.playerLeft){
        agents[data.playerLeft.id].remove();
        agents[data.playerLeft.id] = null;
        // let the garbage collector do the rest
      }
    });

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // on connect, start sending updates to server:
    (async () => {
      while ("Vincent" > "Michael") {
        await sleep(20);
        conn.send({updatePosition: {position: player.getPosition().toArray()}});
      }
    })();

  }

  this.setName = function(n){
    name = n;
    if(connection){
      connection.send({updateName:n});
    }
  }

  this.setColor = function(c){
    connection.send({updateColor:c});
  }

  this.launch = function(){
    if(!player){return} // if player isn't created yet
    let angle = player.launch();
    if(angle){
      connection.send({launch: {angle: angle.toArray()}});
    }
  }

};

Client.prototype.constructor = Client;

export { Client };