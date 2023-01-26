import {MapCatalog} from './mapCatalog.js';
import { Loadout } from './comms/server/loadout.js';

/*
Setup is instantiated before any connections are made or game is started. Performs
server setup.
*/
var Setup = function () {
  
  const urlParams = new URLSearchParams(location.search);
  var params = {};
  for (const [key, value] of urlParams) {
    params[key] = value
  }

  // THIS IS THE LIST OF DEFAULT MAP OPTIONS
  // the first one will be the default default map
  var mapAddresses = {
    "splash": "../maps/splash.json",
    "magica": "../maps/magicamap.json",
    "building": "../maps/building.json",
    "blobland": "../maps/floating_blobland.json",
    "platforms": "../maps/platforms.json",
    "first town": "../maps/firstTown.json",
    "small city": "../maps/smallCity.json",
    "tiny test map": "../maps/testSpawn.json",
  };

  var roundDurations = {
    "1 Minute": 60,
    "2 Minutes": 120,
    "5 Minutes": 300,
    "10 Minutes": 600
  }

  var mapSelects = [];
  var mapFile = false;
  var started = false;
  var onReadyFunc;

  if(params.serving){
    document.getElementById('mapSelect').hidden = false;
    addMapUnit();

    document.getElementById("addMap").onclick = addMapUnit;

  }else if(params.joining){
    // do nothing
  }else{
    console.error("neither serving nor joining...");
  }

  document.getElementById("startButton").onclick = function(){
    if (!started) {
      document.getElementById('mapSelect').hidden = true;
      onReadyFunc();
      started = true;
    }
  }

  function fileSelect(){
    let upload = document.createElement("input");
    upload.type = "file";
    upload.enctype = "multipart/form-data";
    return upload;
  }

  function mapsSelect(maps){
    let select = document.createElement("select");
    Object.keys(maps).forEach(function(mapName){
      let op = document.createElement("option");
      select.appendChild(op);
      op.value = maps[mapName];
      let text = document.createTextNode(mapName);
      op.appendChild(text);
    });
    return select;
  }

  function durationSelect(){
    let duration = document.createElement("select");
    Object.keys(roundDurations).forEach(function(durationText){
      let op = document.createElement("option");
      duration.appendChild(op);
      op.value = roundDurations[durationText];
      let text = document.createTextNode(durationText);
      op.appendChild(text);
      // Set default to 5 min
      if(roundDurations[durationText] == 300){
        op.selected = true;
      }
    });
    return duration;
  }

  function loadoutSelect(){
    let loadoutBoxes = document.createElement("div");
    var typeId = 0;
    for (var loadoutType in Loadout){
      let loadoutCb = document.createElement("input");
      loadoutCb.type = "checkbox";
      loadoutCb.id = loadoutType;
      loadoutCb.value = typeId;
      loadoutCb.checked = true;
      let loadoutLabel = document.createElement("label");
      loadoutLabel.setAttribute("for", loadoutType);
      loadoutLabel.innerHTML = loadoutType.toLowerCase();
      loadoutBoxes.appendChild(loadoutCb);
      loadoutBoxes.appendChild(loadoutLabel);
      loadoutBoxes.appendChild(document.createElement("br"))
      typeId++;
    }
    return loadoutBoxes;
  }

  function mapSelectUnit(){
    let unit = {};
    let element = document.createElement("div");
    element.classList.add("mapSelectUnit");
    let ourMaps = mapsSelect(mapAddresses);
    ourMaps.classList.add("selectedMapInput"); // we use this by default
    let yourMap = fileSelect();
    element.appendChild(ourMaps);
    if(mapSelects.length != 0){
      // first map select can't be removed
      let remove = document.createElement("button");
      remove.appendChild(document.createTextNode("remove"));
      remove.classList.add("remove-map");
      remove.onclick = function(){
        element.parentNode.removeChild(element);
        mapSelects = mapSelects.filter(u => u != unit);
      }
      element.appendChild(remove);
    }
    element.appendChild(document.createElement('br'));
    element.appendChild(yourMap);

    let roundDuration = durationSelect();
    element.appendChild(roundDuration);
    unit.element = element;

    let loadouts = loadoutSelect();
    element.appendChild(loadouts);

    // Create inital array of loadouts for the selected object:
    var loadoutArr = [...Array(Object.keys(Loadout).length).keys()];

    // this unit has internal map select logic built in.
    
    var selected = {file: false, address: ourMaps.value, name: Array.from( ourMaps.children ).find( child => child.value == ourMaps.value ).innerText, duration: 300, loadoutTypes: loadoutArr};

    yourMap.addEventListener("change", function(){
      var file = yourMap.files[0];
      if(file){
        selected.file = file;
        selected.address = false;
        selected.name = file.name;
      }
      ourMaps.classList.remove("selectedMapInput");
      yourMap.classList.add("selectedMapInput");
    });

    ourMaps.addEventListener("change", function(){
      selected.file = false;
      selected.address = ourMaps.value;
      selected.name = Array.from( ourMaps.children ).find( child => child.value == ourMaps.value ).innerText;
      yourMap.classList.remove("selectedMapInput");
      ourMaps.classList.add("selectedMapInput");
    });

    roundDuration.addEventListener("change", function(){
      selected.duration = parseInt(roundDuration.value, 10);
    });

    var divChildren = loadouts.childNodes;
    for (var childIndex in divChildren){
      var child = divChildren[childIndex];
      if (child.type == "checkbox"){
        child.addEventListener("change", function(){
          if(this.checked){
            selected.loadoutTypes.push(Number(this.value))
          }else{
            const index = selected.loadoutTypes.indexOf(Number(this.value));
            selected.loadoutTypes.splice(index, 1)
          }
        })
      }
    }

    unit.getSelected = function(){
      // return {file: file object or false, address: string or false, name: string}; TODO
      return selected;
    }
    return unit;
  }

  function addMapUnit(){
    let mapSelectElement = document.getElementById('mapSelect');
    let unit = mapSelectUnit();
    mapSelects.push(unit);
    mapSelectElement.appendChild(unit.element);
  }

  this.isServing = function(){
    return !!params.serving;
  }

  this.isJoining = function(){
    return !!params.joining;
  }

  this.getUsername = function(){
    return params.username;
  }

  this.getMapFile = function(){
    return mapFile;
  }

  this.getMapCatalog = function(){
    let maps = [];
    mapSelects.forEach(function(unit){
      maps.push(unit.getSelected());
    });
    return new MapCatalog(maps);
  }

  this.onReady = function(f){
    onReadyFunc = f;
  }


};

Setup.prototype.constructor = Setup;


export { Setup };