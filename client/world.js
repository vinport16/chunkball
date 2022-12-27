import { Chunk } from './chunk.js';
import { EmptyChunk } from './emptyChunk.js';

var World = function () {

  var chunkSize = new THREE.Vector3(10, 10, 10);
  // how many chunks in each direction should be visible?
  var renderRadius = 2.5;
  // how far do you have to move from the focused chunk to change focus?
  var chunkRadius = 2;

  var focusedChunk = null;

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
    if(!chunk){
      return false;
    }
    return chunk.blockAt(p.clone().sub(chunk.getPosition()));
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

  var visibleChunkCacheCenter = null;
  var visibleChunkCache = [];

  this.visibleChunks = function(){
    if(visibleChunkCacheCenter === focusedChunk){
      return visibleChunkCache;
    }

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

    visibleChunkCache = visible.filter(x => x != null);
    return visibleChunkCache;
  }

  this.createEmptyChunkAt = function(position){
    let chunk = new EmptyChunk(position.clone().divide(chunkSize).floor().multiply(chunkSize), chunkSize.clone());
    this.setChunk(chunk);
    return chunk;
  }

  this.calculateFocusedChunk = function(player){
    let p = player.getPosition();
    let playerChunk = pos2chunk(p) || this.createEmptyChunkAt(p);

    if( playerChunk === focusedChunk ) return;
    if(focusedChunk.distanceTo(p) > chunkRadius){
      focusedChunk = playerChunk;
    }
  }

  this.updateVisibleChunks = function(scene){
    let previouslyVisible = [...visibleChunkCache]; // clone
    let visible = this.visibleChunks()
    let difference = previouslyVisible.filter(x => !visible.includes(x));
    
    difference.forEach( function(chunk){
      chunk.unbuild(scene);
    });
    visible.forEach( function(chunk){
      chunk.draw(scene);
    });
  }

  this.draw = function(scene, player){
    if(!focusedChunk) return;
    this.calculateFocusedChunk(player);
    this.updateVisibleChunks(scene);
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