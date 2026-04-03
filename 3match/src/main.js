import { GameState } from './gameState.js';
import { initBoard } from './gameBoard.js';
import { initPhysics, loadLevel } from './physics.js';

function initGame() {
  GameState.init();
  GameState.updateHUD();

  initPhysics('physics-container');
  loadLevel('zigzag');
  
  initBoard();

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
      initBoard(); 
    }, 200);
  });

  const ctaBtn = document.getElementById('cta-button');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      if (typeof mraid !== 'undefined') {
        mraid.open('https://example.com/store/app');
      } else {
        console.log('Opened Store Link!');
        alert('Redirecting to App Store...');
      }
    });
  }
}

initGame();
