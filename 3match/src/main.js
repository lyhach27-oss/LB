import { GameState } from './gameState.js';
import { initBoard } from './gameBoard.js';
import { initPhysics, loadLevel } from './physics.js';
import { loadConfig, AppConfig } from './configManager.js';

async function initGame() {
  await loadConfig();

  // Inject text into HTML
  document.title = AppConfig.texts.title;
  
  const ctaBtn = document.getElementById('cta-button');
  if (ctaBtn) ctaBtn.innerText = AppConfig.texts.ctaButton;
  
  const goModal = document.getElementById('game-over-modal');
  if (goModal) {
    goModal.querySelector('h1').innerText = AppConfig.texts.gameOverTitle;
    goModal.querySelector('p').innerText = AppConfig.texts.gameOverDesc;
    goModal.querySelector('a').innerText = AppConfig.texts.downloadButton;
  }
  
  const clearModal = document.getElementById('game-clear-modal');
  if (clearModal) {
    clearModal.querySelector('h1').innerText = AppConfig.texts.gameClearTitle;
    clearModal.querySelector('p').innerText = AppConfig.texts.gameClearDesc;
    clearModal.querySelector('a').innerText = AppConfig.texts.downloadButton;
  }
  
  const healthRingText = document.querySelector('#health-ring text');
  if (healthRingText) {
      healthRingText.textContent = AppConfig.texts.healthEmoji;
  }
  const defenderDiv = document.getElementById('defender');
  if (defenderDiv && defenderDiv.childNodes[0]) {
      defenderDiv.childNodes[0].nodeValue = AppConfig.texts.defenderEmoji;
  }

  GameState.init();
  GameState.updateHUD();

  initPhysics('physics-container');
  loadLevel('zigzag');
  
  initBoard();

  function rescaleApp() {
      const app = document.getElementById('app');
      // Fit either width or height, preserving aspect ratio. 500x900
      const scale = Math.min(window.innerWidth / 500, window.innerHeight / 900);
      app.style.transform = `translateX(-50%) scale(${scale})`;
  }
  
  window.addEventListener('resize', () => {
    rescaleApp();
  });
  
  rescaleApp(); // Initial scale

  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      if (typeof mraid !== 'undefined') {
        mraid.open(AppConfig.urls.storeLink);
      } else {
        console.log(AppConfig.texts.consoleStoreText);
        alert(AppConfig.texts.alertStoreText);
      }
    });
  }
}

initGame();
