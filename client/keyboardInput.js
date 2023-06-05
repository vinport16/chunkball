
var KeyboardInput = function () {

  // for reference inside functions
  var input = this;
  
  // movement direction. -1 to 1
  this.forward = 0;
  this.right = 0;

  // look direction. in pixels
  this.lookUp = 0;
  this.lookRight = 0;

  var moveForward = false;
  var moveBackward = false;
  var moveRight = false;
  var moveLeft = false;

  this.jumping = false;
  this.sprinting = false;
  this.zoom = false;
  this.launch = false;
  this.changeLoadout = false;
  this.pointerLocked = false;

  var listeners = [];

  function notify(event, data){
    listeners.forEach(function(listener){
      listener.notify(event, data);
    });
  }

  this.addListener = function(listener){
    listeners.push(listener);
  }

  this.removeListener = function(listener){
    let index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // this is only used to measure a double-w-press for sprinting
  var startTime = Date.now();

  var onClick = function (event) {
    notify('launch');
  }
  var onKeyDown = function (event) {
    switch (event.keyCode) {
      case 16: // shift
        notify('zoomStart');
        break;
      case 38: // up
      case 87: // w
        var elapsedTime = ((Date.now() - startTime) / 1000).toFixed(3);
        if (elapsedTime < 0.5) {
          notify('sprintStart');
        }
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 32: // space
        notify('jump');
        break;
      case 69: // e
        notify('launch');
        break;
      case 88: // x, change class
        notify('changeLoadout');
        break;
      case 27: // escape
        notify('escape');
        input.unlock();
        break;
    }
    updateForwardRight();
  };
  var onKeyUp = function (event) {
    switch (event.keyCode) {
      case 16: // shift
        notify('zoomStop');
      case 38: // up
      case 87: // w
        startTime = Date.now();
        notify('sprintStop');
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
    updateForwardRight();
  };

  var updateForwardRight = function(){
    input.forward = Number(moveForward) - Number(moveBackward);
    input.right = Number(moveRight) - Number(moveLeft);
  }

  var updateCameraAxes = function(dx,dy){
    input.lookUp += dy;
    input.lookRight += dx;
  }

  this.getMovementUpdate = function(){
    if ( input.pointerLocked === false ) return {x:0, y:0};
    return {x:input.right, y:input.forward};
  }

  this.getLookUpdate = function(){
    let saved = {x:input.lookRight, y:input.lookUp};
    input.lookRight = 0;
    input.lookUp = 0;
    return saved;
  }

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('click', onClick, false);

  var onMouseMove = function( event ) {
    if ( input.pointerLocked === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    updateCameraAxes(movementX, movementY);
  }

  var onPointerlockChange = function() {
    input.pointerLocked = document.pointerLockElement !== null
    if(input.pointerLocked){
      notify('pointerLocked');
    }else{
      notify('pointerUnlocked');
    }
  }

  var onPointerlockError = function() {
    console.error( 'PointerLockControls: Unable to use Pointer Lock API' );
  }

  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'pointerlockchange', onPointerlockChange, false );
  document.addEventListener( 'pointerlockerror', onPointerlockError, false );

  this.lock = function (domElement) {
    (domElement || document.body).requestPointerLock();
  };

  this.unlock = function () {
    document.exitPointerLock();
  };

};

KeyboardInput.prototype.constructor = KeyboardInput;


export { KeyboardInput };