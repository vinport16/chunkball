var Player = function (position_, world_) {
  
  var position = position_.clone();
  var world = world_;

  this.sprint = false;
  
  var canJump = false;
  var velocity = new THREE.Vector3();
  var terminalVelocityY = -25;
  var direction = new THREE.Vector3();
  this.color = new THREE.Color();
  var playerJustFell = false;
  var scopeSpeedFactor = 0.002;

  var launchCallback = function(){};
  var changeLoadoutCallback = function(){};
  var onControlsLockFunc = function(){};
  var onControlsUnlockFunc = function(){};

  var prevTime = performance.now();

  var camera = null;
  var input = null;

  var loadout = {
    name: "scout",
    reloadTime:100,
    loadStatus:100,
    magazine:300,
    maxMagazine:300,
  };

  this.init = function(camera_, input_){
    camera = camera_;
    camera.position.x = position.x;
    camera.position.y = position.y;
    camera.position.z = position.z;
    input = input_;
    input.addListener(this);
  }

  this.notify = function(event, data){
    switch (event) {
      case 'zoomStart':
        this.zoom();
        break;
      case 'zoomStop':
        this.unzoom();
        break;
      case 'launch':
        this.launch();
        break;
      case 'sprintStart':
        this.sprint = true;
        break;
      case 'sprintStop':
        this.sprint = false;
        break;
      case 'jump':
        this.jump();
        break;
      case 'changeLoadout':
        this.requestChangeLoadout();
        break;
      case 'pointerLocked':
        onControlsLockFunc();
        break;
      case 'pointerUnlocked':
        onControlsUnlockFunc();
        break;
    }
  }

  this.play = function(){
    input.lock();
  }

  this.pause = function(){
    input.unlock();
  }

  this.zoom = function(){
    camera.fov = 10;
    scopeSpeedFactor = 0.0004;
    camera.updateProjectionMatrix();
  }

  this.unzoom = function(){
    camera.fov = 75;
    scopeSpeedFactor = 0.002;
    camera.updateProjectionMatrix();
  }

  this.onLaunchDo = function(func){
    launchCallback = func;
  }

  this.launch = function(){
    launchCallback();
  }

  this.onChangeLoadoutDo = function(func){
    changeLoadoutCallback = func;
  }

  this.requestChangeLoadout = function(){
    changeLoadoutCallback();
  }

  this.jump = function(){
    if(canJump){
      velocity.y += 9;
    }
    canJump = false;
  }

  this.setLoadout = function(l){
    loadout = l;
    document.getElementById('snowballCount').innerHTML = loadout.name + ": " + loadout.magazine;
  }

  this.isLocked = function(){
    return input.pointerLocked;
  }

  this.onControlsLock = function(callback){
    onControlsLockFunc = callback;
  }

  this.onControlsUnlock = function(callback){
    onControlsUnlockFunc = callback;
  }

  this.getLaunchAngle = function(){
    // return launch angle
    if(loadout.loadStatus >= loadout.reloadTime && input.pointerLocked && loadout.magazine > 0) {
      var vector = new THREE.Vector3(0, 0, -1);
      vector.applyQuaternion(camera.quaternion);
      
      loadout.loadStatus = 0;
      loadout.magazine -= 1;
      document.getElementById('snowballCount').innerHTML = loadout.name + ": " + loadout.magazine;
      return vector;
    }
    return false;
  }

  this.getPosition = function(){
    return camera.position.clone();//.setY(camera.position.y - 0.75);
  }

  this.getDirection = function(){
    return camera.quaternion.clone();
  }

  this.setPosition = function(p){
    camera.position.setX(p.x);
    camera.position.setY(p.y);
    camera.position.setZ(p.z);
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

  // define these once for use in swivelCamera
  var PI_2 = Math.PI / 2
  var euler = new THREE.Euler(0, 0, 0, 'YXZ');

  this.swivelCamera = function(){
    let turn = input.getLookUpdate();
    euler.setFromQuaternion( camera.quaternion );
    euler.y -= turn.x * scopeSpeedFactor;
    euler.x -= turn.y * scopeSpeedFactor;
    euler.x = Math.max( - PI_2, Math.min( PI_2, euler.x ) );
    camera.quaternion.setFromEuler( euler );
  }

  this.moveForward = function(distance){
    // move forward parallel to the xz-plane
    let vec = new THREE.Vector3();
    vec.setFromMatrixColumn(camera.matrix, 0);
    vec.crossVectors(camera.up, vec);
    camera.position.addScaledVector(vec, distance);
  };

  this.moveRight = function(distance){
    let vec = new THREE.Vector3();
    vec.setFromMatrixColumn(camera.matrix, 0);
    camera.position.addScaledVector(vec, distance);
  };

  this.moveUp = function(distance){
    camera.position.y += distance;
  }

  this.animate = function() {
    var time = performance.now();

    if (input.pointerLocked === true) {

      var originalPosition = camera.position.clone();

      this.swivelCamera();

      // DETERMINE IF PLAYER CAN JUMP
      let slightlyLower = camera.position.clone();
      slightlyLower.y -= 0.01;
      if (this.isPositionColliding(slightlyLower)) {
        velocity.y = Math.max(0, velocity.y);
        canJump = true;
      }

      var delta = (time - prevTime) / 1000;

      // UPDATE VELOCITY (INERTIA)
      velocity.x -= velocity.x * 4.0 * delta;
      velocity.z -= velocity.z * 4.0 * delta;
      velocity.y -= 9.8 * 2.0 * delta;
      if(velocity.length() < 0.1){
        velocity.set(0,0,0);
      }
      if (velocity.y < terminalVelocityY) { // terminal velocity is negative
        velocity.y = terminalVelocityY;
      }

      // CONVERT INPUTS TO DIRECTION VECTOR
      let inputs = input.getMovementUpdate();
      direction.z = inputs.y;
      direction.x = inputs.x;
      direction.normalize(); // this ensures consistent movements in all directions

      // DETERMINE SPEED
      if (this.sprint) {
        velocity.z -= direction.z * 30.0 * delta;
      } else if (direction.length() > 0.1) {
        velocity.z -= direction.z * 17.5 * delta;
      }
      if (this.moveLeft || this.moveRight) velocity.x -= direction.x * 17.5 * delta;

      this.moveRight(-velocity.x * delta);
      this.moveForward(-velocity.z * delta);
      this.moveUp(velocity.y * delta);

      // TODO
      //controls.moveRight(-velocity.x * delta);
      //controls.moveForward(-velocity.z * delta);
      //controls.getObject().position.y += (velocity.y * delta);

      let newPosition = camera.position;
      let move = newPosition.sub(originalPosition);

      let newPos = this.nextPosition(originalPosition, move);
      camera.position.x = newPos.x;
      camera.position.y = newPos.y;
      camera.position.z = newPos.z;

      if (this.isPositionColliding(originalPosition)) {
        camera.position.x = originalPosition.x;
        camera.position.y = originalPosition.y;
        camera.position.z = originalPosition.z;
      }

      // what was the actual delta in position? this is the actual velocity
      velocity.y = (newPos.y - originalPosition.y) / delta;
      // TODO: do this in other dimensions. NOTE: velocity is rotated in direction of
      // camera, must rotate back to world coordinates

    } else {
      velocity.set(0, 0, 0);
      this.sprint = false;
    }

    loadout.loadStatus += time-prevTime;
    loadout.loadStatus = Math.min(loadout.loadStatus, loadout.reloadTime);
    document.getElementById( 'status-bar' ).style.width = ((loadout.loadStatus/loadout.reloadTime) * 100) + "%";

    prevTime = time;
  }

};

Player.prototype.constructor = Player;


export { Player };