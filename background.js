localization = englishLocalization;

function getPlayerDeckRequest(uid, version) {
  var currentTime = (new Date).getTime().toString();
  var playerDeckUrl = `http://game.granbluefantasy.jp/party/deck?_=${currentTime}&t=${currentTime}&uid=${uid}`;

  var request = new Request(
    playerDeckUrl,
    {
      credentials: 'include',
      headers: new Headers({
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'X-VERSION': version,
      }),
    }
  );
  return request
}

function getGameHomeRequest() {
  var gameHomeUrl = 'http://game.granbluefantasy.jp'
  var request = new Request(
    gameHomeUrl,
    {
      credentials: 'include',
      headers: new Headers({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'max-age=0',
        'Referrer': gameHomeUrl,
        'Upgrade-Insecure-Requests': '1',
      }),
    }
  );
  return request
}

function extractUidFromGameHomeResponse(responseText) {
  var UidRegExp = new RegExp("Game\.userId = (\\d+);");
  var uid = UidRegExp.exec(responseText)[1];
  return uid
}

function extractVersionFromGameHomeResponse(responseText){
  var gameVersionRegExp = new RegExp("Game\.version = \"(\\d+)\";");
  var version = gameVersionRegExp.exec(responseText)[1];
  return version
}

function getUidVersion() {
  var gameHomeRequest = getGameHomeRequest();
  return fetch(gameHomeRequest).then(
      function(response) {
        return response.text()
      }
    ).then(
      function(responseText) {
        var uid = extractUidFromGameHomeResponse(responseText);
        var version = extractVersionFromGameHomeResponse(responseText);
        var uidVersion = {'uid': uid, 'version': version};
        return uidVersion
      }
    );
}

function getPlayerDeck(uidVersion) {
  var playerDeckRequest = getPlayerDeckRequest(uidVersion.uid, uidVersion.version)
  return fetch(playerDeckRequest).then(
    function(response) {
      return response.json()
    }
  ).then(
    function(responseJson) {
      return responseJson
    }
  );
}


function Weapon(slot, id, level, attribute, hp, attack, skillLevel, firstSkill, secondSkill) {
  this.slot = slot;
  this.id = id;
  this.level = level;
  this.attribute = attribute;
  this.hp = hp;
  this.attack = attack;
  this.skillLevel = skillLevel;
  this.firstSkill = firstSkill;
  this.secondSkill = secondSkill;
}

function Skill(attribute, tier, type) {
  this.attribute = attribute;
  this.tier = tier;
  this.type = type;
}

function getSkillsFromRawWeapon(rawWeapon) {
  var skills = [];
  skills.push(getSkill(rawWeapon.skill1));
  skills.push(getSkill(rawWeapon.skill2));
  console.log(skills)
  return skills
}

function getSkill(skillData) {
  if (!skillData) {
      return null
  }
  var skillParams = skillData.image.split('_');
  var tier, type;
  if (skillParams.length == 5) {
    tier = skillParams[4];
    type = skillParams[2];
  } else {
    tier = skillParams[3];
    type = null;
  }
  var skill = new Skill(
    skillData.attribute,
    tier,
    type
  );
  return skill
}

function getWeaponPool(playerDeck){
  var rawWeaponsData = playerDeck.deck.pc.weapons;
  console.log(rawWeaponsData)
  var weaponPool = [];
  for (weaponSlot in rawWeaponsData) {
    var rawWeapon = rawWeaponsData[weaponSlot];
    var firstSkill, secondSkill
    [firstSkill, secondSkill] = getSkillsFromRawWeapon(rawWeapon);
    var weapon = new Weapon(
      weaponSlot,
      rawWeapon.param.id,
      rawWeapon.param.level,
      rawWeapon.master.attribute,
      rawWeapon.param.hp,
      rawWeapon.param.attack,
      rawWeapon.param.skill_level,
      firstSkill,
      secondSkill
    )
    weaponPool.push(weapon)
  }
  return weaponPool
}

function renderStatus(statusText) {
  document.getElementById('ssstatus').textContent = statusText;
}

function requestWeaponData() {
  console.log('prerequest')
  getUidVersion().then(
    getPlayerDeck
  ).then(
    getWeaponPool
  ).then(
    function(result) {
      renderStatus(JSON.stringify(result))
    }
  );
  status_response = {
    action: 'status_update',
    body: 'Getting Weapon Data...',
  }
  console.log('postrequest' + status_response.toString()) 
  return status_response
}

// function handleRequest(request, sender, sendResponse) {
//   console.log('handling request')
//   console.log(sender.tab ?
//     "from a content script:" + sender.tab.url :
//     "from the extension"
//   );
//   if (request.action == 'request_weapon_data') {
//     response = getWeaponData();
//   }
//   sendResponse(response);
// }
// chrome.runtime.onMessage.addListener(handleRequest);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
  });

// getWeaponData('taser', function(response) {
//   console.log(response)
// }, function(error_string) {
//   console.log(error_string)
// });
//  getCurrentTabUrl(function(url) {
//    // Put the image URL in Google search.
//    renderStatus('Performing Google Image search for ' + url);
//
//    getImageUrl(url, function(imageUrl, width, height) {
//
//      renderStatus('Search term: ' + url + '\n' +
//          'Google image search result: ' + imageUrl);
//      var imageResult = document.getElementById('image-result');
//      // Explicitly set the width/height to minimize the number of reflows. For
//      // a single image, this does not matter, but if you're going to embed
//      // multiple external images in your page, then the absence of width/height
//      // attributes causes the popup to resize multiple times.
//      imageResult.width = width;
//      imageResult.height = height;
//      imageResult.src = imageUrl;
//      imageResult.hidden = false;
//
//    }, function(errorMessage) {
//      renderStatus('Cannot display image. ' + errorMessage);
//    });
