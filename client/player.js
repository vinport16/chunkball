var Player = function (position_, chunk_) {
  
  var position = position_.clone();
  var chunk = chunk_;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.sprint = false;
  var canJump = false;
  var velocity = new THREE.Vector3();
  var terminalVelocityY = -25;
  var direction = new THREE.Vector3();
  this.color = new THREE.Color();
  var playerJustFell = false;

  var camera = null;

  this.hide = function(){
    scene.remove(graphicsObject);
  }

  this.init = function(scene, camera_){
    camera = camera_
  }

  this.animate = function() {
    
  }

};

Player.prototype.constructor = Player;


export { Player };