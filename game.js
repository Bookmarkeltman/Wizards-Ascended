// Wizards Ascension Custom - Anti-Cheat, Admin/Unban, Events, Shop/Rebirth/UI
// v2.0.3 - Fully compatible with new HTML/CSS structure

const GAME_VERSION = "v2.0.3";
const ADMIN_CODE = "12182009";

// ==== Unique User ID & Admin Handling ====
function getUserId() {
  let uid = localStorage.getItem("userId");
  if (!uid) {
    uid = Array(16).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    localStorage.setItem("userId", uid);
  }
  return uid;
}
function getAdminIds() {
  try {
    return JSON.parse(localStorage.getItem("adminIds") || "[]");
  } catch {
    return [];
  }
}
function addAdminId(id) {
  const admins = getAdminIds();
  if (!admins.includes(id)) {
    admins.push(id);
    localStorage.setItem("adminIds", JSON.stringify(admins));
  }
}
function isAdmin() {
  const uid = getUserId();
  return getAdminIds().includes(uid) || localStorage.getItem("isAdmin") === "1";
}

// ==== Ban System ====
function isBanned() {
  return localStorage.getItem("banned") === "1";
}
function banUser() {
  if (isAdmin()) return;
  // Remove all overlays and inject the ban overlay
  document.body.innerHTML = '';
  const banDiv = document.createElement("div");
  banDiv.className = "ban-overlay";
  banDiv.innerHTML = `
    <div class="ban-message">
      <h1>Banned for Cheating</h1>
      <p>
        You have been banned for attempting to cheat or manipulate the game.<br>
        If you believe this is a mistake, contact the developer.<br>
        Your User ID: <span id="ban-userid">${getUserId()}</span>
      </p>
      <input id="ban-code-input" placeholder="Enter code to unban..." style="margin-top:20px;font-size:1.1em;width:80%;padding:8px;">
      <button id="ban-code-btn" style="margin-top:10px;padding:8px 18px;font-size:1em;">Submit</button>
      <div id="ban-code-msg" style="margin-top:10px;color:#fffa7c;font-size:1em;"></div>
    </div>`;
  document.body.appendChild(banDiv);

  document.getElementById('ban-code-btn').onclick = function() {
    const input = document.getElementById('ban-code-input').value.trim();
    const msgDiv = document.getElementById('ban-code-msg');
    if (input === ADMIN_CODE) {
      localStorage.removeItem("banned");
      localStorage.setItem("isAdmin", "1");
      addAdminId(getUserId());
      msgDiv.textContent = "Unbanned! You are now an admin. Reloading...";
      setTimeout(() => location.reload(), 1000);
    } else {
      msgDiv.textContent = "Incorrect code.";
    }
  };
  throw new Error("Banned");
}
if (isBanned()) { banUser(); }

// ==== Game State ====
let power = 0;
let basePowerPerClick = 1;
let powerPerClick = 1;
let ascensions = 0;
let ascensionBonus = 0;
let totalPower = 0;
let powerPerSecond = 0;
let unlockedTitles = [];
let currentTitle = "Novice";
let equippedTitle = null;
let eventsActive = [];
let lastSave = null;
let lastPPC = null, lastPPS = null;

// Title milestones and bonuses
const TITLES = [
  { rebirths: 0,   name: "Novice",    ppc: 0,  pps: 0 },
  { rebirths: 1,   name: "Apprentice",ppc: 1,  pps: 1 },
  { rebirths: 3,   name: "Adept",     ppc: 2,  pps: 3 },
  { rebirths: 7,   name: "Sorcerer",  ppc: 5,  pps: 7 },
  { rebirths: 15,  name: "Mage",      ppc: 10, pps: 12 },
  { rebirths: 30,  name: "Warlock",   ppc: 22, pps: 18 },
  { rebirths: 50,  name: "Archmage",  ppc: 40, pps: 30 },
  { rebirths: 100, name: "Ascended",  ppc: 100,pps: 70 }
];

