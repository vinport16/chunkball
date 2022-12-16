import {
  PointerLockControls
} from './pointerlock.js';
import {
  World
} from './world.js';
import {
  Chunk
} from './chunk.js';
var camera, scene, renderer, controls;
var world = new World();
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var terminalVelocityY = -25;
var direction = new THREE.Vector3();
var color = new THREE.Color();
var sprint = false;
var startTime = Date.now();
var playerJustFell = false;
var loadStatus = 1;
var playerClass = "scout";
var reloadTime = 100;
var playerSnowballCount = 1000;

init();
animate();

function init() {
  scene = new THREE.Scene();
  //scene.background = new THREE.Color( 0x44ff00 );
  scene.background = new THREE.MeshLambertMaterial({
    color: 0x663333
  });
  scene.fog = new THREE.Fog(0x99ff88, 100, 150);
  var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 150);
  camera.position.y = 10;
  add_crosshair(camera);

  controls = new PointerLockControls(camera);
  var blocker = document.getElementById('blocker');
  var instructions = document.getElementById('instructions');
  var leaderboard = document.getElementById('leaderboard');
  var startButton = document.getElementById('startButton');

  startButton.addEventListener('click', function() {
    var username = document.getElementById('userName').value;
    //socket.emit("setUser", {name:username});
    controls.lock();
  }, false);
  controls.addEventListener('lock', function() {
    instructions.style.display = 'none';
    leaderboard.style.display = '';
    blocker.style.display = 'none';
  });
  controls.addEventListener('unlock', function() {
    blocker.style.display = 'block';
    instructions.style.display = '';
    leaderboard.style.display = '';
  });
  controls.getObject().position.x = 2;
  controls.getObject().position.y = 90;
  controls.getObject().position.z = 2;
  //socket.emit("respawn");
  scene.add(controls.getObject());
  var onClick = function(event) {
    if (loadStatus > 0.999 && controls.isLocked && playerSnowballCount > 0) {
      var vector = new THREE.Vector3(0, 0, -1);
      vector.applyQuaternion(camera.quaternion);

      //socket.emit("launch", {dx:vector.x, dy:vector.y, dz:vector.z});
      loadStatus = 0;

      playerSnowballCount--;
      document.getElementById('snowballCount').innerHTML = playerSnowballCount;
    }
  }
  var onKeyDown = function(event) {
    switch (event.keyCode) {
      case 16: // shift
        camera.fov = 10;
        controls.speedFactor = 0.0004;
        camera.updateProjectionMatrix();
        break;
      case 38: // up
      case 87: // w
        var elapsedTime = ((Date.now() - startTime) / 1000).toFixed(3);
        if (elapsedTime < 0.5) {
          sprint = true;
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
        if (canJump === true) velocity.y += 9;
        canJump = false;
        break;
      case 69: // e
        // shoot
        if (!playerJustFell) {
          onClick(event);
        }
        break;
      case 88: //x, change class
        if (playerClass == "scout") {
          //socket.emit("change class", "sniper");
        } else if (playerClass == "sniper") {
          //socket.emit("change class", "heavy");
        } else if (playerClass == "heavy") {
          //socket.emit("change class", "scout");
        }
        break;
      case 77: //m, change mode

        break;
    }
  };
  var onKeyUp = function(event) {
    switch (event.keyCode) {
      case 16: // shift
        camera.fov = 75;
        controls.speedFactor = 0.002;
        camera.updateProjectionMatrix();
      case 38: // up
      case 87: // w
        startTime = Date.now();
        sprint = false;
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
  };

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('click', onClick, false);


  var light = new THREE.DirectionalLight(0xffffff, 1);
  light.castShadow = true;
  light.shadowCameraVisible = true;
  light.shadow.camera.near = 100;
  light.shadow.camera.far = 200;
  light.shadow.camera.left = -20; // CHANGED
  light.shadow.camera.right = 20; // CHANGED
  light.shadow.camera.top = 20; // CHANGED
  light.shadow.camera.bottom = -20; // CHANGED

  light.position.set(-60, 200, 100); // CHANGED
  scene.add(light);
  //
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffaadd, 1);
  document.body.appendChild(renderer.domElement);
  //
  window.addEventListener('resize', onWindowResize, false);
}

