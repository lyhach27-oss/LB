import { GameState } from './gameState.js';
import { getPhysicalPos } from './gameBoard.js';

export function showTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    const hand = document.getElementById('tutorial-hand');

    if (!overlay || !hand) return;

    // Find a valid match to hint
    const hint = findHint();

    if (hint) {
        const { r1, c1, r2, c2 } = hint;

        const HAND_OFFSET_X = -15; 
        const HAND_OFFSET_Y = -10;

        const pos1 = getPhysicalPos(r1, c1);
        const pos2 = getPhysicalPos(r2, c2);

        const container = document.getElementById('physics-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        
        // Match-3 uses logical 500x900
        const scaleX = rect.width / 500;
        const scaleY = rect.height / 900;

        const startX = pos1.x * scaleX + rect.left + HAND_OFFSET_X;
        const startY = pos1.y * scaleY + rect.top + HAND_OFFSET_Y;

        const endX = pos2.x * scaleX + rect.left + HAND_OFFSET_X;
        const endY = pos2.y * scaleY + rect.top + HAND_OFFSET_Y;

        const appRect = document.getElementById('app').getBoundingClientRect();
        const offsetX = -appRect.left;
        const offsetY = -appRect.top;

        const css = `
      @keyframes tutorialSwipe {
        0% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(1); opacity: 0; }
        20% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(0.8); opacity: 1; }
        60% { transform: translate(${offsetX + endX}px, ${offsetY + endY}px) scale(0.8); opacity: 1; }
        80% { transform: translate(${offsetX + endX}px, ${offsetY + endY}px) scale(1); opacity: 0; }
        100% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(1); opacity: 0; }
      }
    `;

        let styleEl = document.getElementById('tutorial-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'tutorial-style';
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = css;

        hand.style.animation = 'tutorialSwipe 2.5s infinite ease-in-out';
        overlay.classList.remove('hidden');

        // Hide tutorial on first interaction
        document.addEventListener('touchstart', hideTutorial, { once: true });
        document.addEventListener('mousedown', hideTutorial, { once: true });
    }
}

function hideTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function findHint() {
    // Simulate swapping each adjacent pair to see if it makes a match
    for (let r = 0; r < GameState.config.rows; r++) {
        for (let c = 0; c < GameState.config.cols; c++) {
            // Check Right swap
            if (c < GameState.config.cols - 1 && checkSwapValidity(r, c, r, c + 1)) {
                return { r1: r, c1: c, r2: r, c2: c + 1 };
            }
            // Check Down swap
            if (r < GameState.config.rows - 1 && checkSwapValidity(r, c, r + 1, c)) {
                return { r1: r, c1: c, r2: r + 1, c2: c };
            }
        }
    }
    return null;
}

function checkSwapValidity(r1, c1, r2, c2) {
    // Temporarily swap
    const temp = GameState.board[r1][c1];
    GameState.board[r1][c1] = GameState.board[r2][c2];
    GameState.board[r2][c2] = temp;

    const isValid = hasAnyMatch();

    // Swap back
    GameState.board[r2][c2] = GameState.board[r1][c1];
    GameState.board[r1][c1] = temp;

    return isValid;
}

function hasAnyMatch() {
    // Check rows
    for (let r = 0; r < GameState.config.rows; r++) {
        for (let c = 0; c < GameState.config.cols - 2; c++) {
            let b1 = GameState.board[r][c];
            let b2 = GameState.board[r][c + 1];
            let b3 = GameState.board[r][c + 2];
            if (b1 && b2 && b3 && b1.color === b2.color && b2.color === b3.color) return true;
        }
    }
    // Check cols
    for (let c = 0; c < GameState.config.cols; c++) {
        for (let r = 0; r < GameState.config.rows - 2; r++) {
            let b1 = GameState.board[r][c];
            let b2 = GameState.board[r + 1][c];
            let b3 = GameState.board[r + 2][c];
            if (b1 && b2 && b3 && b1.color === b2.color && b2.color === b3.color) return true;
        }
    }
    return false;
}
