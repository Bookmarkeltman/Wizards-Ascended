// ==== Game State ====
let power = 0;
let basePowerPerClick = 1;
let powerPerClick = 1;
let ascensions = 0;
let ascensionBonus = 0;
let totalPower = 0;

const upgrades = [
  {
    name: "Enchanted Staff",
    desc: "Doubles your power per click.",
    cost: 50,
    bought: false,
    effect: () => { basePowerPerClick *= 2; }
  },
  {
    name: "Apprentice Familiar",
    desc: "Each click gains +5 Power.",
    cost: 250,
    bought: false,
    effect: () => { basePowerPerClick += 5; }
  },
  {
    name: "Arcane Tome",
    desc: "Each click gains +15 Power.",
    cost: 1000,
    bought: false,
    effect: () => { basePowerPerClick += 15; }
  },
  {
    name: "Crystal Ball",
    desc: "Triple your power per click.",
    cost: 5000,
    bought: false,
    effect: () => { basePowerPerClick *= 3; }
  }
];

// ==== Data Save/Load ====
function saveGame() {
  const data = {
    power,
    basePowerPerClick,
    ascensions,
    ascensionBonus,
    upgrades: upgrades.map(u => u.bought),
    totalPower
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
    if (Array.isArray(data.upgrades)) {
      for (let i = 0; i < upgrades.length; i++) {
        upgrades[i].bought = !!data.upgrades[i];
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

// ==== UI Logic ====
function updatePower() {
  powerPerClick = basePowerPerClick + ascensionBonus;
  document.getElementById('power').textContent = "Power: " + power;
  document.getElementById('bonus').textContent = ascensions > 0
    ? `Ascension Bonus: +${ascensionBonus} Power per click (from ${ascensions} Mystic Rebirth${ascensions > 1 ? 's' : ''})`
    : '';
  document.getElementById('open-rebirth-btn').disabled = power < 10000;
  if (document.getElementById('shop-overlay').classList.contains('active')) renderUpgrades();
  document.getElementById('rebirth-bonus-preview').textContent = "+" + ((ascensions + 1) * 5);
}

function renderUpgrades() {
  let html = "";
  for (let i = 0; i < upgrades.length; i++) {
    const u = upgrades[i];
    html += `<button class="upgrade-btn" id="upgrade-${i}" ${u.bought || power < u.cost ? 'disabled' : ''}>
      ${u.bought ? "✅ " : ""}${u.name} (${u.cost} Power)<br>
      <span style="font-size:.93em;color:#ffeedd99;">${u.desc}</span>
    </button>`;
  }
  document.getElementById('upgrades').innerHTML = html;
  for (let i = 0; i < upgrades.length; i++) {
    if (!upgrades[i].bought && power >= upgrades[i].cost) {
      document.getElementById(`upgrade-${i}`).onclick = function() {
        power -= upgrades[i].cost;
        upgrades[i].bought = true;
        upgrades[i].effect();
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

function drawLightning() {
  lc.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);

  // Parameters
  const startX = 64, startY = 10 + Math.random() * 16;
  const endX = 64 + (Math.random() - 0.5) * 24, endY = 118 + Math.random() * 8;
  let points = [{x: startX, y: startY}];

  // Generate points for a jagged lightning
  let steps = 14 + Math.floor(Math.random() * 5);
  for (let i = 1; i <= steps; ++i) {
    let t = i / steps;
    let nx = startX + (endX - startX) * t + (Math.random() - 0.5) * 14;
    let ny = startY + (endY - startY) * t + (Math.random() - 0.5) * 10;
    points.push({x: nx, y: ny});
  }
  points.push({x: endX, y: endY});

  // Draw main (purple) lightning
  lc.save();
  lc.globalAlpha = 0.9;
  lc.lineWidth = 4;
  lc.shadowBlur = 8;
  lc.shadowColor = "#b896ff";
  lc.strokeStyle = "#ad22ff";
  lc.beginPath();
  lc.moveTo(points[0].x, points[0].y);
  for (let p of points) lc.lineTo(p.x, p.y);
  lc.stroke();
  lc.restore();

  // Draw inner (white) lightning
  lc.save();
  lc.globalAlpha = 0.7;
  lc.lineWidth = 2;
  lc.shadowBlur = 4;
  lc.shadowColor = "#fff";
  lc.strokeStyle = "#fff";
  lc.beginPath();
  lc.moveTo(points[0].x, points[0].y);
  for (let p of points) lc.lineTo(p.x, p.y);
  lc.stroke();
  lc.restore();

  // Draw black "shadow" branches
  for (let j = 0; j < 2 + Math.floor(Math.random()*2); j++) {
    let branchFrom = Math.floor(points.length * (0.3 + Math.random() * 0.4));
    let len = 3 + Math.floor(Math.random() * 4);
    let bx = points[branchFrom].x, by = points[branchFrom].y;
    lc.save();
    lc.globalAlpha = 0.4 + Math.random() * 0.2;
    lc.lineWidth = 2.5;
    lc.shadowBlur = 0;
    lc.strokeStyle = "#0a0018";
    lc.beginPath();
    lc.moveTo(bx, by);
    let angle = Math.PI/2 + (Math.random()-0.5)*1.3;
    for (let k = 1; k <= len; k++) {
      bx += Math.cos(angle) * (8 + Math.random() * 6);
      by += Math.sin(angle) * (8 + Math.random() * 6);
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
    lc.globalAlpha = 0.18;
    lc.fillRect(0,0,lightningCanvas.width,lightningCanvas.height);
    lc.globalCompositeOperation = "source-over";
    opacity -= 0.11;
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
  // Simulate click for mobile
  wizardBtn.click();
}, {passive: false});

// Click handler
wizardBtn.addEventListener('click', () => {
  power += powerPerClick;
  totalPower += powerPerClick;
  drawLightning();
  gameEvent();
});

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
    for (const u of upgrades) u.bought = false;
    rebirthOverlay.classList.remove('active');
    gameEvent();
    setTimeout(() => {
      alert(`✨ You have performed a Mystic Rebirth!\nPermanent bonus: +${ascensionBonus} Power per click.`);
    }, 250);
  }
};

// Reset Data
document.getElementById('reset-data-btn').onclick = resetGameData;

// Save when window/tab closes
window.addEventListener('beforeunload', saveGame);

// ==== Initial Load ====
loadGame();
updatePower();
