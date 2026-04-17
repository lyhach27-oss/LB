import { GameState } from './gameState.js';
import { initBoard } from './gameBoard.js';
import { initPhysics, loadLevel } from './physics.js';
import { loadConfig, AppConfig } from './configManager.js';

async function initGame() {
  await loadConfig();

  // Inject text into HTML
  document.title = AppConfig.texts.title;
  
  const ctaBtn = document.getElementById(AppConfig.instanceId + '-cta-button');
  if (ctaBtn) ctaBtn.innerText = AppConfig.texts.ctaButton;
  
  const goModal = document.getElementById(AppConfig.instanceId + '-game-over-modal');
  if (goModal) {
    goModal.querySelector('h1').innerText = AppConfig.texts.gameOverTitle;
    goModal.querySelector('p').innerText = AppConfig.texts.gameOverDesc;
    goModal.querySelector('a').innerText = AppConfig.texts.downloadButton;
  }
  
  const clearModal = document.getElementById(AppConfig.instanceId + '-game-clear-modal');
  if (clearModal) {
    clearModal.querySelector('h1').innerText = AppConfig.texts.gameClearTitle;
    clearModal.querySelector('p').innerText = AppConfig.texts.gameClearDesc;
    clearModal.querySelector('a').innerText = AppConfig.texts.downloadButton;
  }
  
  const healthRingText = document.querySelector('#' + AppConfig.instanceId + '-health-ring text');
  if (healthRingText) {
      healthRingText.textContent = AppConfig.texts.healthEmoji;
  }
  const defenderDiv = document.getElementById(AppConfig.instanceId + '-defender');
  if (defenderDiv && defenderDiv.childNodes[0]) {
      defenderDiv.childNodes[0].nodeValue = AppConfig.texts.defenderEmoji;
  }

  GameState.init();

  initPhysics(AppConfig.instanceId + '-physics-container');
  loadLevel('zigzag');
  
  initBoard();

  function rescaleApp() {
      const app = document.getElementById(AppConfig.instanceId + '-app');
      // Fit either width or height, preserving aspect ratio. AppConfig.physics.canvasWxAppConfig.physics.canvasH
      const scale = Math.min(window.innerWidth / AppConfig.physics.canvasW, window.innerHeight / AppConfig.physics.canvasH);
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
