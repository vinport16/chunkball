import {PointerLockControls} from './pointerlock.js';

var Player = function (position_, world_) {
  
  var position = position_.clone();
  var world = world_;

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

  var prevTime = performance.now();

  var camera = null;
  var controls = null;

  var loadout = {
    name: "scout",
    reloadTime:100,
    loadStatus:100,
    magazine:300,
    maxMagazine:300,
  };

  this.init = function(scene, camera_){
    camera = camera_;
    controls = new PointerLockControls(camera);
    controls.getObject().position.x = position.x;
    controls.getObject().position.y = position.y;
    controls.getObject().position.z = position.z;
    scene.add(controls.getObject());
  }

  this.play = function(){
    controls.lock();
  }

  this.pause = function(){
    controls.unlock();
  }

  this.onControlsLock = function(f){
    controls.addEventListener('lock', f);
  }

  this.onControlsUnlock = function(f){
    controls.addEventListener('unlock', f);
  }

  this.zoom = function(){
    camera.fov = 10;
    controls.speedFactor = 0.0004;
    camera.updateProjectionMatrix();
  }

  this.unzoom = function(){
    camera.fov = 75;
    controls.speedFactor = 0.002;
    camera.updateProjectionMatrix();
  }

  this.jump = function(){
    if(canJump){
      velocity.y += 9;
    }
    canJump = false;
  }

  this.setLoadout = function(l){
    loadout = l;
    document.getElementById('snowballCount').innerHTML = loadout.magazine;
  }

  this.isLocked = function(){
    return controls.isLocked;
  }

  this.launch = function(){
    // return launch angle
    if(loadout.loadStatus >= loadout.reloadTime && controls.isLocked && loadout.magazine > 0) {
      var vector = new THREE.Vector3(0, 0, -1);
      vector.applyQuaternion(camera.quaternion);
      
      loadout.loadStatus = 0;
      loadout.magazine -= 1;
      document.getElementById('snowballCount').innerHTML = loadout.magazine;
      return vector;
    }
    return false;
  }

  this.getPosition = function(){
    return controls.getObject().position.clone();//.setY(controls.getObject().position.y - 0.75);
  }

  this.getDirection = function(){
    return camera.quaternion.clone();
  }

  this.setPosition = function(p){
    controls.getObject().position.setX(p.x);
    controls.getObject().position.setY(p.y);
    controls.getObject().position.setZ(p.z);
  }

  this.isPositionColliding = function(position){
    var checkspots = [];
    var mapPos = position.clone().sub(new THREE.Vector3(0, 1.5, 0));

    // other x or other z: false if standing only on one tile
    let ox = false;
    let oz = false;

    let radius = (0.375);

    if (mapPos.x % 1 > 1 - radius) {
      ox = mapPos.x + 1;
    } else if (mapPos.x % 1 < radius) {
      ox = mapPos.x - 1;
    }

    if (mapPos.z % 1 > 1 - radius) {
      oz = mapPos.z + 1;
    } else if (mapPos.z % 1 < radius) {
      oz = mapPos.z - 1;
    }

    checkspots.push(mapPos.clone());
    if (ox) {
      checkspots.push(mapPos.clone().setX(ox));
    }
    if (oz) {
      checkspots.push(mapPos.clone().setZ(oz));
    }
    if (ox && oz) {
      checkspots.push(mapPos.clone().setX(ox).setZ(oz));
    }

    let above = [];
    checkspots.forEach(function(spot) {
      above.push(spot.clone().add(new THREE.Vector3(0, 0.85, 0))); // middle of player
      above.push(spot.clone().add(new THREE.Vector3(0, 1.75, 0))); // top of player
    });

    checkspots = checkspots.concat(above);

    for (var i in checkspots) {
      if (world.blockAt(checkspots[i])) {
        return true;
      }
    }
    return false;
  }

  this.nextPosition = function(position, move) {

    // calculate step size: we want about 5 steps
    let stepsize = move.length() / (1 + Math.floor(move.length() / 0.5));
    stepsize = stepsize - 0.0005;
    if (stepsize < 0.0005) {
      stepsize = 0.0005;
    }

    let fauxPosition = position.clone();
    for (let step = stepsize; step < move.length(); step += stepsize) {
      fauxPosition.add(move.clone().normalize().multiplyScalar(stepsize));

      // if there is a collision during one of the 5 steps
      var collision = this.isPositionColliding(fauxPosition);
      if (collision) {
        let tinystep = stepsize;
        let direction = -1;
        // halve the distance 7 times until you find a position that is not colliding
        for (let i = 0; i < 7; i++) {
          tinystep = tinystep / 2;
          fauxPosition.add(move.clone().normalize().multiplyScalar(tinystep * direction));
          if (this.isPositionColliding(fauxPosition)) {
            direction = -1;
          } else {
            direction = 1;
          }
        }
        if (this.isPositionColliding(fauxPosition)) {
          fauxPosition.add(move.clone().normalize().multiplyScalar(tinystep * direction));
        }

        if (this.isPositionColliding(fauxPosition)) {
          // give up and revert to original position
          fauxPosition = position.clone();
        }

        break;
      }
    }

    if (collision) {
      // determine if you can go more in the x or y or z direction

      let xtester = fauxPosition.clone();
      xtester.x += Math.sign(move.x) / 100;
      let ytester = fauxPosition.clone();
      ytester.y += Math.sign(move.y) / 100;
      let ztester = fauxPosition.clone();
      ztester.z += Math.sign(move.z) / 100;

      let newMove = move.clone().sub(
        fauxPosition.clone().sub(position)
      );

      if (this.isPositionColliding(xtester)) {
        newMove.x = 0;
      }
      if (this.isPositionColliding(ytester)) {
        newMove.y = 0;
      }
      if (this.isPositionColliding(ztester)) {
        newMove.z = 0;
      }

      newMove.multiplyScalar(0.99); // friction prevents unchecked recursion...

      return this.nextPosition(fauxPosition.clone(), newMove);

    }
    return fauxPosition;
  }

  this.animate = function() {
    var time = performance.now();

    if (controls.isLocked === true) {

      var originalPosition = controls.getObject().position.clone();

      let slightlyLower = controls.getObject().position.clone();
      slightlyLower.y -= 0.01;
      var onObject = this.isPositionColliding(slightlyLower);

      var delta = (time - prevTime) / 1000;
      velocity.x -= velocity.x * 4.0 * delta;
      velocity.z -= velocity.z * 4.0 * delta;
      velocity.y -= 9.8 * 2.0 * delta; // 100.0 = mass
      if (velocity.y < terminalVelocityY) { // terminal velocity is negative
        velocity.y = terminalVelocityY;
      }
      direction.z = Number(this.moveForward) - Number(this.moveBackward);
      direction.x = Number(this.moveRight) - Number(this.moveLeft);
      direction.normalize(); // this ensures consistent movements in all directions
      if (this.sprint && (this.moveForward || this.moveBackward)) {
        velocity.z -= direction.z * 30.0 * delta;
      } else if (this.moveForward || this.moveBackward) {
        velocity.z -= direction.z * 17.5 * delta;
      }
      if (this.moveLeft || this.moveRight) velocity.x -= direction.x * 17.5 * delta;
      if (onObject === true) {
        velocity.y = Math.max(0, velocity.y);
        canJump = true;
      }
      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
      controls.getObject().position.y += (velocity.y * delta); // new behavior

      let newPosition = controls.getObject().position;
      let move = newPosition.sub(originalPosition);

      let newPos = this.nextPosition(originalPosition, move);
      controls.getObject().position.x = newPos.x;
      controls.getObject().position.y = newPos.y;
      controls.getObject().position.z = newPos.z;

      if (this.isPositionColliding(originalPosition)) {
        controls.getObject().position.x = originalPosition.x;
        controls.getObject().position.y = originalPosition.y; // THIS STOPS JUMPING THROUGH CEILINGS
        controls.getObject().position.z = originalPosition.z;
      }

      // what was the actual delta in position? this is the actual velocity
      velocity.y = (newPos.y - originalPosition.y) / delta;
      // TODO: do this in other dimensions. NOTE: velocity is rotated in direction of
      // camera, must rotate back to world coordinates

    } else {
      velocity.set(0, 0, 0);
      this.sprint = false;
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
    }

    loadout.loadStatus += time-prevTime;
    loadout.loadStatus = Math.min(loadout.loadStatus, loadout.reloadTime);
    document.getElementById( 'status-bar' ).style.width = ((loadout.loadStatus/loadout.reloadTime) * 100) + "%";

    prevTime = time;
  }

};

Player.prototype.constructor = Player;


export { Player };