// ==== Upgrades ====
const upgrades = [
  {
    name: "Staff Upgrade",
    desc: "Power per click +1",
    baseCost: 20,
    cost: 20,
    level: 0,
    type: "ppc",
    effect: () => { basePowerPerClick += 1; }
  },
  {
    name: "Magic Gloves",
    desc: "Power per click +5",
    baseCost: 120,
    cost: 120,
    level: 0,
    type: "ppc",
    effect: () => { basePowerPerClick += 5; }
  },
  {
    name: "Arcane Tome",
    desc: "Power per click x2",
    baseCost: 500,
    cost: 500,
    level: 0,
    type: "ppc",
    effect: () => { basePowerPerClick *= 2; }
  },
  {
    name: "Crystal Ball",
    desc: "Power per click x3",
    baseCost: 2500,
    cost: 2500,
    level: 0,
    type: "ppc",
    effect: () => { basePowerPerClick *= 3; }
  },
  {
    name: "Apprentice",
    desc: "Power per second +1",
    baseCost: 100,
    cost: 100,
    level: 0,
    type: "pps",
    effect: () => { powerPerSecond += 1; }
  },
  {
    name: "Magic Cat",
    desc: "Power per second +5",
    baseCost: 400,
    cost: 400,
    level: 0,
    type: "pps",
    effect: () => { powerPerSecond += 5; }
  },
  {
    name: "Mana Fountain",
    desc: "Power per second +20",
    baseCost: 2000,
    cost: 2000,
    level: 0,
    type: "pps",
    effect: () => { powerPerSecond += 20; }
  },
  {
    name: "Time Amulet",
    desc: "Power per second x2",
    baseCost: 7000,
    cost: 7000,
    level: 0,
    type: "pps",
    effect: () => { powerPerSecond *= 2; }
  }
];

// ==== SAVE/LOAD ====
function saveGame() {
  const uid = getUserId();
  const data = {
    power, basePowerPerClick, ascensions, ascensionBonus,
    upgrades: upgrades.map(u => ({level: u.level, cost: u.cost})),
    totalPower, powerPerSecond,
    unlockedTitles, currentTitle, equippedTitle,
    version: GAME_VERSION, userId: uid
  };
  localStorage.setItem("wizardAscensionSave", JSON.stringify(data));
  lastSave = JSON.stringify(data);
}
function loadGame() {
  const data = JSON.parse(localStorage.getItem("wizardAscensionSave"));
  if (data) {
    power = data.power ?? 0;
    basePowerPerClick = data.basePowerPerClick ?? 1;
    ascensions = data.ascensions ?? 0;
    ascensionBonus = data.ascensionBonus ?? 0;
    totalPower = data.totalPower ?? 0;
    powerPerSecond = data.powerPerSecond ?? 0;
    unlockedTitles = data.unlockedTitles ?? [];
    currentTitle = data.currentTitle ?? "Novice";
    equippedTitle = data.equippedTitle ?? null;
    if (Array.isArray(data.upgrades)) {
      for (let i = 0; i < upgrades.length; i++) {
        const up = data.upgrades[i];
        if (up) {
          upgrades[i].level = up.level ?? 0;
          upgrades[i].cost = up.cost ?? upgrades[i].baseCost;
        }
      }
    }
  }
}

function resetGameData() {
  localStorage.removeItem("wizardAscensionSave");
  power = 0;
  basePowerPerClick = 1;
  powerPerClick = 1;
  ascensions = 0;
  ascensionBonus = 0;
  totalPower = 0;
  powerPerSecond = 0;
  unlockedTitles = [];
  currentTitle = "Novice";
  equippedTitle = null;
  for (const u of upgrades) {
    u.level = 0;
    u.cost = u.baseCost;
  }
  updateTitleUnlocks();
  updatePower();
  showMainMenu();
}

// ==== ANTI-CHEAT LOGIC ====
let cheatTimeout = null;
function cheatBan(reason) {
  if (isAdmin()) return;
  localStorage.setItem("banned", "1");
  banUser();
  throw new Error("Banned: " + reason);
}
function checkAntiCheat() {
  if (lastPPC !== null && lastPPS !== null) {
    if (Math.abs(powerPerClick - lastPPC) > 500 || Math.abs((powerPerSecond + getEquippedTitleBonus().pps) - lastPPS) > 1000) {
      cheatBan("Stat jump detected");
    }
  }
  lastPPC = powerPerClick;
  lastPPS = powerPerSecond + getEquippedTitleBonus().pps;

  const data = JSON.parse(localStorage.getItem("wizardAscensionSave"));
  if (data && data.userId && data.userId !== getUserId()) cheatBan("User ID mismatch");

  if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
    if (!cheatTimeout) {
      cheatTimeout = setTimeout(() => cheatBan("Inspector detected"), 1200);
    }
  } else {
    if (cheatTimeout) clearTimeout(cheatTimeout);
    cheatTimeout = null;
  }
}
setInterval(checkAntiCheat, 1300);

