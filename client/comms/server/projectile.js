/*
Projectile: server representation
*/
var idcounter = 0;

var Projectile = function (pos, vel, r) {
  const GRAVITY = 9.8;
  // for seeking, in rad/sec
  const CORRECTION_RATE = 1;

  var position = pos;
  var velocity = vel; // in blocks/sec
  var radius = r;
  var destroyed = false;

  var expires = 10000; // 10 sec
  var age = 0;

  // can this hit its owner?
  var friendlyFire = false;

  this.owner;
  this.id = idcounter++;

  // set to false or to an object with a position property (client)
  this.seeking = false;

  this.onDestroy = function(){
    // default: do nothing
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  this.step = function(deltaTime, worldState){
    age += deltaTime;
    
    if(this.seeking){

      let speed = velocity.length();
      let targetDirection = this.seeking.position.clone().sub(position).normalize();
      let angle = velocity.angleTo(targetDirection);

      if(angle < (CORRECTION_RATE * 0.001 * deltaTime)){
        velocity = targetDirection.multiplyScalar(speed);
      }else{
        velocity.lerp(targetDirection.multiplyScalar(speed), (CORRECTION_RATE * 0.001 * deltaTime)/angle );
        velocity.normalize().multiplyScalar(speed);
      }

    }else{

      velocity.setY(velocity.y - (0.001 * deltaTime * GRAVITY));

    }
    position.add(velocity.clone().multiplyScalar(0.001 * deltaTime));
  }

  // estimation of next position
  this.nextPosition = function(deltaTime, worldState){
    let v = velocity.clone().setY(velocity.y - (0.001 * deltaTime * GRAVITY));
    return position.clone().add(v.multiplyScalar(0.001 * deltaTime));
  }

  // returns best bet for missile target
  // or false if no other players are present
  this.nearestTarget = function(clients){
    let nearest = false;
    let myOwner = this.owner;
    clients.forEach(function(client){
      if(client != myOwner){
        if(nearest){
          if(targetScore(nearest) < targetScore(client)){
            nearest = client;
          }
        }else{
          nearest = client;
        }
      }
    });
    return nearest;
  }

  // larger score = better target
  function targetScore(client){
    let angle = velocity.angleTo(client.position.clone().sub(position)); // in radians
    let distance = client.position.distanceTo(position);
    // closeness is weighted less than smaller angle
    return 0.02 * distance + 1/angle;
  }

  this.moveToHitPosition = function(world){
    let delta = velocity.clone().multiplyScalar(0.010);
    let checkp = position.clone().sub(delta); // was not hitting at last position
    let direction = 1; // forward
    for(let i = 0; i < 9; i++){
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
    // make sure it's not fully inside the wall
    checkp.add(delta.clone().multiplyScalar(-1));
    position = checkp;
  }

  this.setExpireTime = function(t){
    expires = t;
  }

  this.getAge = function(){
    return age;
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

  this.getFriendlyFire = function(){
    return friendlyFire;
  }

  this.setFriendlyFire = function(ff){
    friendlyFire = ff;
  }

  this.destroy = function(worldState){
    destroyed = true;
    this.onDestroy();
  }
};

Projectile.prototype.constructor = Projectile;


export { Projectile };