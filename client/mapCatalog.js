import {World} from './world.js';
/*
MapCatalog is where the server stores the list of maps it will use for the rounds.
Initiate with a list of maps from the input, each map having the format:
  {
    file: file object or false,
    address: url string or false,
    name: string
  }
*/
var MapCatalog = function (maps) {

  var cycle = true;
  var worlds = maps;
  var currentWorldIdx = maps.length-1;
  
  this.printWorldsList = function(){
    console.log(worlds);
  }

  this.setCycle = function(setting){
    cycle = setting;
  }

  this.prepareNextWorld = function(world){

    return {
      then: function(callback){

        currentWorldIdx++;
        if(currentWorldIdx >= worlds.length){
          currentWorldIdx = 0;
        }

        // clear world
        world.fullRefresh();

        let mapData = worlds[currentWorldIdx];
        if(mapData.file){
          // read file
          let reader = new FileReader();
          reader.onload = function(event) {
            let text = event.target.result;
            // check if text is valid json formatted map? TODO
            world.populateWorldFromMap(JSON.parse(text));
            // world is prepared, execute callback
            callback();
          }
          reader.readAsText(mapData.file);

        }else if(mapData.address){
          // read from URL
          let xmlHttp = new XMLHttpRequest();
          xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
              // check if text is valid json formatted map? TODO
              let text = xmlHttp.responseText;
              world.populateWorldFromMap(JSON.parse(text));
              // world is prepared, execute callback
              callback();
            }else if(xmlHttp.readyState == 4){
              console.error("map cannot be found at address", mapData);
              callback();
            }
          }
          xmlHttp.open("GET", mapData.address, true); // true for asynchronous 
          xmlHttp.send(null);

        }else{
          console.error("map data has neither file nor address", mapData);
          callback();
        }
      }
    }
  }

  this.getCurrentWorldName = function(){
    return worlds[currentWorldIdx].name;
  }

  this.getCurrentWorldDuration = function(){
    return worlds[currentWorldIdx].duration;
  }

  this.getCurrentLoadoutTypes = function(){
    return worlds[currentWorldIdx].loadoutTypes;
  }

};


MapCatalog.prototype.constructor = MapCatalog;


export { MapCatalog };