// ==== TITLE LOGIC ====
function updateTitleUnlocks() {
  unlockedTitles = [];
  for (const t of TITLES) {
    if (ascensions >= t.rebirths) unlockedTitles.push(t.name);
  }
  if (!unlockedTitles.includes(currentTitle)) {
    currentTitle = unlockedTitles[unlockedTitles.length - 1] || "Novice";
  }
  if (!unlockedTitles.includes(equippedTitle)) {
    equippedTitle = null;
  }
  renderTitleBar();
  saveGame();
}
function renderTitleBar() {
  const bar = document.getElementById('title-bar');
  let html = `Title: <span id="player-title">${equippedTitle || currentTitle}</span>`;
  bar.innerHTML = html;
}
function renderTitlesMenu() {
  const list = document.getElementById('titles-list');
  let html = "";
  for (const t of TITLES) {
    if (unlockedTitles.includes(t.name)) {
      const equipped = equippedTitle === t.name;
      html += `<div class="title-row${equipped ? " equipped" : ""}">
        <div><b>${t.name}</b>${equipped ? " (Equipped)" : ""}</div>
        <div class="bonus-line">Bonus: +${t.ppc} Power per click, +${t.pps} Power per second</div>
        <button class="equip-btn${equipped ? " unequip" : ""}" data-title="${t.name}">
          ${equipped ? "Unequip" : "Equip"}
        </button>
      </div>`;
    }
  }
  list.innerHTML = html;

  Array.from(list.querySelectorAll('.equip-btn')).forEach(btn => {
    btn.onclick = function() {
      const title = btn.getAttribute('data-title');
      if (equippedTitle === title) {
        equippedTitle = null;
      } else {
        equippedTitle = title;
      }
      renderTitlesMenu();
      gameEvent();
    };
  });
}

// ==== UI Logic ====
function getEquippedTitleBonus() {
  const t = TITLES.find(t => t.name === equippedTitle);
  return t ? {ppc: t.ppc, pps: t.pps} : {ppc: 0, pps: 0};
}
function getEventMultipliers() {
  let mulPPC = 1, mulPPS = 1;
  for (const e of eventsActive) {
    mulPPC *= e.ppc || 1;
    mulPPS *= e.pps || 1;
  }
  return {mulPPC, mulPPS};
}
function updatePower() {
  const titleBonus = getEquippedTitleBonus();
  const {mulPPC, mulPPS} = getEventMultipliers ? getEventMultipliers() : {mulPPC: 1, mulPPS: 1};
  powerPerClick = Math.floor((basePowerPerClick + ascensionBonus + titleBonus.ppc) * mulPPC);
  document.getElementById('power').textContent = "Power: " + Math.floor(power);
  document.getElementById('pps').textContent = "Power per second: " +
    Math.floor((powerPerSecond + titleBonus.pps) * mulPPS);
  document.getElementById('bonus').textContent = ascensions > 0
    ? `Ascension Bonus: +${ascensionBonus} Power per click (from ${ascensions} Mystic Rebirth${ascensions > 1 ? 's' : ''})`
    : '';
  document.getElementById('version-label').textContent = GAME_VERSION;
  if (document.getElementById('shop-overlay').classList.contains('active')) renderUpgrades();
  if (document.getElementById('rebirth-bonus-preview'))
    document.getElementById('rebirth-bonus-preview').textContent = "+" + ((ascensions + 1) * 5);
  if (document.getElementById('titles-overlay') && document.getElementById('titles-overlay').classList.contains('active')) renderTitlesMenu();
  if (typeof renderEventBanner === "function") renderEventBanner();
}

