/*
The Communication object, when initialized, starts to either set up or connect to a
server immediately based on the present URL parameters.
- onConnFunc will be executed when a connection is made: passes connection object
*/
var Communication = function () {
  
  const urlParams = new URLSearchParams(location.search);
  var params = {};
  for (const [key, value] of urlParams) {
    params[key] = value
  }

  // TODO set username in params, store in peer metadata?

  var peer;
  var conn;

  var onConnFunc;

  if(params.serving){
    console.log("starting server", params.serving);
    peer = new Peer(params.serving);
    peer.on('error', function(err){
      alert(err + "\nSend back to index...");
      // TODO redirect
    });

    // start up game

    // when people connect, add them to game
    peer.on('connection', function(c){
      conn = c;
      console.log("someone joined my test peer 'px'");
      c.on("open", function(){
        console.log("sending data now");
        onConnFunc(conn);
      })
    });
  }else if(params.joining){
    console.log("joining server", params.joining);
    peer = new Peer(); // id doesn't matter
    peer.on('error', function(err){
      alert("peer connection error!\n" + err);
      // TODO redirect to home ?
    });
    peer.on("open", function(){
      conn = peer.connect(params.joining);

      conn.on('error', function(err){
        console.log("cx error:\n" + err);
        // TODO redirect to index
      });
      conn.on('open', function(){
        console.log("cx open");
        onConnFunc(conn);
        console.log("sending data now");
      });
    });
    
  }else{
    alert("u didn't start a server or join a server so...... ur crinje");
    // TODO start server with no network connection
  }

  this.onConnect = function(f){
    onConnFunc = f;
  }

  this.conn = function(){
    return conn;
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

  this.getPlayerColor = function(){
    return params.color || "#AA0000";
  }


};

Communication.prototype.constructor = Communication;


export { Communication };