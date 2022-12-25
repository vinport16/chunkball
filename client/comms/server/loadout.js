import {Projectile} from './projectile.js';
/*
Loadout
*/
var Loadout = function (type_, world_) {
  
  var type = type_;
  var world = world_;

  var launchSpeed = 40; // blocks per second
  var projectileRadius = 0.12;

  this.launch = function(position, angle){
    // calc velocity
    let velocity = angle.normalize().multiplyScalar(launchSpeed);
    return [new Projectile(position, velocity, projectileRadius)];
  }

};

Loadout.SCOUT = 0;
Loadout.SNIPER = 1;
Loadout.prototype.constructor = Loadout;


export { Loadout };