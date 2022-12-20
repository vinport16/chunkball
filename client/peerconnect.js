
const urlParams = new URLSearchParams(location.search);
var params = {};
for (const [key, value] of urlParams) {
  params[key] = value
}

// TODO set username in params, store in peer metadata?

var peer;
var conn;

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
    console.log("someone joined my test peer 'px'");
    c.send("hello");
    c.on('data', function(data){
      console.info("px message recieved:", data);
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
      conn.send('data', 1234);
      console.log("sent 1234");
    });
    conn.on('close', function(){
      console.log("closed.....");
    });
    conn.on('data', function(data){
      console.log("recieved data:", data);
    });
  });
  
}else{
  alert("u didn't start a server or join a server so...... ur crinje");
  // TODO start server with no network connection
}