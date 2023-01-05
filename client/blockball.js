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
import {Leaderboard} from './comms/leaderboard.js'
import {Setup} from './setup.js'
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 150);
var renderer, controls;

var chat;
var leaderboard;
var setup = new Setup();
var communication;
var client;
var server;
var world = new World(10, 6);

var player = new Player(new THREE.Vector3(4, 60, 4), world);
player.init(scene, camera)

setup.onReady(function () {

  communication = new Communication();

  client = new Client(world, scene);

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
    client.setColor(communication.getPlayerColor());
    chat = new Chat(channel[0]);
    leaderboard = new Leaderboard(channel[0]);

  } else {

    client.setName(communication.getUsername());
    client.setColor(communication.getPlayerColor());

    communication.onConnect(function (conn) {
      client.connectServer(conn, player);
      chat = new Chat(conn);
      leaderboard = new Leaderboard(conn);

      world.setRequestChunkFunc(function(p){
        conn.send({requestChunk:{position:p.toArray()}});
      });
      world.fullRefresh();
    });
  }

  init();
  player.play();
  animate();
});


// this is only used to measure a double-w-press for sprinting
var startTime = Date.now();


function setPlayUI() {
  instructions.style.display = 'none';
  //leaderboard.style.display = '';
  blocker.style.display = 'none';
}

function setPauseUI() {
  blocker.style.display = 'block';
  instructions.style.display = '';
  //leaderboard.style.display = '';
}

player.onControlsLock(setPlayUI);
player.onControlsUnlock(setPauseUI);

function init() {
  //scene.background = new THREE.Color( 0x44ff00 );
  scene.background = new THREE.MeshLambertMaterial({
    color: 0x663333
  });
  scene.fog = new THREE.Fog(0x99ff88, 100, 150);
  var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  // for graphics testing
  let a = new Agent(scene);
  a.setName("test player");
  a.draw();
  a.updatePosition(new THREE.Vector3(4.5, 4.5, 1.5), new THREE.Quaternion(0.01,0.01,1,0.01));

  add_crosshair(camera);

  var blocker = document.getElementById('blocker');
  var instructions = document.getElementById('instructions');
  var leaderboard = document.getElementById('leaderboard');
  var startButton = document.getElementById('startButton');

  startButton.addEventListener('click', function () {
    var username = document.getElementById('userName').value;
    player.play();
    setPlayUI();
  }, false);

  var onClick = function (event) {
    client.launch();
  }
  var onKeyDown = function (event) {
    switch (event.keyCode) {
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
        client.changeLoadout();
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
  light.position.set(-60, 200, 100);
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