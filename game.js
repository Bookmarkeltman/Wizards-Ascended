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

// Version
const GAME_VERSION = "v1.6.1";

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

// ==== Data Save/Load ====
function saveGame() {
  const data = {
    power,
    basePowerPerClick,
    ascensions,
    ascensionBonus,
    upgrades: upgrades.map(u => ({level: u.level, cost: u.cost})),
    totalPower,
    powerPerSecond,
    unlockedTitles,
    currentTitle,
    equippedTitle,
    version: GAME_VERSION
  };
  localStorage.setItem('wizardAscensionSave', JSON.stringify(data));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem('wizardAscensionSave'));
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
  localStorage.removeItem('wizardAscensionSave');
  // Don't reload, just re-init everything and show menu
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

// ==== TITLE LOGIC ====
function updateTitleUnlocks() {
  unlockedTitles = [];
  for (const t of TITLES) {
    if (ascensions >= t.rebirths) unlockedTitles.push(t.name);
  }
  // If previously selected/equipped title is no longer unlocked, reset
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

  // Button listeners
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
function updatePower() {
  const titleBonus = getEquippedTitleBonus();
  powerPerClick = basePowerPerClick + ascensionBonus + titleBonus.ppc;
  document.getElementById('power').textContent = "Power: " + Math.floor(power);
  document.getElementById('pps').textContent = "Power per second: " + Math.floor(powerPerSecond + titleBonus.pps);
  document.getElementById('bonus').textContent = ascensions > 0
    ? `Ascension Bonus: +${ascensionBonus} Power per click (from ${ascensions} Mystic Rebirth${ascensions > 1 ? 's' : ''})`
    : '';
  document.getElementById('open-rebirth-btn').disabled = power < 10000;
  if (document.getElementById('shop-overlay').classList.contains('active')) renderUpgrades();
  document.getElementById('rebirth-bonus-preview').textContent = "+" + ((ascensions + 1) * 5);
  renderTitleBar();
  document.getElementById('version-label').textContent = GAME_VERSION;
  if (document.getElementById('titles-overlay').classList.contains('active')) renderTitlesMenu();
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
        // Price scaling: double for x2/x3 upgrades, +50% for +amount upgrades
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

// ==== Events ====
function gameEvent() {
  saveGame();
  updatePower();
}

// Main menu logic
const mainMenu = document.getElementById('main-menu-overlay');
const continueBtn = document.getElementById('continue-btn');
const newGameBtn = document.getElementById('new-game-btn');
const mainMenuMusic = document.getElementById('main-menu-music');

function showMainMenu() {
  mainMenu.style.display = "flex";
  mainMenuMusic.currentTime = 0;
  mainMenuMusic.volume = 0.35;
  mainMenuMusic.play();
  document.body.style.overflow = "hidden";
}
function hideMainMenu() {
  mainMenu.style.display = "none";
  mainMenuMusic.pause();
  mainMenuMusic.currentTime = 0;
  document.body.style.overflow = "";
}
window.addEventListener('load', () => {
  const hasSave = !!localStorage.getItem('wizardAscensionSave');
  continueBtn.style.display = hasSave ? "block" : "none";
  showMainMenu();
});
continueBtn.onclick = () => {
  hideMainMenu();
};
newGameBtn.onclick = () => {
  resetGameData();
  hideMainMenu();
};

// Lightning effect logic (main canvas)
const mainLightningCanvas = document.getElementById('main-lightning-canvas');
function resizeMainLightningCanvas() {
  mainLightningCanvas.width = window.innerWidth;
  mainLightningCanvas.height = Math.max(80, Math.round(window.innerHeight * 0.18));
}
resizeMainLightningCanvas();
window.addEventListener('resize', resizeMainLightningCanvas);

function drawMainLightning() {
  const lc = mainLightningCanvas.getContext('2d');
  lc.clearRect(0, 0, mainLightningCanvas.width, mainLightningCanvas.height);

  const startX = Math.floor(mainLightningCanvas.width/2);
  const startY = 0;
  const endX = startX + (Math.random()-0.5)*mainLightningCanvas.width/2;
  const endY = mainLightningCanvas.height-10 + Math.random()*8;
  let points = [{x: startX, y: startY}];

  let steps = 30;
  for (let i = 1; i <= steps; ++i) {
    let t = i/steps;
    let nx = startX + (endX-startX)*t + (Math.random()-0.5)*mainLightningCanvas.width/13;
    let ny = startY + (endY-startY)*t + (Math.random()-0.5)*20;
    points.push({x:nx,y:ny});
  }
  points.push({x:endX,y:endY});

  // Purple core
  lc.save();
  lc.globalAlpha = 1.0;
  lc.lineWidth = 7;
  lc.strokeStyle = "#a772ff";
  lc.beginPath();
  lc.moveTo(points[0].x, points[0].y);
  for(let p of points) lc.lineTo(p.x,p.y);
  lc.stroke();
  lc.restore();

  // White center
  lc.save();
  lc.globalAlpha = 0.7;
  lc.lineWidth = 3;
  lc.strokeStyle = "#fff";
  lc.beginPath();
  lc.moveTo(points[0].x, points[0].y);
  for(let p of points) lc.lineTo(p.x,p.y);
  lc.stroke();
  lc.restore();

  // Black branches
  for(let j=0;j<2+Math.floor(Math.random()*2);j++){
    let branchFrom = Math.floor(points.length*(0.3+Math.random()*0.4));
    let len = 3+Math.floor(Math.random()*4);
    let bx=points[branchFrom].x, by=points[branchFrom].y;
    lc.save();
    lc.globalAlpha = 0.3+Math.random()*0.3;
    lc.lineWidth = 3;
    lc.strokeStyle = "#0a0018";
    lc.beginPath();
    lc.moveTo(bx,by);
    let angle = Math.PI/2 + (Math.random()-0.5)*1.3;
    for(let k=1;k<=len;k++){
      bx+=Math.cos(angle)*(20+Math.random()*10);
      by+=Math.sin(angle)*(20+Math.random()*10);
      lc.lineTo(bx,by);
      angle+=(Math.random()-0.5)*0.8;
    }
    lc.stroke();
    lc.restore();
  }

  // Fade out
  let opacity = 1;
  function fade() {
    lc.globalCompositeOperation = "destination-out";
    lc.globalAlpha = 0.06;
    lc.fillRect(0,0,mainLightningCanvas.width,mainLightningCanvas.height);
    lc.globalCompositeOperation = "source-over";
    opacity -= 0.05;
    if(opacity>0){
      requestAnimationFrame(fade);
    } else {
      lc.clearRect(0,0,mainLightningCanvas.width,mainLightningCanvas.height);
    }
  }
  fade();
}

// Lightning for wizard canvas
const wizardBtn = document.getElementById('wizard-btn');
const wizardLightningCanvas = document.getElementById('wizard-lightning-canvas');
const wlc = wizardLightningCanvas.getContext('2d');
const clickAudio = document.getElementById('click-audio');
function drawWizardLightning() {
  wlc.clearRect(0, 0, wizardLightningCanvas.width, wizardLightningCanvas.height);
  const startX = Math.floor(wizardLightningCanvas.width/2);
  const startY = 0;
  const endX = startX + (Math.random()-0.5)*60;
  const endY = wizardLightningCanvas.height-10 + Math.random()*6;
  let points = [{x: startX, y: startY}];

  let steps = 20 + Math.floor(Math.random() * 7);
  for (let i = 1; i <= steps; ++i) {
    let t = i / steps;
    let nx = startX + (endX - startX) * t + (Math.random() - 0.5) * 36;
    let ny = startY + (endY - startY) * t + (Math.random() - 0.5) * 18;
    points.push({x: nx, y: ny});
  }
  points.push({x: endX, y: endY});

  // Main purple lightning
  wlc.save();
  wlc.globalAlpha = 1.0;
  wlc.lineWidth = 5;
  wlc.strokeStyle = "#a772ff";
  wlc.beginPath();
  wlc.moveTo(points[0].x, points[0].y);
  for (let p of points) wlc.lineTo(p.x, p.y);
  wlc.stroke();
  wlc.restore();

  // Inner white lightning
  wlc.save();
  wlc.globalAlpha = 0.8;
  wlc.lineWidth = 2;
  wlc.strokeStyle = "#fff";
  wlc.beginPath();
  wlc.moveTo(points[0].x, points[0].y);
  for (let p of points) wlc.lineTo(p.x, p.y);
  wlc.stroke();
  wlc.restore();

  // Black shadow branches
  for (let j = 0; j < 2 + Math.floor(Math.random()*2); j++) {
    let branchFrom = Math.floor(points.length * (0.3 + Math.random() * 0.4));
    let len = 3 + Math.floor(Math.random() * 4);
    let bx = points[branchFrom].x, by = points[branchFrom].y;
    wlc.save();
    wlc.globalAlpha = 0.4 + Math.random() * 0.2;
    wlc.lineWidth = 2.5;
    wlc.strokeStyle = "#0a0018";
    wlc.beginPath();
    wlc.moveTo(bx, by);
    let angle = Math.PI/2 + (Math.random()-0.5)*1.3;
    for (let k = 1; k <= len; k++) {
      bx += Math.cos(angle) * (12 + Math.random() * 8);
      by += Math.sin(angle) * (12 + Math.random() * 8);
      wlc.lineTo(bx, by);
      angle += (Math.random()-0.5) * 0.8;
    }
    wlc.stroke();
    wlc.restore();
  }

  // Animate fade out
  let opacity = 1;
  function fade() {
    wlc.globalCompositeOperation = "destination-out";
    wlc.globalAlpha = 0.09;
    wlc.fillRect(0,0,wizardLightningCanvas.width,wizardLightningCanvas.height);
    wlc.globalCompositeOperation = "source-over";
    opacity -= 0.07;
    if (opacity > 0) {
      requestAnimationFrame(fade);
    } else {
      wlc.clearRect(0, 0, wizardLightningCanvas.width, wizardLightningCanvas.height);
    }
  }
  fade();
}

// Prevent double-tap zoom on iOS/Android
wizardBtn.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) return;
  e.preventDefault();
  wizardBtn.click();
}, {passive: false});

