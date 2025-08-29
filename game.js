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

document.getElementById('wizard-btn').addEventListener('click', () => {
  power += powerPerClick;
  totalPower += powerPerClick;
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
