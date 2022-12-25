/*
Projectile
*/
var idcounter = 0;

var Projectile = function (pos, vel, r) {
  const GRAVITY = 9.8;

  var position = pos;
  var velocity = vel; // in blocks/sec
  var radius = r;
  var destroyed = false;
  this.id = idcounter++;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  this.step10ms = function(){
    velocity.setY(velocity.y - (0.010 * GRAVITY));
    position.add(velocity.clone().multiplyScalar(0.010));
  }

  this.moveToHitPosition = function(world){
    let delta = velocity.clone().multiplyScalar(0.010);
    let checkp = position.clone().sub(delta); // was not hitting at last position
    let direction = 1; // forward
    for(let i = 0; i < 5; i++){
      if(world.blockAt(checkp)){
        // back up
        direction = -1;
      }else{
        // get closer
        direction = 1;
      }
      delta.multiplyScalar(0.5);
      checkp.add(delta.clone().multiplyScalar(direction));
    }
    position = checkp;
  }

  this.getPosition = function(){
    return position.clone();
  }

  this.setPosition = function(p){
    return position = p;
  }

  this.getVelocity = function(){
    return velocity.clone();
  }

  this.getRadius = function(){
    return radius;
  }

  this.destroy = function(){
    destroyed = true;
  }
};

Projectile.prototype.constructor = Projectile;


export { Projectile };