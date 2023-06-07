
var ControllerInput = function (_gamepadIndex) {

  // for reference inside functions
  var input = this;

  var gamepadIndex = _gamepadIndex;

  this.pointerLocked = true;

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

  var onKeyDown = function (buttonNumber) {
    switch (buttonNumber) {
      case 6: // left trigger (L2)
        notify('zoomStart');
        break;
      case 4: // upper left trigger (L1)
          notify('sprintStart');
        break;
      case 0: // (X)
        notify('jump');
        break;
      case 7: // right trigger
        notify('launch');
        break;
      case 3: // (∆), change class
        notify('changeLoadout');
        break;
      case 9: // options
        notify('escape');
        input.unlock();
        break;
    }
  };
  var onKeyUp = function (buttonNumber) {
    switch (buttonNumber) {
      case 6: // left trigger (L2)
        notify('zoomStop');
        break;
      case 4: // upper left trigger (L1)
        notify('sprintStop');
        break;
    }
  };

  function polishMoveDelta(delta){
    if(Math.abs(delta) < 0.1){
      return 0;
    }
    return Math.sign(delta);
  }

  this.getMovementUpdate = function(){
    if ( input.pointerLocked === false ) return {x:0, y:0};
    let gamepad = navigator.getGamepads()[gamepadIndex];
    if(gamepad == null){
      return {x:0,y:0};
    }

    return {
      x:polishMoveDelta(gamepad.axes[0]),
      y:polishMoveDelta(-gamepad.axes[1])
    }
  }

  function polishLookDelta(delta){
    if(Math.abs(delta) < 0.1){
      return 0;
    }
    return Math.pow(7*(Math.abs(delta)-0.099), 2)*Math.sign(delta);
  }

  this.getLookUpdate = function(){
    let gamepad = navigator.getGamepads()[gamepadIndex];
    if(gamepad == null){
      return {x:0,y:0};
    }

    return {
      x:polishLookDelta(gamepad.axes[2]),
      y:polishLookDelta(gamepad.axes[3])
    }
  }

  var lastButtons = false;
  function storeLastButtons(buttons){
    lastButtons = buttons.map(function(button){
      return {pressed:button.pressed};
    });
  }
  
  function pollGamepads() {
    let gamepads = navigator.getGamepads();
    if(gamepads[gamepadIndex] == null){return;}

    var buttons = gamepads[gamepadIndex].buttons;

    if(!lastButtons){
      storeLastButtons(buttons);
    }
    
    for (var j = 0; j < buttons.length; j++){
      if(buttons[j].pressed && !lastButtons[j].pressed){
        onKeyDown(j);
      }else if(!buttons[j].pressed && lastButtons[j].pressed){
        onKeyUp(j);
      }
    }

    storeLastButtons(buttons);
  }
  setInterval(pollGamepads, 5);

  this.lock = function (domElement) {
    this.pointerLocked = true;
  };

  this.unlock = function () {
    //this.pointerLocked = false;
  };

};

ControllerInput.prototype.constructor = ControllerInput;


export { ControllerInput };