// Shop upgrade rendering
function renderUpgrades() {
  let html = "";
  for (let i = 0; i < upgrades.length; i++) {
    const u = upgrades[i];
    html += `<button class="upgrade-btn" id="upgrade-${i}" ${power < u.cost ? 'disabled' : ''}>
      ${u.name} (${u.cost} Power) [Bought: ${u.level}]<br>
      <span style="font-size:.93em;color:#ffeedd99;">${u.desc}</span>
    </button>`;
  }
  document.getElementById('upgrades').innerHTML = html;
  for (let i = 0; i < upgrades.length; i++) {
    if (power >= upgrades[i].cost) {
      document.getElementById(`upgrade-${i}`).onclick = function() {
        power -= upgrades[i].cost;
        upgrades[i].level += 1;
        upgrades[i].effect();
        if (upgrades[i].desc.includes("x2") || upgrades[i].desc.includes("x3")) {
          upgrades[i].cost = Math.floor(upgrades[i].cost * 2.5);
        } else {
          upgrades[i].cost = Math.floor(upgrades[i].cost * 1.5 + 5);
        }
        gameEvent();
        renderUpgrades();
      }
    }
  }
}

// ==== EVENTS SYSTEM ====
const EVENT_TYPES = [
  { name: "Wizard's Inspiration", ppc: 2, pps: 1, duration: 60, rarity: "common" },
  { name: "Mana Storm", ppc: 1, pps: 2, duration: 60, rarity: "common" },
  { name: "Mystic Surge", ppc: 3, pps: 3, duration: 30, rarity: "rare" },
  { name: "Arcane Festival", ppc: 5, pps: 5, duration: 20, rarity: "epic" }
];
function startEventLoop() {
  setTimeout(rollEvent, 5000 + Math.random() * 7000);
}
function rollEvent() {
  let event;
  let rand = Math.random();
  if (rand < 0.65) {
    event = EVENT_TYPES.filter(e => e.rarity === "common")[Math.floor(Math.random() * 2)];
  } else if (rand < 0.92) {
    event = EVENT_TYPES.filter(e => e.rarity === "rare")[0];
  } else {
    event = EVENT_TYPES.filter(e => e.rarity === "epic")[0];
  }
  let rarityMulti = event.rarity === "epic" ? 25 : event.rarity === "rare" ? 5 : 1;
  let eventObj = {
    name: event.name + (event.rarity !== "common" ? ` (${event.rarity.toUpperCase()}!)` : ""),
    ppc: (event.ppc || 1) * rarityMulti,
    pps: (event.pps || 1) * rarityMulti,
    expires: Date.now() + event.duration * 1000
  };
  eventsActive.push(eventObj);
  setTimeout(() => {
    eventsActive = eventsActive.filter(e => e !== eventObj);
    renderEventBanner();
  }, event.duration * 1000);
  renderEventBanner();
  setTimeout(rollEvent, 20000 + Math.random() * 18000);
}
function renderEventBanner() {
  let text = "";
  if (eventsActive.length > 0) {
    let e = eventsActive[eventsActive.length - 1];
    text = `${e.name}: +${e.ppc}x PPC, +${e.pps}x PPS (${Math.ceil((e.expires - Date.now()) / 1000)}s)`;
  }
  document.getElementById('event-banner').textContent = text;
}

// ==== Events ====
function gameEvent() {
  saveGame();
  updatePower();
}

// ==== Main Menu Logic ====
const mainMenu = document.getElementById('main-menu-overlay');
const continueBtn = document.getElementById('continue-btn');
const newGameBtn = document.getElementById('new-game-btn');
const mainMenuMusic = document.getElementById('main-menu-music');
const mainMenuUid = document.getElementById('main-menu-uid');

function showMainMenu() {
  mainMenu.style.display = "flex";
  mainMenuMusic.currentTime = 0;
  mainMenuMusic.volume = 0.35;
  mainMenuMusic.play();
  document.body.style.overflow = "hidden";
  if (mainMenuUid)
    mainMenuUid.textContent = "Your User ID: " + getUserId();
}
function hideMainMenu() {
  mainMenu.style.display = "none";
  mainMenuMusic.pause();
  mainMenuMusic.currentTime = 0;
  document.body.style.overflow = "";
}
window.addEventListener('load', () => {
  const hasSave = !!localStorage.getItem("wizardAscensionSave");
  continueBtn.style.display = hasSave ? "block" : "none";
  showMainMenu();
});
continueBtn.onclick = () => { hideMainMenu(); };
newGameBtn.onclick = () => { resetGameData(); hideMainMenu(); };

