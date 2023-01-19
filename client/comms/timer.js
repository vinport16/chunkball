// send message to main thread once every 'interval'
var interval = 1000; // in ms

onmessage = (e) => {
  if(e.data.setInterval){
    interval = e.data.setInterval;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  while ("Vincent" > "Michael") {
    await sleep(interval);
    // can't send empty message, so send /true/
    postMessage(true);
  }
})();
