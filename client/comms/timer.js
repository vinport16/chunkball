// send message to main thread once every 'interval'
var interval = 1000; // in ms

onmessage = (e) => {
  console.log('Message received from main script: ', e.data);
  if(e.data.setInterval){
    interval = e.data.setInterval;
    console.log('updated wait time to '+interval);
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
