// Wizards Ascension Custom - Anti-Cheat, Events, Shop/Rebirth/Menu/UI Fixes
// v2.0.1 - Unban/admin code changed to: 12182009, DOMContentLoaded init fix

const GAME_VERSION = "v2.0.1";
const ADMIN_CODE = '12182009';

// ... (globals, all game logic above unchanged)

// ==== INITIALIZE ====
window.addEventListener('DOMContentLoaded', () => {
  loadGame();
  updateTitleUnlocks();
  updatePower();
  startEventLoop();

  // Wizard click: shake, sound, power
  const wizardBtn = document.getElementById('wizard-btn');
  wizardBtn.addEventListener('click', () => {
    const titleBonus = getEquippedTitleBonus();
    const {mulPPC} = getEventMultipliers();
    power += powerPerClick;
    totalPower += powerPerClick;
    if (!wizardBtn.classList.contains('shake')) {
      wizardBtn.classList.add('shake');
      setTimeout(() => wizardBtn.classList.remove('shake'), 220);
    }
    gameEvent();
  });

  // Main menu events
  const mainMenu = document.getElementById('main-menu-overlay');
  const continueBtn = document.getElementById('continue-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  const mainMenuMusic = document.getElementById('main-menu-music');
  const mainMenuUid = document.getElementById('main-menu-uid');
  continueBtn.onclick = () => { hideMainMenu(); };
  newGameBtn.onclick = () => { resetGameData(); hideMainMenu(); };

  window.addEventListener('load', () => {
    const hasSave = !!localStorage.getItem("wizardAscensionSave");
    continueBtn.style.display = hasSave ? "block" : "none";
    showMainMenu();
  });

  // Shop menu logic
  const shopOverlay = document.getElementById('shop-overlay');
  document.getElementById('open-shop-btn').onclick = () => {
    shopOverlay.classList.add('active');
    renderUpgrades();
  };
  document.getElementById('close-shop-btn').onclick = () => shopOverlay.classList.remove('active');
  shopOverlay.onclick = function(e) { if (e.target === shopOverlay) shopOverlay.classList.remove('active'); };

  // Titles menu
  const titlesOverlay = document.getElementById('titles-overlay');
  document.getElementById('open-titles-btn').onclick = () => {
    titlesOverlay.classList.add('active');
    renderTitlesMenu();
  };
  document.getElementById('close-titles-btn').onclick = () => titlesOverlay.classList.remove('active');
  titlesOverlay.onclick = function(e) { if (e.target === titlesOverlay) titlesOverlay.classList.remove('active'); };

  // Rebirth menu
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

  // Reset data
  document.getElementById('reset-data-btn').onclick = resetGameData;

  // PPS ticker
  setInterval(() => {
    const titleBonus = getEquippedTitleBonus();
    const {mulPPS} = getEventMultipliers();
    if ((powerPerSecond + titleBonus.pps) * mulPPS > 0) {
      power += ((powerPerSecond + titleBonus.pps) * mulPPS) / 10; // 10x/sec
      totalPower += ((powerPerSecond + titleBonus.pps) * mulPPS) / 10;
      gameEvent();
    }
  }, 100);

  // (Any other DOM code should go here)
});
// ==== INITIALIZE ====
loadGame();
updateTitleUnlocks();
updatePower();
startEventLoop();