function add_crosshair(camera) {
  var material = new THREE.LineBasicMaterial({
    color: 0xAAFFAA
  });
  // crosshair size
  var x = 0.005,
    y = 0.005;

  var geometry = new THREE.Geometry();

  // crosshair
  geometry.vertices.push(new THREE.Vector3(0, y, 0));
  geometry.vertices.push(new THREE.Vector3(0, -y, 0));
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(new THREE.Vector3(x, 0, 0));
  geometry.vertices.push(new THREE.Vector3(-x, 0, 0));

  var crosshair = new THREE.Line(geometry, material);

  // place it in the center
  var crosshairPercentX = 50;
  var crosshairPercentY = 50;
  var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
  var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

  crosshair.position.x = crosshairPositionX * camera.aspect;
  crosshair.position.y = crosshairPositionY;

  crosshair.position.z = -0.25;

  camera.add(crosshair);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function isColliding(position) {
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
    above.push(spot.clone().add(new THREE.Vector3(0, 0.75, 0))); // middle of player
    above.push(spot.clone().add(new THREE.Vector3(0, 1.50, 0))); // top of player
  });

  checkspots = checkspots.concat(above);

  for (var i in checkspots) {
    if (world.blockAt(checkspots[i])) {
      return true;
    }
  }
  return false;
}

var lastlogged = null;

function nextPosition(position, move) {

  // if horizontal movement is small, allow only vertical movement
  //if(Math.abs(move.x) + Math.abs(move.z) < 0.001){
  //    let next = position.clone();
  //    next.y += move.y;
  //    return next;
  //}

  // slightlyHigher can also be slightly lower, depending on vertical direction
  let slightlyHigher = position.clone();
  slightlyHigher.y += Math.sign(move.y) / 0.5;

  // if you are moving up or down, and you will be colliding with a block, allow
  // vertical movement only
  //if(isColliding(position) || isColliding(slightlyHigher)){
  //    let next = position.clone();
  //    next.y += move.y;
  //    return next;
  //}

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
    var collision = isColliding(fauxPosition);
    if (collision) {
      let tinystep = stepsize;
      let direction = -1;
      // halve the distance 7 times until you find a position that is not colliding
      for (let i = 0; i < 7; i++) {
        tinystep = tinystep / 2;
        fauxPosition.add(move.clone().normalize().multiplyScalar(tinystep * direction));
        if (isColliding(fauxPosition)) {
          direction = -1;
        } else {
          direction = 1;
        }
      }
      if (isColliding(fauxPosition)) {
        fauxPosition.add(move.clone().normalize().multiplyScalar(tinystep * direction));
      }
      break;
    }
  }

  if (collision) {
    // determine if you can go more in the x or y or z direction

    let xtester = fauxPosition.clone();
    xtester.x += Math.sign(move.x) / 10;
    let ytester = fauxPosition.clone();
    ytester.y += Math.sign(move.y) / 10;
    let ztester = fauxPosition.clone();
    ztester.z += Math.sign(move.z) / 10;

    let newMove = move.clone().sub(
      fauxPosition.clone().sub(position)
    );

    if (isColliding(xtester)) {
      newMove.x = 0;
    }
    if (isColliding(ytester)) {
      newMove.y = 0;
    }
    if (isColliding(ztester)) {
      newMove.z = 0;
    }
    return nextPosition(fauxPosition.clone(), newMove);

  }
  return fauxPosition;

}

