import {Projectile} from './projectile.js';
/*
Loadout
*/
var Loadout = function (type_) {

  var types = [
    { 
      name: 'scout',
      launchSpeed: 40, // blocks per second
      projectileRadius: 0.12,
      reloadTime: 100,
      magazine: 100,
      maxMagazine: 100,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'sniper',
      launchSpeed: 120,
      projectileRadius: 0.06,
      reloadTime: 1000,
      magazine: 50,
      maxMagazine: 50,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'scatter',
      launchSpeed: 25,
      projectileRadius: 0.1,
      reloadTime: 500,
      magazine: 50,
      maxMagazine: 50,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        for(let i = 0; i < 14; i++){
          let radModifier = (Math.random() - 0.5) * 0.10;
          let directionModifier = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(15);
          let newp = new Projectile(client.position.clone(), velocity.clone().add(directionModifier), this.projectileRadius + radModifier);
          newp.setExpireTime(1000);
          newp.owner = client;
          worldState.projectiles.push(newp);
        }
      },
    },
    { 
      name: 'heavy',
      launchSpeed: 35,
      projectileRadius: 0.8,
      reloadTime: 300,
      magazine: 100,
      maxMagazine: 100,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'seeking',
      launchSpeed: 13,
      projectileRadius: 0.18,
      reloadTime: 1700,
      magazine: 50,
      maxMagazine: 50,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        newp.seeking = newp.nearestTarget(worldState.clients);
        worldState.projectiles.push(newp);
      }
    },
    { 
      name: 'bomb',
      launchSpeed: 17,
      projectileRadius: 0.15,
      reloadTime: 1000,
      magazine: 50,
      maxMagazine: 50,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        
        newp.onDestroy = function(){
          let explosionRadius = 2.5;
          let explosion = new Projectile(newp.getPosition(), newp.getVelocity(), explosionRadius);
          explosion.setExpireTime(15); // expire basically right away
          explosion.owner = client;
          explosion.setFriendlyFire(true); // can hit self >:)
          worldState.projectiles.push(explosion);

          // destroy some blocks
          let p = newp.getPosition();
          for(let x = p.x-1; x <= p.x +1; x+=1){
            for(let y = p.y-1; y <= p.y +1; y+=1){
              for(let z = p.z-1; z <= p.z +1; z+=1){
                let thisp = new THREE.Vector3(x, y, z);
                // sometimes the edges of the 3x3 cube around the
                // projectile are left unharmed
                if(thisp.distanceTo(p)-1 < Math.random()*5){
                  worldState.breakBlockAt(thisp);
                }
              }
            }
          }
        }

        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'bounce',
      launchSpeed: 25,
      projectileRadius: 0.11,
      reloadTime: 600,
      magazine: 100,
      maxMagazine: 100,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        newp.setExpireTime(5000);

        let bounceCount = 0;
        let bounceLimit = 7;
        let bounce = function(){
          bounceCount += 1;
          if(bounceCount > bounceLimit){
            return;
          }
          let reflection = bounceVelocity(newp, worldState.world);
          reflection.multiplyScalar(0.8);
          let bp = new Projectile(newp.getPosition(), reflection, newp.getRadius());
          bp.setExpireTime(5000 - newp.getAge());
          bp.owner = client;
          bp.setFriendlyFire(true); // can hit self >:)
          bp.onDestroy = bounce; // recursive
          worldState.projectiles.push(bp);
          newp = bp;
        }

        newp.onDestroy = bounce;

        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'drill',
      launchSpeed: 19,
      projectileRadius: 0.11,
      reloadTime: 1500,
      magazine: 30,
      maxMagazine: 30,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.setExpireTime(5000);
        newp.owner = client;

        let drillCount = 0;
        let drillLimit = 7;
        let drill = function(){
          drillCount += 1;
          if(drillCount > drillLimit){
            return;
          }
          // destroy the block it hit (one small step forward in the direction it was moving)
          let p = newp.getPosition().add(newp.getVelocity().normalize().multiplyScalar(0.01));
          worldState.breakBlockAt(p);

          // make another projectile moving in the same direction
          let nextp = new Projectile(newp.getPosition(), newp.getVelocity().multiplyScalar(0.8), newp.getRadius());
          nextp.setExpireTime(5000 - newp.getAge());
          nextp.owner = client;
          nextp.onDestroy = drill;
          worldState.projectiles.push(nextp);

          newp = nextp;
        }

        newp.onDestroy = drill;

        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'bridge',
      launchSpeed: 18,
      projectileRadius: 0.22,
      reloadTime: 1500,
      magazine: 30,
      maxMagazine: 30,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.setExpireTime(120);
        newp.owner = client;

        let count = 0;
        let limit = 15;
        let bridge = function(){
          count += 1;
          if(count > limit){
            return;
          }

          // if it hit a block, do nothing
          console.log(newp.getAge());
          if(newp.getAge() < 40){
            return;
          }

          // make another projectile moving in the same direction
          let nextp = new Projectile(newp.getPosition(), newp.getVelocity(), newp.getRadius());
          nextp.setExpireTime(40);
          nextp.owner = client;
          nextp.onDestroy = bridge;
          worldState.projectiles.push(nextp);

          newp = nextp;

          // also make a projectile that stays still and makes a block
          let builder = new Projectile(newp.getPosition(), new THREE.Vector3(0,1,0), newp.getRadius()*2);
          builder.setExpireTime(50);
          builder.owner = client;
          builder.onDestroy = function(){
            // make a block
            worldState.createBlockAt(builder.getPosition());
          };
          worldState.projectiles.push(builder);

        }

        newp.onDestroy = bridge;

        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'fracture',
      launchSpeed: 35,
      projectileRadius: 0.31,
      reloadTime: 3000,
      magazine: 100,
      maxMagazine: 100,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        newp.setExpireTime(2000);

        let pieces = 10;
        newp.onDestroy = function(){

          for(let i = 0; i < pieces; i++){
            let newv = bounceVelocity(newp, worldState.world).multiplyScalar(0.2).add(randomDirection().multiplyScalar(10));
            let bp = new Projectile(newp.getPosition(), newv, newp.getRadius()/2);
            bp.setExpireTime(1000);
            bp.owner = client;
            bp.setFriendlyFire(true);
            bp.onDestroy = function(){
              for(let i = 0; i < pieces; i++){
                let newv = bounceVelocity(bp, worldState.world).multiplyScalar(0.5).add(randomDirection().multiplyScalar(5));
                let nbp = new Projectile(bp.getPosition(), newv, bp.getRadius()/1.5);
                nbp.setExpireTime(1000);
                nbp.owner = client;
                nbp.setFriendlyFire(true);
                worldState.projectiles.push(nbp);
              }
            }
            worldState.projectiles.push(bp);
          }
        }

        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'boosted dart',
      launchSpeed: 21,
      projectileRadius: 0.16,
      reloadTime: 2000,
      magazine: 30,
      maxMagazine: 30,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.owner = client;
        newp.setExpireTime(200);
        newp.seeking = newp.nearestTarget(worldState.clients);
        newp.correction_rate = 2;

        newp.onDestroy = function(){
          let nextp = new Projectile(newp.getPosition(), newp.getVelocity().multiplyScalar(5), newp.getRadius()/2);
          nextp.setExpireTime(5000);
          nextp.owner = client;
          worldState.projectiles.push(nextp);
        }

        worldState.projectiles.push(newp);
      }
    },
    { 
      name: 'build',
      launchSpeed: 60,
      projectileRadius: 0.35,
      reloadTime: 500,
      magazine: 150,
      maxMagazine: 150,
      launch: function(client, worldState){
        let velocity = client.direction.clone().normalize().multiplyScalar(this.launchSpeed);
        let newp = new Projectile(client.position.clone(), velocity, this.projectileRadius);
        newp.setExpireTime(200);
        newp.owner = client;
        
        newp.onDestroy = function(){
          let p = newp.getPosition();
          if(newp.getAge() < 200){
            worldState.createBlockAt(p);
          }
        }

        worldState.projectiles.push(newp);
      },
    },
  ];

  // projectile just hit something. If it hit the world, reflect velocity
  // off the face of the block.
  function bounceVelocity(projectile, world){
    let p = projectile.getPosition();
    let inch = 0.03;
    let canMoveX = world.noBlockAt(p.clone().setX(p.x + inch)) && world.noBlockAt(p.clone().setX(p.x - inch));
    let canMoveY = world.noBlockAt(p.clone().setY(p.y + inch)) && world.noBlockAt(p.clone().setY(p.y - inch));
    let canMoveZ = world.noBlockAt(p.clone().setZ(p.z + inch)) && world.noBlockAt(p.clone().setZ(p.z - inch));

    let direction = [canMoveX, canMoveY, canMoveZ].map(function(canMove){
      if(canMove){
        return 1;
      }else{
        return -1;
      }
    });

    return projectile.getVelocity().multiply(new THREE.Vector3(...direction));
  }

  function randomDirection(){
    return new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
  }
  
  var proto = types[type_];
  
  this.name = proto.name;
  this.launchSpeed = proto.launchSpeed;
  this.projectileRadius = proto.projectileRadius;
  this.reloadTime = proto.reloadTime;
  this.magazine = proto.magazine;
  this.maxMagazine = proto.maxMagazine;

  this.launch = proto.launch;

};

Loadout.SCOUT = 0;
Loadout.SNIPER = 1;
Loadout.SCATTER = 2;
Loadout.HEAVY = 3;
Loadout.SEEKING = 4;
Loadout.BOMB = 5;
Loadout.BOUNCE = 6;
Loadout.DRILL = 7;
Loadout.BRIDGE = 8;
Loadout.FRACTURE = 9;
Loadout.BOOSTED_DART = 10;
Loadout.BUILD = 11;

Loadout.prototype.constructor = Loadout;


export { Loadout };