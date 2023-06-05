
var ControllerInput = function () {

  const gamepadInfo = document.getElementById("gamepad-info");
  gamepadInfo.textContent = "Keyboard input.";
  var gp;
  
  window.addEventListener("gamepadconnected", (e) => {
    gp = navigator.getGamepads()[e.gamepad.index];
    gamepadInfo.textContent = `Gamepad connected at index ${gp.index}: ${gp.id}. It has ${gp.buttons.length} buttons and ${gp.axes.length} axes.`;
  });

  window.addEventListener("gamepaddisconnected", (e) => {
    gp = null;
    gamepadInfo.textContent = "Keyboard input.";
  });

};

ControllerInput.prototype.constructor = ControllerInput;


export { ControllerInput };