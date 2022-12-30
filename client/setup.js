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

  var mapFile;
  var ready = false;
  var onReadyFunc;

  if(params.serving){
    console.log("starting server", params.serving);
    document.getElementById("startButton").disabled = true;

    let doc = document.getElementById("mapfile");
    doc.addEventListener("change", function(){
      var file = doc.files[0];
      var reader = new FileReader();
      reader.onload = function(event) {
        let text = event.target.result;
        // check if text is valid json formatte map?
        mapFile = text;
        document.getElementById("startButton").disabled = false;
      }
      if(file){
        reader.readAsText(file);
      }
    });

    document.getElementById("startButton").onclick = function(){
      if (!ready) {
        onReadyFunc();
        ready = true;
      }
    }
  }else if(params.joining){
    console.log("joining server", params.joining);
    document.getElementById('mapSelect').hidden = true;
    onReadyFunc(); // client is immediately ready
  }else{
    console.log("neither serving nor joining...");
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