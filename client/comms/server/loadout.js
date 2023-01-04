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
      maxMagazine: 500,
      launch: function(position, angle){
        let velocity = angle.normalize().multiplyScalar(this.launchSpeed);
        return [new Projectile(position, velocity, this.projectileRadius)];
      },
    },
    { 
      name: 'sniper',
      launchSpeed: 80,
      projectileRadius: 0.06,
      reloadTime: 1000,
      maxMagazine: 50,
      launch: function(position, angle) {
        let velocity = angle.normalize().multiplyScalar(this.launchSpeed);
        return [new Projectile(position, velocity, this.projectileRadius)];
      },
    },
    { 
      name: 'scatter',
      launchSpeed: 25,
      projectileRadius: 0.1,
      reloadTime: 500,
      maxMagazine: 100,
      launch: function(position, angle){
        let velocity = angle.normalize().multiplyScalar(this.launchSpeed);
        let output = [];
        for(let i = 0; i < 12; i++){
          let radModifier = (Math.random() - 0.5) * 0.10;
          let directionModifier = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(15);
          let p = new Projectile(position.clone(), velocity.clone().add(directionModifier), this.projectileRadius + radModifier);
          p.setExpireTime(1000);
          output.push(p);
        }
        return output;
      },
    },
    { 
      name: 'heavy',
      launchSpeed: 35,
      projectileRadius: 0.8,
      reloadTime: 300,
      maxMagazine: 300,
      launch: function(position, angle){
        let velocity = angle.normalize().multiplyScalar(this.launchSpeed);
        return [new Projectile(position, velocity, this.projectileRadius)];
      },
    },
  ];
  
  var proto = types[type_];
  
  this.name = proto.name;
  this.launchSpeed = proto.launchSpeed;
  this.projectileRadius = proto.projectileRadius;
  this.reloadTime = proto.reloadTime;
  this.maxMagazine = proto.maxMagazine;

  this.launch = proto.launch;

};

Loadout.SCOUT = 0;
Loadout.SNIPER = 1;
Loadout.SCATTER = 2;
Loadout.HEAVY = 3;

Loadout.prototype.constructor = Loadout;


export { Loadout };