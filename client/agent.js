/*
An Agent controls the way other players are represented graphically in the scene.
An agent has:
- model (cylindrical body)
- nameTag (text floating above model)
- 'face' smaller cylinder pointing in the direction
  they are looking
*/
var Agent = function (scene_) {
  
  var scene = scene_;
  var direction = new THREE.Quaternion();

  var color = new THREE.Color("red");
  var playerClass = "scout";
  var name = "defaultname";

  var model;
  var nameTag;
  var face;

  var goldenTag = false;

  this.setClass = function(c){
    playerClass = c;
  }

  this.setName = function(n){
    name = n;
  }

  this.getName = function(){
    return name;
  }

  this.getPosition = function(){
    return model.position.clone();
  }

  this.setGoldenTag = function(golden){
    goldenTag = golden;
  }

  this.draw = function(){
    var cylinderGeometry = new THREE.CylinderBufferGeometry(0.375, 0.375, 1.75, 10);
    cylinderGeometry = cylinderGeometry.toNonIndexed(); // ensure each face has unique vertices

    var material = new THREE.MeshLambertMaterial({
      color: color
    });

    // to give the player a star texture, use newMaterial:
    //const loader = new THREE.TextureLoader();
    //let newMaterial = new THREE.MeshBasicMaterial({color: player.color, map: loader.load('/sprites/Star.png')});

    model = new THREE.Mesh(cylinderGeometry, material);
    model.position.x = 0;
    model.position.y = 0;
    model.position.z = 0;

    this.updateNameTag();
    drawFace();

    scene.add(model);
  };

  function drawFace(){
    var cylinderGeometry = new THREE.CylinderBufferGeometry(0.1, 0.1, 0.75, 5);
    cylinderGeometry = cylinderGeometry.toNonIndexed(); // ensure each face has unique vertices
    cylinderGeometry.translate(0, 0.75/2, 0); // raise half height so origin is at bottom of cylinder
    cylinderGeometry.rotateX(-3.1416/2); // rotate to point towards 0,0,0,0 quaternion (default rotation)

    var material = new THREE.MeshLambertMaterial({
      color: 'green',
    });

    face = new THREE.Mesh(cylinderGeometry, material);
    face.position.setY(0.75);

    model.add(face);
  }

  this.updateNameTag = function() {
    let ntp = new THREE.Vector3();
    if (nameTag) {
      model.remove(nameTag);
    }
    nameTag = makeTextSprite(name);
    nameTag.position.set(0,0.75,0); // relative to player
    model.add(nameTag); // add as child object
  }

  var yoffset = 2 - (1.75/2) - 0.5;
  this.updatePosition = function(p, facing) {
    // p is camera position, 1.5 above ground
    // model position is in the center of the cylinder
    model.position.set(...p.setY(p.y - yoffset).toArray());
    face.quaternion.set(...facing.toArray());
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
    let metrics = context.measureText(" " + text + " "); // add padding on sides
    let textWidth = metrics.width;

    // background color
    context.fillStyle = "rgba(" + 255 + "," + 200 + "," +
      100 + "," + 0.4 + ")";
    // border color
    context.strokeStyle = "rgba(" + 0 + "," + 0 + "," +
      0 + "," + 0 + ")";

    context.lineWidth = 0;
    if(goldenTag){
      context.fillStyle = "rgba(" + 20 + "," + 20 + "," +
        20 + "," + 0.7 + ")";
      context.strokeStyle = "rgba(255, 252, 58, 1.0)";
      context.lineWidth = 2;
    }
    roundRect(context, canvas.width / 2 - textWidth / 2, 0, textWidth, fontsz * 1.4, 6);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";
    if(goldenTag){
      context.fillStyle = "rgba(255, 252, 58, 1.0)";
    }
    context.textAlign = "center";
    context.fillText(text, canvas.width / 2, fontsz);

    // canvas contents will be used for a texture
    let texture = new THREE.Texture(canvas)
    texture.needsUpdate = true;
    let spriteMaterial = new THREE.SpriteMaterial({
      map: texture
    });
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.5, 1.25, 1.0);
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

  this.remove = function(){
    scene.remove(model);
  }

  this.flash = function(flashColor) {
    this.flashing = true;
    let self = this; // so we can reference from within the function
    let flash = function () {
      if (self.flashing) {
        let originalColor = color;
        self.updateColor(flashColor);
        setTimeout(function () {
          self.updateColor(originalColor);
          setTimeout(flash, 100);
        }, 100);
      }
    }
    flash();
  }

  this.stopFlash = function(){
    this.flashing = false;
  }


};

Agent.prototype.constructor = Agent;


export { Agent };