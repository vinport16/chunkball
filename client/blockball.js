import {PointerLockControls} from './pointerlock.js';
import {World} from './world.js';
import {Chunk} from './chunk.js';
import {Player} from './player.js';
import {Agent} from './agent.js';
import {Communication} from './comms/communication.js';
import {Server} from './comms/server.js';
import {Client} from './comms/client.js';
import {Channel} from './comms/channel.js';
import {Chat} from './comms/chat.js'
import {Setup} from './setup.js'
var scene = new THREE.Scene();
var camera, renderer, controls;

var chat;
var setup = new Setup();
var communication;
var client;
var server;
var world = new World(10, 3);

setup.onReady(function () {

  communication = new Communication();

  client = new Client(world, scene);
  client.setName(communication.getUsername());

  if (communication.isServing()) {

    server = new Server(world, scene);

    communication.onConnect(function (conn) {
      server.addClient(conn);
    });

    world.populateWorldFromMap(JSON.parse(setup.getMapFile()));

    let channel = new Channel().getSides();
    client.connectServer(channel[0], player);
    server.addClient(channel[1]);
    client.setName(communication.getUsername());
    chat = new Chat(channel[0]);

  } else {

    communication.onConnect(function (conn) {
      client.connectServer(conn, player);
      chat = new Chat(conn);

      world.setRequestChunkFunc(function(p){
        conn.send({requestChunk:{position:p.toArray()}});
      });
      world.fullRefresh();
    });
  }

  init();
  animate();
});

//var world = chunkWorld;
var player = new Player(new THREE.Vector3(2, 100, 3), world);


// var moveForward = false;
// var moveBackward = false;
// var moveLeft = false;
// var moveRight = false;
// var canJump = false;
// var velocity = new THREE.Vector3();
// var terminalVelocityY = -25;
// var direction = new THREE.Vector3();
// var color = new THREE.Color();
// var sprint = false;
var startTime = Date.now();
// var playerJustFell = false;
var loadStatus = 1;
var playerClass = "scout";
var reloadTime = 100;
var playerSnowballCount = 1000;


function init() {
  //scene.background = new THREE.Color( 0x44ff00 );
  scene.background = new THREE.MeshLambertMaterial({
    color: 0x663333
  });
  scene.fog = new THREE.Fog(0x99ff88, 100, 150);
  var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  let a = new Agent(scene);
  a.setName("test player");
  a.draw();
  a.updatePosition(new THREE.Vector3(10.5, 3.5, 1.5), new THREE.Vector3());

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 150);
  camera.position.y = 10;
  add_crosshair(camera);

  player.init(scene, camera)

  var blocker = document.getElementById('blocker');
  var instructions = document.getElementById('instructions');
  var leaderboard = document.getElementById('leaderboard');
  var startButton = document.getElementById('startButton');

  function setPlayUI() {
    instructions.style.display = 'none';
    leaderboard.style.display = '';
    blocker.style.display = 'none';
  }

  function setPauseUI() {
    blocker.style.display = 'block';
    instructions.style.display = '';
    leaderboard.style.display = '';
  }

  startButton.addEventListener('click', function () {
    var username = document.getElementById('userName').value;
    //socket.emit("setUser", {name:username});
    player.play();
    setPlayUI();
  }, false);

  //socket.emit("respawn");

  var onClick = function (event) {
    client.launch();
  }
  var onKeyDown = function (event) {
    switch (event.keyCode) {
      case 27: // escape
        setPauseUI();
        break;
      case 16: // shift
        player.zoom();
        break;
      case 38: // up
      case 87: // w
        var elapsedTime = ((Date.now() - startTime) / 1000).toFixed(3);
        if (elapsedTime < 0.5) {
          player.sprint = true;
        }
        player.moveForward = true;
        break;
      case 37: // left
      case 65: // a
        player.moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        player.moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        player.moveRight = true;
        break;
      case 32: // space
        player.jump();
        break;
      case 69: // e
        client.launch();
        break;
      case 88: //x, change class
        player.changeClass();
        break;
      case 77: //m, change mode
        // ? what mode ?
        break;
      case 84: //t, talk

        break;
    }
  };
  var onKeyUp = function (event) {
    switch (event.keyCode) {
      case 16: // shift
        player.unzoom();
      case 38: // up
      case 87: // w
        startTime = Date.now();
        player.sprint = false;
        player.moveForward = false;
        break;
      case 37: // left
      case 65: // a
        player.moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        player.moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        player.moveRight = false;
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

function animate() {
  requestAnimationFrame(animate);
  player.animate();
  world.draw(scene, player);
  renderer.render(scene, camera);
}




















var players = {};
var projectiles = {};




//Move this to a draw player function and call it from update player when player properties change
// socket.on("new player", function(player){
//     drawPlayer(player);
// });


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
  let flash = function () {
    if (player.flash) {
      let original_color = player.color;
      player.color = color;
      updatePlayerColor(player);
      setTimeout(function () {
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


// socket.on("player left", function(id){
//     scene.remove(players[id].model);
//     scene.remove(players[id].usernameLabel);
//     delete players[id];
// });

function createProjectile(p) {
  var geometry = new THREE.SphereBufferGeometry(1, 8, 5);
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

//socket.emit("map");