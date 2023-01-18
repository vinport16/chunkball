/*
Chat controlls player chat UI. Needs specific HTML elements present on page:

<table id="chat" style="visibility: hidden;">
  <tr><td style="visibility: hidden;">text</td></tr>
  ... as many trs as you want visible messages ...
  <tr><td style="visibility: hidden;">text</td></tr>
  <tr><td style="visibility: hidden;">text</td></tr>
  <tr><td><input id="chat-input" type="text"></input></td></tr>
</table>
*/
var Chat = function(conn){
  
  var chat = document.getElementById("chat");
  var slots = chat.children[0].children;
  var input = document.getElementById("chat-input");
  var usernameInput = document.getElementById('userName');

  var messages = [
    {from:"server", text:"HELLO! hi!"},
    {from:"bobby", text:"this message is more recent"}
  ];

  function displayText(message){
    return message.from + ": " + message.text;
  }

  function createMessageElement(message){
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    tr.appendChild(td);
    let text = document.createTextNode(displayText(message));
    td.appendChild(text);
    return tr;
  }

  function pushMessage(message){
    let return_focus = false;
    messages.push(message);
    let m_input = slots[slots.length-1];
    if(document.activeElement == input){
      return_focus = true;
    }
    let currentValue = input.value;
    m_input.remove();
    slots[0].remove();
    let newMessage = createMessageElement(message);
    chat.children[0].appendChild(newMessage);
    newMessage.style.visibility = "visible";
    setTimeout(function(){newMessage.style.visibility = "inherit";}, 5000);
    chat.children[0].appendChild(m_input);
    input.value = currentValue;
    if(return_focus){
      input.focus();
    }
  }

  function showMessageLog(){
    chat.style.visibility = "visible";
  }

  function hideMessageLog(){
    chat.style.visibility = "hidden";
  }

  function messageOnT(event){
    if(event.key == 't'){
      showMessageLog();
      input.focus();
      setTimeout(function(){input.value = ''}, 5);
    }
  }

  function sendOnEnter(event){
    if(event.key == 'Enter'){
      conn.send({message:input.value});
      input.value = '';
      hideMessageLog();
      document.children[0].focus();
    }else if(event.key == "Escape"){
      // this doesn't work well... TODO issue #35
      hideMessageLog();
      document.children[0].focus();
    }
    event.stopPropagation();
  }

  conn.on("data", function(data){
    if(data.message){
      pushMessage(data.message);
    }
  });

  document.addEventListener('keydown', messageOnT, false);
  input.addEventListener('keydown', sendOnEnter, false);

};

Chat.prototype.constructor = Chat;


export { Chat };