
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
  var onDataFunc;

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
      onConnFunc();
      console.log("sending data now");
      c.on('data', function(data){
        onDataFunc(data);
      });
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
        onConnFunc();
        console.log("sending data now");
      });
      conn.on('close', function(){
        console.log("closed.....");
      });
      conn.on('data', function(data){
        onDataFunc(data);
      });
    });
    
  }else{
    alert("u didn't start a server or join a server so...... ur crinje");
    // TODO start server with no network connection
  }

  this.onConnect = function(f){
    onConnFunc = f;
  }

  this.onDataFromPeer = function(f){
    onDataFunc = f;
  }

  this.conn = function(){
    return conn;
  }


};

Communication.prototype.constructor = Communication;


export { Communication };