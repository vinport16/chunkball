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
      maxMagazine: 500,
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
      magazine: 40,
      maxMagazine: 100,
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
      maxMagazine: 300,
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
      magazine: 10,
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
      magazine: 20,
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
        }

        worldState.projectiles.push(newp);
      },
    },
    { 
      name: 'bounce',
      launchSpeed: 25,
      projectileRadius: 0.11,
      reloadTime: 600,
      magazine: 40,
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

Loadout.prototype.constructor = Loadout;


export { Loadout };