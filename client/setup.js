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

  var mapFile = false;
  var ready = false;
  var onReadyFunc;

  if(params.serving){
    console.log("starting server", params.serving);

    let doc = document.getElementById("mapfile");
    doc.addEventListener("change", function(){
      var file = doc.files[0];
      var reader = new FileReader();
      reader.onload = function(event) {
        let text = event.target.result;
        // check if text is valid json formatte map?
        mapFile = text;
      }
      if(file){
        reader.readAsText(file);
      }
    });

    let select = document.getElementById("selectedMap");
    let useSelectedMap = function(){
      let xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() { 
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
              mapFile = xmlHttp.responseText;
      }
      xmlHttp.open("GET", select.value, true); // true for asynchronous 
      xmlHttp.send(null);
    }
    select.addEventListener("change", useSelectedMap);
    useSelectedMap();

  }else if(params.joining){
    console.log("joining server", params.joining);
    document.getElementById('mapSelect').hidden = true;
  }else{
    console.log("neither serving nor joining...");
  }

  document.getElementById("startButton").onclick = function(){
    if (!ready && (params.joining || mapFile)) {
      document.getElementById('mapSelect').hidden = true;
      onReadyFunc();
      ready = true;
    }
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

  this.onReady = function(f){
    onReadyFunc = f;
  }


};

Setup.prototype.constructor = Setup;


export { Setup };