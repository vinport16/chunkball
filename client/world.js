import { Chunk } from './chunk.js';

var World = function () {

  var chunkSize = new THREE.Vector3(10, 10, 10);
  var chunkRadius = 2;
  var renderRadius = 2.5;

  var focusedChunk;

  var chunkMap = {};

  function chunkKey(v){
    // v must be floored
    return '' + v.x + ';' + v.y + ';' + v.z;
  }

  function vec2chunk(v){
    let p = v.floor();
    return chunkMap[chunkKey(p)];
  }

  function pos2chunk(p){
    return vec2chunk(p.clone().divide(chunkSize));
  }

  this.setChunk = function(chunk){
    chunk.world = this;
    chunkMap[chunkKey(chunk.getPosition().divide(chunkSize))] = chunk;
    focusedChunk ||= chunk;
  }

  this.blockAt = function(p){
    let chunk = pos2chunk(p);
    if(chunk == null){
      return false;
    }
    return chunk.blockAt(p.sub(chunk.getPosition()));
  }

  this.noBlockAt = function(p){
    return !this.blockAt(p);
  }

  this.adjacentChunks = function(position){
    let p = position.clone().divide(chunkSize).floor();
    let x = p.x;
    let y = p.y;
    let z = p.z;
    let neighbors = [];

    for(let ix=-1; ix<2; ix++){
      for(let iy=-1; iy<2; iy++){
        for(let iz=-1; iz<2; iz++){
          neighbors.push(vec2chunk(p.set(x+ix,y+iy,z+iz)));
        }
      }
    }
    return neighbors;
  }

  this.visibleChunks = function(){
    let center = focusedChunk.getPosition().divide(chunkSize).floor();
    let p = center.clone();
    let x = p.x;
    let y = p.y;
    let z = p.z;
    let visible = [];

    let outerBound = Math.floor(renderRadius) + 1;

    for(let ix=-outerBound; ix<=outerBound; ix++){
      for(let iy=-outerBound; iy<=outerBound; iy++){
        for(let iz=-outerBound; iz<=outerBound; iz++){
          if(p.set(x+ix,y+iy,z+iz).distanceTo(center) <= renderRadius){
            visible.push(vec2chunk(p));
          }
        }
      }
    }
    return visible.filter(x => x != null);

  }

  this.draw = function(scene){
    this.visibleChunks().forEach( function(chunk){
      chunk.draw(scene, focusedChunk.getPosition());
    });
  }

  this.print = function(){
    Object.keys(chunkMap).forEach(function(key){
      console.log(key);
    });
  }

};

//World.prototype = Object.create( Object.prototype );
//World.prototype.constructor = World;

export { World };