// Wizard click: shake, sound, lightning, power
wizardBtn.addEventListener('click', () => {
  const titleBonus = getEquippedTitleBonus();
  power += powerPerClick;
  totalPower += powerPerClick;
  drawWizardLightning();
  drawMainLightning();
  if (!wizardBtn.classList.contains('shake')) {
    wizardBtn.classList.add('shake');
    setTimeout(() => wizardBtn.classList.remove('shake'), 220);
  }
  if (clickAudio) {
    clickAudio.currentTime = 0;
    clickAudio.play();
  }
  gameEvent();
});

// PPS Ticker
setInterval(() => {
  const titleBonus = getEquippedTitleBonus();
  if (powerPerSecond + titleBonus.pps > 0) {
    power += (powerPerSecond + titleBonus.pps) / 10; // 10x/sec
    totalPower += (powerPerSecond + titleBonus.pps) / 10;
    gameEvent();
  }
}, 100);

// Shop menu
const shopOverlay = document.getElementById('shop-overlay');
const openShopBtn = document.getElementById('open-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');
openShopBtn.onclick = () => { shopOverlay.classList.add('active'); renderUpgrades(); };
closeShopBtn.onclick = () => { shopOverlay.classList.remove('active'); };
shopOverlay.onclick = function(e) { if (e.target === shopOverlay) shopOverlay.classList.remove('active'); };