// Shop menu logic
const shopOverlay = document.getElementById('shop-overlay');
document.getElementById('open-shop-btn').onclick = () => {
  shopOverlay.classList.add('active');
  renderUpgrades();
};
document.getElementById('close-shop-btn').onclick = () => shopOverlay.classList.remove('active');
shopOverlay.onclick = function(e) { if (e.target === shopOverlay) shopOverlay.classList.remove('active'); };

// Titles menu logic
const titlesOverlay = document.getElementById('titles-overlay');
document.getElementById('open-titles-btn').onclick = () => {
  titlesOverlay.classList.add('active');
  renderTitlesMenu();
};
document.getElementById('close-titles-btn').onclick = () => titlesOverlay.classList.remove('active');
titlesOverlay.onclick = function(e) { if (e.target === titlesOverlay) titlesOverlay.classList.remove('active'); };

// Rebirth menu logic
const rebirthOverlay = document.getElementById('rebirth-overlay');
document.getElementById('open-rebirth-btn').onclick = () => {
  rebirthOverlay.classList.add('active');
  updateRebirthMenu();
};
document.getElementById('close-rebirth-btn').onclick = () => rebirthOverlay.classList.remove('active');
document.getElementById('cancel-rebirth-btn').onclick = () => rebirthOverlay.classList.remove('active');
rebirthOverlay.onclick = function(e) { if (e.target === rebirthOverlay) rebirthOverlay.classList.remove('active'); };
document.getElementById('confirm-rebirth-btn').onclick = function() {
  if (power >= 10000) {
    ascensions += 1;
    ascensionBonus = ascensions * 5;
    power = 0;
    basePowerPerClick = 1;
    powerPerSecond = 0;
    for (const u of upgrades) {
      u.level = 0;
      u.cost = u.baseCost;
    }
    updateTitleUnlocks();
    rebirthOverlay.classList.remove('active');
    gameEvent();
    setTimeout(() => {
      alert(`You have performed a Mystic Rebirth!\nPermanent bonus: +${ascensionBonus} Power per click.`);
    }, 250);
  }
};

function updateRebirthMenu() {
  const locked = power < 10000;
  if (document.getElementById('rebirth-locked'))
    document.getElementById('rebirth-locked').style.display = locked ? "flex" : "none";
  if (document.getElementById('rebirth-desc'))
    document.getElementById('rebirth-desc').style.display = locked ? "none" : "block";
  if (document.getElementById('confirm-rebirth-btn'))
    document.getElementById('confirm-rebirth-btn').style.display = locked ? "none" : "inline-block";
  if (document.getElementById('rebirth-power-current'))
    document.getElementById('rebirth-power-current').textContent = Math.floor(power);

  if (locked && document.getElementById('rebirth-progress-bar') && document.getElementById('rebirth-locked-num')) {
    let need = 10000;
    let progress = Math.min(power / need, 1);
    document.getElementById('rebirth-progress-bar').style.width = (progress * 100) + "%";
    document.getElementById('rebirth-locked-num').textContent = `${Math.floor(power)} / ${need}`;
  }
}

// Reset Data
document.getElementById('reset-data-btn').onclick = resetGameData;

// PPS Ticker
setInterval(() => {
  const titleBonus = getEquippedTitleBonus();
  const {mulPPS} = getEventMultipliers ? getEventMultipliers() : {mulPPS: 1};
  if ((powerPerSecond + titleBonus.pps) * mulPPS > 0) {
    power += ((powerPerSecond + titleBonus.pps) * mulPPS) / 10; // 10x/sec
    totalPower += ((powerPerSecond + titleBonus.pps) * mulPPS) / 10;
    gameEvent();
  }
}, 100);

// Wizard button
const wizardBtn = document.getElementById('wizard-btn');
wizardBtn.onclick = () => {
  const titleBonus = getEquippedTitleBonus();
  const {mulPPC} = getEventMultipliers ? getEventMultipliers() : {mulPPC: 1};
  power += powerPerClick;
  totalPower += powerPerClick;
  if (!wizardBtn.classList.contains('shake')) {
    wizardBtn.classList.add('shake');
    setTimeout(() => wizardBtn.classList.remove('shake'), 220);
  }
  gameEvent();
};

// ==== Initial Load ====
loadGame();
updateTitleUnlocks();
updatePower();
startEventLoop();
