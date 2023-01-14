/*
RoundManager keeps track of time in round and planning for next round
*/

var RoundManager = function () {

  // times are in seconds
  var roundDuration = 60 * 5;
  var beforeRoundDuration = 30;
  
  const timeText = {
    5: "five seconds",
    10: "ten seconds",
    20: "twenty seconds",
    30: "thirty seconds",
    60: "one minute",
    120: "two minutes",
    180: "three minutes",
    240: "four minutes",
    300: "five minutes",
    600: "ten minutes",
  };

  // set each of these
  var announce = function(msg){};
  var roundStartFunc = function(){};
  var roundEndFunc = function(){};

  this.setAnnounceFunc = function(f){
    announce = f;
  }

  this.onRoundStart = function(f){
    roundStartFunc = f;
  }

  this.onRoundEnd = function(f){
    roundEndFunc = f;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  var roundStartTime = false;
  var roundEndTime = false;
  var paused = false;

  var lastAnnouncedTime = 60 * 60 * 24 * 365; // arbitrary long time ago

  this.begin = async function(){
    if(!roundStartTime && !roundEndTime){
      // first initialization. Begin in pre-round phase.
      roundEndTime = Math.floor( Date.now() / 1000 );
    }

    paused = false;
    while(!paused){
      let now = Math.floor( Date.now() / 1000 );

      if(roundEndTime){
        // in pre-round phase

        let remaining = beforeRoundDuration - (now - roundEndTime);
        if(remaining < lastAnnouncedTime && timeText[remaining]){
          announce("round begins in " + timeText[remaining]);
          lastAnnouncedTime = remaining;
        }

        if(now - roundEndTime > beforeRoundDuration){
          // begin round
          roundEndTime = false;
          roundStartTime = now;
          lastAnnouncedTime = roundDuration + 100;
          roundStartFunc();
          announce("round has begun!");
        }

      }else if(roundStartTime){
        // in round

        let remaining = roundDuration - (now - roundStartTime);
        if(remaining < lastAnnouncedTime && timeText[remaining]){
          announce(timeText[remaining] + " remaining");
          lastAnnouncedTime = remaining;
        }

        if(now - roundStartTime > roundDuration){
          // end round
          roundStartTime = false;
          roundEndTime = now;
          lastAnnouncedTime = beforeRoundDuration + 100;
          announce("round is over!");
          roundEndFunc();
        }


      }else{
        console.error("round state is compromised! Pausing RoundManager.");
        this.pause();
      }

      await sleep(10);
    }
  }

  this.pause = function(){
    paused = true;
  }
  
};

RoundManager.prototype.constructor = RoundManager;


export { RoundManager };