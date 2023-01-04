/*
Leaderboard controlls the Leaderboard in the UI.
Needs specific HTML elements present on page:
<div id="leaderboard">
  Leaderboard
  <table id="leaderboard-list"></table>
</div>
*/
var Leaderboard = function(conn){
  
  var board = document.getElementById("leaderboard");
  var list = document.getElementById("leaderboard-list");
  var data = {};

  conn.on("data", function(d){
    if(d.leaderboard){
      data = d.leaderboard;
      updateUI();
    }
  });

  function updateUI(){
    sortData();

    let newlist = document.createElement('table');
    
    data.list.forEach(function(player){
      let row = document.createElement('tr');

      let name = document.createElement('td');
      name.innerText = player.name;

      if(player.id == data.myId){
        name.className = 'myName';
      }
      row.appendChild(name);

      let k = document.createElement('td');
      k.innerText = player.victims.length;
      k.className = 'k'
      row.appendChild(k);

      let d = document.createElement('td');
      d.innerText = player.assailants.length;
      d.className = 'd';
      row.appendChild(d);

      newlist.appendChild(row);
    });


    board.replaceChild(newlist, list);
    list = newlist;
  }

  // sort by k/(d+1)
  function sortData(){
    data.list.sort(function(a,b){
      let ascore = (a.assailants.length)/((a.victims.length)+1);
      let bscore = (b.assailants.length)/((b.victims.length)+1);
      return ascore - bscore;
    });
  }

};

Leaderboard.prototype.constructor = Leaderboard;


export { Leaderboard };