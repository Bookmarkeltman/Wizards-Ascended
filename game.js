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

// Version
const GAME_VERSION = "v1.5.0";

// Title milestones
const TITLES = [
  { rebirths: 0,   name: "Novice" },
  { rebirths: 1,   name: "Apprentice" },
  { rebirths: 3,   name: "Adept" },
  { rebirths: 7,   name: "Sorcerer" },
  { rebirths: 15,  name: "Mage" },
  { rebirths: 30,  name: "Warlock" },
  { rebirths: 50,  name: "Archmage" },
  { rebirths: 100, name: "Ascended" }
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
  if (confirm("Are you sure you want to erase all your wizard progress?")) {
    localStorage.removeItem('wizardAscensionSave');
    location.reload();
  }
}

function updateTitleUnlocks() {
  // Unlock all titles up to current rebirths
  unlockedTitles = [];
  for (const t of TITLES) {
    if (ascensions >= t.rebirths) unlockedTitles.push(t.name);
  }
  // If previously selected title is no longer unlocked (rare), reset to highest unlocked
  if (!unlockedTitles.includes(currentTitle)) {
    currentTitle = unlockedTitles[unlockedTitles.length - 1] || "Novice";
  }
  renderTitleBar();
  saveGame();
}

function renderTitleBar() {
  const bar = document.getElementById('title-bar');
  let html = `Title: <span id="player-title">${currentTitle}</span>`;
  if (unlockedTitles.length > 1) {
    html += `<select id="title-select" style="margin-left:12px;font-family:inherit;font-size:1em;">`
    for (const t of unlockedTitles) {
      html += `<option value="${t}"${t === currentTitle ? " selected" : ""}>${t}</option>`;
    }
    html += `</select>`;
  }
  bar.innerHTML = html;
  const sel = document.getElementById("title-select");
  if (sel) {
    sel.onchange = function() {
      currentTitle = this.value;
      renderTitleBar();
      saveGame();
    };
  }
}

// ==== UI Logic ====
function updatePower() {
  powerPerClick = basePowerPerClick + ascensionBonus;
  document.getElementById('power').textContent = "Power: " + Math.floor(power);
  document.getElementById('pps').textContent = "Power per second: " + Math.floor(powerPerSecond);
  document.getElementById('bonus').textContent = ascensions > 0
    ? `Ascension Bonus: +${ascensionBonus} Power per click (from ${ascensions} Mystic Rebirth${ascensions > 1 ? 's' : ''})`
    : '';
  document.getElementById('open-rebirth-btn').disabled = power < 10000;
  if (document.getElementById('shop-overlay').classList.contains('active')) renderUpgrades();
  document.getElementById('rebirth-bonus-preview').textContent = "+" + ((ascensions + 1) * 5);
  renderTitleBar();
  document.getElementById('version-label').textContent = GAME_VERSION;
}

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

// Lightning effect logic
const wizardBtn = document.getElementById('wizard-btn');
const lightningCanvas = document.getElementById('lightning-canvas');
const lc = lightningCanvas.getContext('2d');
const clickAudio = document.getElementById('click-audio');

function drawLightning() {
  lc.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);

  // Lightning always starts exactly at the top center
  const startX = Math.floor(lightningCanvas.width / 2);
  const startY = 0;
  const endX = startX + (Math.random() - 0.5) * 60;
  const endY = lightningCanvas.height - 10 + Math.random() * 6;
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
  lc.save();
  lc.globalAlpha = 1.0;
  lc.lineWidth = 5;
  lc.strokeStyle = "#a772ff";
  lc.beginPath();
  lc.moveTo(points[0].x, points[0].y);
  for (let p of points) lc.lineTo(p.x, p.y);
  lc.stroke();
  lc.restore();

  // Inner white lightning
  lc.save();
  lc.globalAlpha = 0.8;
  lc.lineWidth = 2;
  lc.strokeStyle = "#fff";
  lc.beginPath();
  lc.moveTo(points[0].x, points[0].y);
  for (let p of points) lc.lineTo(p.x, p.y);
  lc.stroke();
  lc.restore();

  // Black shadow branches
  for (let j = 0; j < 2 + Math.floor(Math.random()*2); j++) {
    let branchFrom = Math.floor(points.length * (0.3 + Math.random() * 0.4));
    let len = 3 + Math.floor(Math.random() * 4);
    let bx = points[branchFrom].x, by = points[branchFrom].y;
    lc.save();
    lc.globalAlpha = 0.4 + Math.random() * 0.2;
    lc.lineWidth = 2.5;
    lc.strokeStyle = "#0a0018";
    lc.beginPath();
    lc.moveTo(bx, by);
    let angle = Math.PI/2 + (Math.random()-0.5)*1.3;
    for (let k = 1; k <= len; k++) {
      bx += Math.cos(angle) * (12 + Math.random() * 8);
      by += Math.sin(angle) * (12 + Math.random() * 8);
      lc.lineTo(bx, by);
      angle += (Math.random()-0.5) * 0.8;
    }
    lc.stroke();
    lc.restore();
  }

  // Animate fade out
  let opacity = 1;
  function fade() {
    lc.globalCompositeOperation = "destination-out";
    lc.globalAlpha = 0.09;
    lc.fillRect(0,0,lightningCanvas.width,lightningCanvas.height);
    lc.globalCompositeOperation = "source-over";
    opacity -= 0.07;
    if (opacity > 0) {
      requestAnimationFrame(fade);
    } else {
      lc.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
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
  power += powerPerClick;
  totalPower += powerPerClick;
  drawLightning();
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
  if (powerPerSecond > 0) {
    power += powerPerSecond / 10; // 10 times per second for smoother gain
    totalPower += powerPerSecond / 10;
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