function animate() {
  requestAnimationFrame(animate);
  if (controls.getObject().position.y <= 2) {
    if (!playerJustFell) {
      playerJustFell = true;
      velocity.y = 0;
      // controls.getObject().position.y = 1000;
      // controls.getObject().position.z = -500;
      //socket.emit("playerFell")
    }
  }

  if (controls.isLocked === true) {

    var originalPosition = new THREE.Vector3();
    originalPosition.x = controls.getObject().position.x;
    originalPosition.y = controls.getObject().position.y;
    originalPosition.z = controls.getObject().position.z;


    let slightlyLower = controls.getObject().position.clone();
    slightlyLower.y -= 0.01;
    var onObject = isColliding(slightlyLower);

    var time = performance.now();
    var delta = (time - prevTime) / 1000;
    velocity.x -= velocity.x * 4.0 * delta;
    velocity.z -= velocity.z * 4.0 * delta;
    velocity.y -= 9.8 * 2.0 * delta; // 100.0 = mass
    if (velocity.y < terminalVelocityY) {
      velocity.y = terminalVelocityY;
    }
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions
    if (sprint && (moveForward || moveBackward)) {
      velocity.z -= direction.z * 30.0 * delta;
    } else if (moveForward || moveBackward) {
      velocity.z -= direction.z * 17.5 * delta;
    }
    if (moveLeft || moveRight) velocity.x -= direction.x * 17.5 * delta;
    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += (velocity.y * delta); // new behavior

    let newPosition = controls.getObject().position;
    let move = newPosition.sub(originalPosition);

    let newPos = nextPosition(originalPosition, move);
    controls.getObject().position.x = newPos.x;
    controls.getObject().position.y = newPos.y;
    controls.getObject().position.z = newPos.z;

    if (isColliding(originalPosition)) {
      controls.getObject().position.x = originalPosition.x;
      controls.getObject().position.y = originalPosition.y; // THIS STOPS JUMPING THROUGH CEILINGS
      controls.getObject().position.z = originalPosition.z;
    }

    // what was the actual delta in position? this is the actual velocity
    velocity.y = (newPos.y - originalPosition.y) / delta;

    // update reload status and bar
    loadStatus += (time - prevTime) / reloadTime;
    loadStatus = Math.min(loadStatus, 1);
    document.getElementById('status-bar').style.width = (loadStatus * 100) + "%";

    // if ( controls.getObject().position.y < 10 ) {
    //     velocity.y = 0;
    //     respawn();
    //     canJump = true;
    // }
    prevTime = time;

  } else {
    velocity.set(0, 0, 0);
    sprint = false;
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
  }
  renderer.render(scene, camera);
}


