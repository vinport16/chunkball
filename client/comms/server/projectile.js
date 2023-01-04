/*
Projectile: server representation
*/
var idcounter = 0;

var Projectile = function (pos, vel, r) {
  const GRAVITY = 9.8;

  var position = pos;
  var velocity = vel; // in blocks/sec
  var radius = r;
  var destroyed = false;

  var expires = 10000; // 10 sec
  var age = 0;

  this.owner;
  this.id = idcounter++;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  this.step10ms = function(){
    age += 10;
    velocity.setY(velocity.y - (0.010 * GRAVITY));
    position.add(velocity.clone().multiplyScalar(0.010));
  }

  this.nextDelta = function(){
    return velocity.clone().setY(velocity.y - (0.010 * GRAVITY));
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

  this.setExpireTime = function(t){
    expires = t;
  }

  this.expired = function(){
    return age >= expires;
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