// Titles menu
const titlesOverlay = document.getElementById('titles-overlay');
const openTitlesBtn = document.getElementById('open-titles-btn');
const closeTitlesBtn = document.getElementById('close-titles-btn');
openTitlesBtn.onclick = () => { titlesOverlay.classList.add('active'); renderTitlesMenu(); };
closeTitlesBtn.onclick = () => { titlesOverlay.classList.remove('active'); };
titlesOverlay.onclick = function(e) { if (e.target === titlesOverlay) titlesOverlay.classList.remove('active'); };

// Rebirth menu
const rebirthOverlay = document.getElementById('rebirth-overlay');
const openRebirthBtn = document.getElementById('open-rebirth-btn');
const closeRebirthBtn = document.getElementById('close-rebirth-btn');
const confirmRebirthBtn = document.getElementById('confirm-rebirth-btn');
const cancelRebirthBtn = document.getElementById('cancel-rebirth-btn');
openRebirthBtn.onclick = () => { rebirthOverlay.classList.add('active'); };
closeRebirthBtn.onclick = () => { rebirthOverlay.classList.remove('active'); };
cancelRebirthBtn.onclick = () => { rebirthOverlay.classList.remove('active'); };
rebirthOverlay.onclick = function(e) { if (e.target === rebirthOverlay) rebirthOverlay.classList.remove('active'); };
confirmRebirthBtn.onclick = function() {
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

// Reset Data
document.getElementById('reset-data-btn').onclick = resetGameData;

// Save when window/tab closes
window.addEventListener('beforeunload', saveGame);

// ==== Initial Load ====
loadGame();
updateTitleUnlocks();
updatePower();
