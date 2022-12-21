
var Agent = function (world_) {
  
  var world = world_;
  var position = new THREE.Vector3();
  var direction = new THREE.Vector3();

  var color = new THREE.Color("red");
  var playerClass = "scout";
  var name = "defaultname";

  var model;
  var nameTag;

  this.setClass = function(c){
    playerClass = c;
  }

  this.getPosition = function(){
    return position.clone();
  }

  this.draw = function(scene){
    var cylinderGeometry = new THREE.CylinderBufferGeometry(0.375, 0.375, 1.75, 10);
    cylinderGeometry = cylinderGeometry.toNonIndexed(); // ensure each face has unique vertices

    var material = new THREE.MeshLambertMaterial({
      color: color
    });

    // to give the player a star texture, use newMaterial:
    //const loader = new THREE.TextureLoader();
    //let newMaterial = new THREE.MeshBasicMaterial({color: player.color, map: loader.load('/sprites/Star.png')});

    model = new THREE.Mesh(cylinderGeometry, material);
    model.position.x = position.x;
    model.position.y = position.y;
    model.position.z = position.z;
    model.name = "MODEL FOR: " + name;

    this.updateNameTag(scene);

    scene.add(model);
  };

  this.updateNameTag = function(scene) {
    if (nameTag) {
      scene.remove(nameTag);
    }
    nameTag = makeTextSprite(name);
    nameTag.position.set(position.clone().setY(position.y + 0.75));
    nameTag.name = "NAMETAG FOR: " + name;
    scene.add(nameTag);
  }

  this.updatePosition = function(p, facing) {
    model.position.set(...p.toArray());
    nameTag.position.set(...p.toArray());
  }

  this.updateColor = function(c) {
    color = new THREE.Color(c);
    model.material.color.set(color);
  }

  function makeTextSprite(text) {
    let canvas = document.createElement('canvas');
    canvas.width = 256; // width and height must be powers of 2
    canvas.height = 256;
    let context = canvas.getContext('2d');
    let fontsz = 32;
    context.font = "Bold " + fontsz + "px " + "Ariel";

    // get size data (height depends only on font size)
    let metrics = context.measureText(text);
    let textWidth = metrics.width;

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
    context.fillText(text, canvas.width / 2, fontsz);

    // canvas contents will be used for a texture
    let texture = new THREE.Texture(canvas)
    texture.needsUpdate = true;
    let spriteMaterial = new THREE.SpriteMaterial({
      map: texture
    });
    let sprite = new THREE.Sprite(spriteMaterial);
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


};

Agent.prototype.constructor = Agent;


export { Agent };