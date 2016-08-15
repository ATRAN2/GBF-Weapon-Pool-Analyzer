document.addEventListener("DOMContentLoaded", function () {
  requestWeaponData();
});

function requestWeaponData() {
  chrome.runtime.sendMessage({action: "request_weapon_data"}, function(response) {
    renderStatus(response);
  });
}

function handleResponse(response) {
  if (response.action == 'update_status') {
    renderStatus(response)
  }
}

function renderStatus(statusResponse) {
  document.getElementById('status').textContent = statusResponse.body;
}

function handleRequest(request, sender, sendResponse) {
  if (request.action == 'populate_weapon_data') {
    document.getElementById('weapon-pool').textContent = request.body
  }
}
chrome.runtime.onMessage.addListener(handleRequest);


