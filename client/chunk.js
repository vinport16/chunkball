var Chunk = function (position_, blocks_, colors_) {
  
  var position = position_.clone().floor();
  // assume blocks is a perfect X by Y by Z prism - validate this in future? TODO
  var blocks = blocks_;
  var colors = colors_;
  var graphicsObject = null;

  var blockUpdate = false;

  this.world = null;

  this.blockAt = function(v){
    // will throw error if outside chunk
    return blocks[Math.floor(v.x)][Math.floor(v.y)][Math.floor(v.z)];
  }

  this.setBlock = function(v, block){
    blocks[Math.floor(v.x)][Math.floor(v.y)][Math.floor(v.z)] = block;
  }

  this.noBlockAt = function(v){
    return !this.blockAt(v);
  }

  this.getPosition = function(){
    return position.clone();
  }

  this.getColors = function(){
    return colors;
  }

  function makeSides(v,p){
    let sides = [];

    if(blocks[v.x+1] == undefined || !blocks[v.x+1][v.y][v.z] ){
      // +x
      var square = new THREE.Geometry();
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z+0.5));

      square.faces.push(new THREE.Face3(0, 2, 1));
      square.faces.push(new THREE.Face3(0, 3, 2));

      sides.push(square);
    }
    if(blocks[v.x-1] == undefined || !blocks[v.x-1][v.y][v.z]){
      // -x
      var square = new THREE.Geometry();
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y+0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y+0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z+0.5));

      square.faces.push(new THREE.Face3(0, 2, 1));
      square.faces.push(new THREE.Face3(0, 3, 2));

      sides.push(square);
    }
    if(blocks[v.x][v.y+1] == undefined || !blocks[v.x][v.y+1][v.z]){
      // +y
      var square = new THREE.Geometry();
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y+0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y+0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z+0.5));

      square.faces.push(new THREE.Face3(0, 1, 2));
      square.faces.push(new THREE.Face3(0, 2, 3));

      sides.push(square);
    }
    if(blocks[v.x][v.y-1] == undefined || !blocks[v.x][v.y-1][v.z]){
      // -y
      var square = new THREE.Geometry();
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z+0.5));

      square.faces.push(new THREE.Face3(0, 2, 1));
      square.faces.push(new THREE.Face3(0, 3, 2));

      sides.push(square);
    }
    if(blocks[v.x][v.y][v.z+1] == undefined || !blocks[v.x][v.y][v.z+1]){
      // +z
      var square = new THREE.Geometry();
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y+0.5, p.z+0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z+0.5));

      square.faces.push(new THREE.Face3(0, 2, 1));
      square.faces.push(new THREE.Face3(0, 3, 2));

      sides.push(square);
    }
    if(blocks[v.x][v.y][v.z-1] == undefined || !blocks[v.x][v.y][v.z-1]){
      // -z
      var square = new THREE.Geometry();
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y+0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y+0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x-0.5, p.y-0.5, p.z-0.5));
      square.vertices.push(new THREE.Vector3(p.x+0.5, p.y-0.5, p.z-0.5));

      square.faces.push(new THREE.Face3(0, 2, 1));
      square.faces.push(new THREE.Face3(0, 3, 2));

      sides.push(square);
    }
    return sides;
  }

  this.build = function(){
    // origin is the position of the currently focused chunk, which is treated as 0 for graphics

    let self = this; // needed to refer to 'this' inside forEach
    var allBoxes = new THREE.Geometry();

    blocks.forEach(function(layer, i) {
      layer.forEach(function(line, j) {
        line.forEach(function(block, k) {
          let v = new THREE.Vector3(i,j,k);
          if(self.blockAt(v)){
            var boxMaterial = new THREE.MeshLambertMaterial({color: colors[block][0]});
            boxMaterial.color.offsetHSL(0,0, Math.random() * colors[block][1] * 2 - colors[block][1] )
            
            // block's graphics position (center position)
            var p = v.clone().addScalar(0.5);

            var sides = makeSides(v,p);
            
            var vbox = new THREE.Geometry();
            for(var s in sides){
                vbox.merge(sides[s]);
            }

            vbox.computeFaceNormals();
            vbox.computeVertexNormals();
            for(var s in vbox.faces){
                vbox.faces[s].color = boxMaterial.color;
                
            }
            allBoxes.merge(vbox);
          }
        });
      });
    });

    // reposition in world coordinates
    let offset = this.getPosition();
    allBoxes.translate(offset.x, offset.y, offset.z);

    let mat = new THREE.MeshLambertMaterial({ vertexColors: THREE.FaceColors });
    var mesh = new THREE.Mesh(allBoxes, mat);
    graphicsObject = mesh;
  }

  this.draw = function(scene){
    if(graphicsObject == null){
      this.build();
      scene.add(graphicsObject);
    }
    graphicsObject.visible = true;
    if(blockUpdate.length > 0){
      // do update
      // this.build();
    }
  }

  this.hide = function(scene){
    graphicsObject.visible = false;
  }

  this.unbuild = function(scene){
    scene.remove(graphicsObject);
    graphicsObject = null;
  }

  this.size = function(){
    return new THREE.Vector3(blocks.length, blocks[0].length, blocks[0][0].length);
  }

  this.getBlocks = function(){
    return blocks;
  }

  this.distanceTo = function(p){
    let above = this.size().sub(p); // if positive, outside
    let below = p.clone().sub(this.getPosition()).sub(this.size()); // if positive, outside
    let distances = above.max(below).toArray(); // take maximum values in each direction
    let dsquared = distances.map(function(num){
      if(num < 0){
        return 0; // remove neagtive values
      }
      return num * num; // square positive values
    });
    let sum = dsquared.reduce(function (x, y) {return x + y;}, 0);
    return Math.sqrt(sum);
  }

  this.randomPosition = function(){
    let size = this.size();
    let p = new THREE.Vector3(
      Math.random() * size.x,
      Math.random() * size.y,
      Math.random() * size.z,
    );
    p.add(position).floor().addScalar(0.5); // in center of block
    return p;
  }

  // Returns position within chunk where a player can
  // stand on a block and not collide with other blocks.
  // Used for finding a random spawn location.
  this.findVoid = function(){
    let p = this.randomPosition();
    for(let i = 0; i < 20; i++){
      if(
        this.world.blockAt(p) &&
        this.world.noBlockAt(p.clone().setY(p.y+1)) && 
        this.world.noBlockAt(p.clone().setY(p.y+2))
      ){
        // add 2 to get player position
        p.setY(p.y + 2);



        return p;
      }
    }
    return false;
  }

};

Chunk.prototype.constructor = Chunk;

export { Chunk };