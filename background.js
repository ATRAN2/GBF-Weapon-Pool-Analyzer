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

function requestWeaponData() {
  console.log('prerequest')
  getUidVersion().then(
    getPlayerDeck
  ).then(
    getWeaponPool
  ).then(
    function(result) {
      console.log(JSON.stringify(result))
      populateWeaponData(JSON.stringify(result))
    }
  );
  var status_response = {
    action: 'update_status',
    body: 'Getting Weapon Data...',
  }
  console.log('postrequest' + status_response.body) 
  return status_response
}

function populateWeaponData(weaponData) {
  chrome.runtime.sendMessage({action: "populate_weapon_data", body: weaponData}, null);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var response = {
      action: 'update_status',
      body: 'The message sent to the background did not correspond to any command',
    }
    if (request.action == "request_weapon_data")
      response = requestWeaponData()
    sendResponse(response);
});
