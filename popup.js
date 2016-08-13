// chrome.browserAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON
//   delete console.log
//   chrome.tabs.executeScript(tab.id, {
//       "file": "popup.js"
//   }, function () { // Execute your code
//       console.log("Script Executed .. "); // Notification on Completion
//   });
// });
document.addEventListener("DOMContentLoaded", function () {
  delete console.log
  poops();
});

function poops() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('poopsing')
    console.log(tabs)
    chrome.tabs.sendMessage(tabs[0].id, {action: "request_weapon_data"}, function(response) {
      console.log(response);
    });
  });
}

// function poopser() {
//   console.log('poopsering')
//   chrome.runtime.sendMessage({action: "request_weapon_data"}, function(response) {
//     console.log(response);
//   });
// }

function handleResponse(response) {
  if (response.action == 'update_status') {
    renderStatus(response.body)
  }
}

function renderStatus(statusText) {
  document.getElementById('ssstatus').textContent = statusText;
}

function handleRequest(request, sender, sendResponse) {
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension"
  );
  if (request.action == 'populate_weapon_data') {
    console.log(request.body)
  }
}
chrome.runtime.onMessage.addListener(handleRequest);

