import { GameState } from './gameState.js';
import { AppConfig } from './configManager.js';

export function showTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    const hand = document.getElementById('tutorial-hand');

    if (!overlay || !hand) return;

    // Find a valid match to hint
    const hint = findHint();

    if (hint) {
        const HAND_OFFSET_X = -15; 
        const HAND_OFFSET_Y = -10;

        const pos1 = getLogicalPos(hint.r, hint.c);

        const container = document.getElementById(AppConfig.instanceId + '-physics-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        
        const scaleX = rect.width / AppConfig.physics.canvasW;
        const scaleY = rect.height / AppConfig.physics.canvasH;

        const startX = pos1.x * scaleX + rect.left + HAND_OFFSET_X;
        const startY = pos1.y * scaleY + rect.top + HAND_OFFSET_Y;

        const appRect = document.getElementById(AppConfig.instanceId + '-app').getBoundingClientRect();
        const offsetX = -appRect.left;
        const offsetY = -appRect.top;

        const css = `
      @keyframes tutorialTap {
        0% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(1.2); opacity: 0; }
        20% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(1); opacity: 1; }
        50% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(0.8); opacity: 1; }
        80% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(1); opacity: 1; }
        100% { transform: translate(${offsetX + startX}px, ${offsetY + startY}px) scale(1.2); opacity: 0; }
      }
    `;

        let styleEl = document.getElementById('tutorial-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'tutorial-style';
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = css;

        hand.style.animation = 'tutorialTap 1.5s infinite ease-in-out';
        overlay.classList.remove('hidden');

        document.addEventListener('touchstart', hideTutorial, { once: true });
        document.addEventListener('mousedown', hideTutorial, { once: true });
    }
}

function getLogicalPos(r, c) {
    const gap = AppConfig.board.cellGap;
    const cellSize = AppConfig.board.cellSize;
    return {
        x: gap + c * (cellSize + gap) + cellSize / 2,
        y: gap + r * (cellSize + gap) + cellSize / 2
    };
}

function hideTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function findHint() {
    const rows = AppConfig.board.rows;
    const cols = AppConfig.board.cols;
    const visited = new Set();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!visited.has(`${r},${c}`) && GameState.board[r][c]) {
                const color = GameState.board[r][c].color;
                const group = [];
                const queue = [{ r, c }];
                visited.add(`${r},${c}`);
                
                while (queue.length > 0) {
                    const curr = queue.shift();
                    group.push(curr);
                    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                    for (let d of dirs) {
                        let nr = curr.r + d[0];
                        let nc = curr.c + d[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                            if (!visited.has(`${nr},${nc}`) && GameState.board[nr][nc] && GameState.board[nr][nc].color === color) {
                                visited.add(`${nr},${nc}`);
                                queue.push({ r: nr, c: nc });
                            }
                        }
                    }
                }
                
                if (group.length >= 2) {
                    return { r: group[0].r, c: group[0].c }; // return a coordinate to tap
                }
            }
        }
    }
    return null;
}
