import { Chunk } from './chunk.js';

var EmptyChunk = function(position_, size_){
  var position = position_.clone().floor();
  var entities = [];
  var blockUpdate = false;

  var size = size_;

  this.world = null;

  this.isEmpty = true;

  this.blockAt = function(v){
    return false;
  }

  this.noBlockAt = function(v){
    return true;
  }

  this.getPosition = function(){
    return position.clone();
  }

  this.build = function(scene){}

  this.draw = function(scene){}

  this.hide = function(scene){}

  this.unbuild = function(scene){}

  this.size = function(){
    return size;
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

};

EmptyChunk.prototype.constructor = EmptyChunk;

export { EmptyChunk };