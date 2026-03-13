import './style.css';
import { GameState } from './gameState.js';
import { initBoard } from './gameBoard.js';
import { showTutorial } from './tutorial.js';


function initGame() {
  // Set Objective Icon color
  const objIcon = document.querySelector('.objective-icon');
  if (objIcon) {
    objIcon.className = `objective-icon ${GameState.config.objectiveColor}`;
  }

  GameState.init();
  GameState.updateHUD();

  initBoard();

  // Show tutorial shortly after board init
  setTimeout(() => {
    showTutorial();
  }, 500);

  // Handle resize nicely (for Playable ad responsiveness)
  window.addEventListener('resize', () => {
    // Basic debounce
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
      initBoard(); // Real ad might recalculate positions instead of respawn, but this is simpler for MVP
    }, 200);
  });

  // Setup Ad CTA
  document.getElementById('cta-button').addEventListener('click', () => {
    // If running in mraid environment:
    if (typeof mraid !== 'undefined') {
      mraid.open('https://example.com/store/app');
    } else {
      console.log('Opened Store Link!');
      alert('Redirecting to App Store...');
    }
  });
}

document.addEventListener('DOMContentLoaded', initGame);
