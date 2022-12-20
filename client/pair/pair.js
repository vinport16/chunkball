var myid = "helleo";
var peer;
var conn;
var connection_complete = false;



peer = new Peer({
  host: window.location.hostname,
  port: window.location.port,
  path: '/peerjs/server'
});

peer.listAllPeers(function(allPeers){
  console.log(allPeers);
});
// peer has been created. lets update the UI to reflect that.

peer.on('connection', function(conn){

  console.log("peer created:", peer.id);

  connection_complete = true;
  
  conn.on('data', function(data){
    console.info("message recieved:", data);
  });
});


var setId = function(test_peer, last_attempt){
  if(last_attempt){
    myid = prompt("\"" + last_attempt + "\" is taken! try again:");
  }else{
    myid = prompt("create an ID");
  }

  test_peer.listAllPeers(function(allPeers){
    if(allPeers.includes(myid)){
      setId(test_peer, myid);
    }else{
      definePeer(myid);
      test_peer.destroy();
    }
  });
};

var join_game = function(last_attempt){
  let game_id;
  if(last_attempt){
    game_id = prompt("\"" + last_attempt + "\" does not exist! try again:");
  }else{
    game_id = prompt("game owner's id:");
  }

  conn = peer.connect(game_id);

  conn.on('open', function(){
    connection_complete = true;
    game.start(conn);
    console.warn("Connected!");
    conn.send("hello!!!!!!!!");
    peer.disconnect();

    conn.on('data', function(data){
      console.info("message recieved:", data);
      document.getElementById("ui").append(data);
    });
  });

  conn.on('error', function(err){
    console.log(err);
    join_game(game_id);
  });

};

// document.getElementById('host').onclick = function(){
//   setId(new Peer('test_peer',{host: window.location.hostname, port:window.location.port, path: '/peerjs/server'}), false);
// };

// document.getElementById('connect').onclick = function(){
//   join_game(false);
// };

