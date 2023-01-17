import {Agent} from '../agent.js';
import {Projectile} from '../projectile.js';
import {Chunk} from '../chunk.js';

/*
Client manages the connection to the server peer
*/
var Client = function (world_, scene_) {
  
  var world = world_;
  var scene = scene_;

  var name = "username";
  var color = "#AA0000";

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
    connection.send({updateColor:color});

    conn.on("data", function(data){
      if(data.newPlayer){
        let npd = data.newPlayer;
        let agent = new Agent(scene);
        agent.draw();
        agent.setName(npd.username);
        agent.updateColor(npd.color);
        agent.updateNameTag();
        agents[npd.id] = agent;
      }
      if(data.projectileHit){
        let hd = data.projectileHit;
        if(projectiles[hd.id]){
          projectiles[hd.id].setPosition(new THREE.Vector3(...hd.position));
          projectiles[hd.id].destroy();
        }else{
          (new Projectile(scene, new THREE.Vector3(...hd.position), hd.radius)).destroy();
        }
      }
      if(data.youWereHit){
        let hitYou = agents[data.youWereHit.by];
        // do something with this info ?
      }
      if(data.playerPositions){
        data.playerPositions.forEach(function(player){
          if(agents[player.id]){
            let p = new THREE.Vector3(...player.position);
            let d = new THREE.Quaternion(...player.direction);
            agents[player.id].updatePosition(p, d);
          }else{
            // this is your position: ignore
          }
        });
      }
      if(data.projectilePositions){
        data.projectilePositions.forEach(function(p){
          if(projectiles[p.id]){
            projectiles[p.id].setPosition(new THREE.Vector3(...p.position));
          }else{
            projectiles[p.id] = new Projectile(scene, new THREE.Vector3(...p.position), p.radius);
          }
        });
      }
      if(data.nameUpdate){
        let update = data.nameUpdate;
        agents[update.id].setName(update.username);
        agents[update.id].setGoldenTag(update.golden);
        agents[update.id].updateNameTag();
      }
      if(data.colorUpdate){
        let update = data.colorUpdate;
        agents[update.id].updateColor(update.color);
      }
      if(data.loadoutUpdate){
        let l = data.loadoutUpdate;
        player.setLoadout(l);
      }
      if(data.moveTo){
        player.setPosition(new THREE.Vector3(...data.moveTo));
        conn.send({doneMovingTo:player.getPosition().toArray()});
      }
      if(data.playerLeft){
        agents[data.playerLeft.id].remove();
        agents[data.playerLeft.id] = null;
        // let the garbage collector do the rest
      }
      if(data.chunk){
        let p = new THREE.Vector3(...data.chunk.position);
        let blocks = data.chunk.blocks;
        let colors = data.chunk.colors;
        let chunk = new Chunk(p, blocks, colors);
        world.setChunk(chunk);
      }
      if(data.clearWorld){
        world.fullRefresh(scene);
      }
    });

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // on connect, start sending updates to server:
    (async () => {
      while ("Vincent" > "Michael") {
        await sleep(20);
        conn.send({updatePosition: {
          position: player.getPosition().toArray(),
          direction: player.getDirection().toArray(),
        }});
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
    color = c;
    if(connection){
      connection.send({updateColor:c});
    }
  }

  this.changeLoadout = function(){
    connection.send({changeLoadout:true});
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