// Wizards Ascension v1.7.0 - Full Source (renamed game.js)
// [All game logic unchanged except for wizard lightning/purple box removal and outline tweak]

// ... [all code before "==== LIGHTNING EFFECTS ====" remains unchanged] ...

// ==== LIGHTNING EFFECTS ====
// Main canvas (unchanged - still used for background lightning)
const mainLightningCanvas = document.getElementById('main-lightning-canvas');
function resizeMainLightningCanvas() {
  mainLightningCanvas.width = window.innerWidth;
  mainLightningCanvas.height = Math.max(80, Math.round(window.innerHeight * 0.18));
}
resizeMainLightningCanvas();
window.addEventListener('resize', resizeMainLightningCanvas);

function drawMainLightning() {
  // [Unchanged code for the main lightning effect]
  // ... (main lightning code skipped for brevity)
}

// ==== WIZARD BUTTON OUTLINE EFFECT (no lightning, no purple box) ====

// Remove all wizard lightning and purple core/box canvas effects.
// Instead, only draw a subtle, small, pixelated white outline.
const wizardBtn = document.getElementById('wizard-btn');
const wizardOutlineCanvas = document.getElementById('wizard-outline-canvas');

function resizeWizardOutlineCanvas() {
  if (!wizardOutlineCanvas || !wizardBtn) return;
  wizardOutlineCanvas.width = wizardBtn.offsetWidth;
  wizardOutlineCanvas.height = wizardBtn.offsetHeight;
  drawWizardOutline();
}

function drawWizardOutline() {
  if (!wizardOutlineCanvas) return;
  const ctx = wizardOutlineCanvas.getContext('2d');
  const w = wizardOutlineCanvas.width, h = wizardOutlineCanvas.height;
  ctx.clearRect(0, 0, w, h);

  // Subtle, smaller, pixelated white outline
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  // A rectangle inset from the edge, subtle
  ctx.strokeRect(
    Math.floor(w * 0.10),
    Math.floor(h * 0.10),
    Math.floor(w * 0.80),
    Math.floor(h * 0.80)
  );
  ctx.restore();
}

// Redraw on resize and hover
window.addEventListener('resize', resizeWizardOutlineCanvas);
wizardBtn.addEventListener('mouseenter', drawWizardOutline);
wizardBtn.addEventListener('mouseleave', drawWizardOutline);
resizeWizardOutlineCanvas();

// Remove wizard lightning from click effect
wizardBtn.addEventListener('click', () => {
  const titleBonus = getEquippedTitleBonus();
  const {mulPPC} = getEventMultipliers();
  power += powerPerClick;
  totalPower += powerPerClick;
  // drawWizardLightning(); <-- removed!
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

// ... [ALL REMAINING GAME CODE UNCHANGED] ...