let blocks = [
  [
    [1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  [
    [1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
];

for (let i = 0; i < 8; i++) {
  blocks.push([
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]);
}

let flatchunk = [];
for (let i = 0; i < 10; i++) {
  flatchunk.push([
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]);
}

let tentchunk = [];
for (let i = 0; i < 10; i++) {
  tentchunk.push([
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]);
}

let c = new Chunk(new THREE.Vector3(0, 0, 0), blocks);
world.setChunk(c);

for (let x = -5; x <= 5; x++) {
  for (let z = -5; z <= 5; z++) {
    let c = new Chunk(new THREE.Vector3(x * 10, -10, z * 10), flatchunk);
    world.setChunk(c);
  }
}

c = new Chunk(new THREE.Vector3(-10, 0, 0), tentchunk);
world.setChunk(c);
c = new Chunk(new THREE.Vector3(-10, 0, -10), tentchunk);
world.setChunk(c);

c = new Chunk(new THREE.Vector3(10, 0, 0), blocks);
world.setChunk(c);
c = new Chunk(new THREE.Vector3(10, 0, 10), blocks);
world.setChunk(c);

c = new Chunk(new THREE.Vector3(10, 10, 10), blocks);
world.setChunk(c);

c = new Chunk(new THREE.Vector3(20, 10, 10), blocks);
world.setChunk(c);

c = new Chunk(new THREE.Vector3(30, 10, 10), blocks);
world.setChunk(c);

c = new Chunk(new THREE.Vector3(40, 10, 10), blocks);
world.setChunk(c);

c = new Chunk(new THREE.Vector3(30, 10, 10), blocks);
world.setChunk(c);

world.draw(scene);

var players = {};
var projectiles = {};

function drawPlayer(player) {
  var cylinderGeometry = new THREE.CylinderBufferGeometry(0.375, 0.375, 1.75, 10);
  cylinderGeometry = cylinderGeometry.toNonIndexed(); // ensure each face has unique vertices

  var material = new THREE.MeshLambertMaterial({
    color: player.color
  });

  // to give the player a star texture, use newMaterial:
  //const loader = new THREE.TextureLoader();
  //let newMaterial = new THREE.MeshBasicMaterial({color: player.color, map: loader.load('/sprites/Star.png')});

  var model = new THREE.Mesh(cylinderGeometry, material);
  model.position.x = player.position.x;
  model.position.y = player.position.y;
  model.position.z = player.position.z;
  model.name = "MODEL FOR: " + player.id;

  player.userName = player.name;

  updatePlayerNameTag(player);

  player.model = model;
  players[player.id] = player;
  scene.add(model);
}


//Move this to a draw player function and call it from update player when player properties change
// socket.on("new player", function(player){
//     drawPlayer(player);
// });

function updatePlayerColor(player) {
  player.model.material.color.set(player.color);
}

function updatePlayerNameTag(player) {
  if (player.usernameLabel) {
    removeEntity(player.usernameLabel);
  }
  player.usernameLabel = makeTextSprite(player.userName);
  player.usernameLabel.position.set(player.position.x, player.position.y + 0.75, player.position.z);
  player.usernameLabel.name = "USERNAME FOR: " + player.id;
  scene.add(player.usernameLabel);
}

// socket.on("updatePlayer", function(player){
//     var p = players[player.id];
//     p.name = player.name;
//     p.userName = player.name;
//     p.color = player.color;
//     updatePlayerColor(p);
//     updatePlayerNameTag(p);
// });

function flash(player, color) {
  player.flash = true;
  let flash = function() {
    if (player.flash) {
      let original_color = player.color;
      player.color = color;
      updatePlayerColor(player);
      setTimeout(function() {
        player.color = original_color;
        updatePlayerColor(player);
        setTimeout(flash, 100);
      }, 100);
    }
  }
  flash();
}

// socket.on("flash player", function(player_id, color){
//     flash(players[player_id], color);
// });

// socket.on("stop flash", function(player_id){
//     players[player_id].flash = false;
// });

// socket.on("set class", function(newClass){
//     playerClass = newClass.name;
//     reloadTime = newClass.reloadTime;
// });

function removeEntity(object) {
  var selectedObject = scene.getObjectByName(object.name);
  scene.remove(selectedObject);
}

function makeTextSprite(message) {
  var canvas = document.createElement('canvas');
  canvas.width = 256; // width and height must be powers of 2
  canvas.height = 256;
  var context = canvas.getContext('2d');
  var fontsz = 32;
  context.font = "Bold " + fontsz + "px " + "Ariel";

  // get size data (height depends only on font size)
  var metrics = context.measureText(message);
  var textWidth = metrics.width;

  // background color
  context.fillStyle = "rgba(" + 255 + "," + 200 + "," +
    100 + "," + 0.4 + ")";
  // border color
  context.strokeStyle = "rgba(" + 0 + "," + 0 + "," +
    0 + "," + 0 + ")";
  roundRect(context, canvas.width / 2 - textWidth / 2, 0, textWidth, fontsz * 1.4, 6);
  // 1.4 is extra height factor for text below baseline: g,j,p,q.

  // text color
  context.fillStyle = "rgba(0, 0, 0, 1.0)";
  context.textAlign = "center";
  context.fillText(message, canvas.width / 2, fontsz);

  // canvas contents will be used for a texture
  var texture = new THREE.Texture(canvas)
  texture.needsUpdate = true;
  var spriteMaterial = new THREE.SpriteMaterial({
    map: texture
  });
  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(30, 25, 1.0);
  sprite.center = new THREE.Vector2(0.5, 0.5);

  return sprite;
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function updatePlayer(player) {
  var p = players[player.id];
  p.model.position.x = player.position.x;
  p.model.position.y = player.position.y;
  p.model.position.z = player.position.z;

  p.usernameLabel.position.x = player.position.x;
  p.usernameLabel.position.y = (player.position.y) + 0.75;
  p.usernameLabel.position.z = player.position.z;
}

// socket.on("player left", function(id){
//     scene.remove(players[id].model);
//     scene.remove(players[id].usernameLabel);
//     delete players[id];
// });

function createProjectile(p) {
  var geometry = new THREE.SphereBufferGeometry(0.1, 0.25, 0.25);
  var material = new THREE.MeshLambertMaterial({
    color: 0xaaaaaa
  });
  var sphere = new THREE.Mesh(geometry, material);

  sphere.position.x = p.x;
  sphere.position.y = p.y;
  sphere.position.z = p.z;

  p.object = sphere;
  scene.add(sphere);
  projectiles[p.id] = p;
}

function updateProjectile(p) {
  if (projectiles[p.id] == null) {
    createProjectile(p);
  } else {
    var o = projectiles[p.id].object;
    o.position.x = p.x;
    o.position.y = p.y;
    o.position.z = p.z;
  }
}


// socket.on("objects",function(things){
//     let p = things.players;
//     for(var i in p){
//         if(players[p[i].id] != null){
//             updatePlayer(p[i]);
//         }
//     }

//     p = things.projectiles;
//     for(var i in p){
//         updateProjectile(p[i]);
//     }
// });

// socket.on("moveTo", function(position){
//     console.log("gettin moved to ", position);
//   controls.getObject().position.x = position.x;
//   controls.getObject().position.y = (position.y + 1.5);
//   controls.getObject().position.z = position.z;
//   playerJustFell = false;
//   socket.emit("moved", {});
// })

// socket.on("projectile burst", function(p){
//     if(!projectiles[p.id]){
//         createProjectile(p);
//     }
//     var o = projectiles[p.id].object;
//     o.position.x = p.x;
//     o.position.y = p.y;
//     o.position.z = p.z;

//     o.material = new THREE.MeshLambertMaterial( {color: 0xFF5511} );
//     setTimeout(function(){
//         scene.remove(projectiles[p.id].object);
//     }, 1500);

// });

// socket.on("create item", function(item, type){
//   if(!scene.getObjectByName(item.name)){
//     let spriteMap;
//     if(type == "flag"){
//       spriteMap = new THREE.TextureLoader().load( "/sprites/Star.png" );
//     }else if(type == "snowballPile"){
//       //TODO: change this sprite
//       spriteMap = new THREE.TextureLoader().load( "/sprites/snowballPile.png" );
//     }
//     let spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap } );
//     let sprite = new THREE.Sprite( spriteMaterial );

//     sprite.position.x = item.position.x;
//     sprite.position.y = item.position.y;
//     sprite.position.z = item.position.z;

//     //console.log(sprite.position);

//     sprite.name = item.name;
//     //sprite.id = item.id;
//     sprite.scale.set(1,1,0.05);
//     scene.add(sprite);
//   }
// });

// socket.on("remove item", function(f){
//   removeEntity(f);
// });

// socket.on("update snowball count", function(count){
//   playerSnowballCount = count;
//   document.getElementById('snowballCount').innerHTML = playerSnowballCount;
// });

// socket.on("leaderboard", function(board) {
//     document.getElementById('leaderboard').innerHTML = board;
// });

// socket.on("restart screen", function(){
//   controls.unlock();
// });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendDataToServer() {
  while ("Vincent" > "Michael") {
    await sleep(20);
    socket.emit("player position", {
      x: controls.getObject().position.x,
      y: (controls.getObject().position.y - 0.75),
      z: controls.getObject().position.z
    });
  }
}

//socket.emit("map");
//sendDataToServer();