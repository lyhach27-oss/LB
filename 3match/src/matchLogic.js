import { GameState } from './gameState.js';
import { setBlockPosition } from './gameBoard.js';

let draggedBlock = null;
let startX = 0;
let startY = 0;

export function setupInputHandlers(blockEl) {
    // Touch events for mobile playable ad
    blockEl.addEventListener('touchstart', onTouchStart, { passive: false });
    blockEl.addEventListener('touchmove', onTouchMove, { passive: false });
    blockEl.addEventListener('touchend', onTouchEnd, { passive: false });

    // Mouse events for desktop testing
    blockEl.addEventListener('mousedown', onMouseDown);
}

function onTouchStart(e) {
    if (GameState.isInputLocked) return;
    draggedBlock = e.target.closest('.block');
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    // e.preventDefault(); // Prevent scrolling
}

function onTouchMove(e) {
    if (!draggedBlock || GameState.isInputLocked) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = currentX - startX;
    const diffY = currentY - startY;

    // Threshold to trigger swap
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        let targetRow = parseInt(draggedBlock.dataset.row);
        let targetCol = parseInt(draggedBlock.dataset.col);

        if (Math.abs(diffX) > Math.abs(diffY)) {
            targetCol += diffX > 0 ? 1 : -1;
        } else {
            targetRow += diffY > 0 ? 1 : -1;
        }

        draggedBlock = null; // Reset immediately to prevent multiple triggers
        handleSwap(parseInt(e.target.dataset.row), parseInt(e.target.dataset.col), targetRow, targetCol);
    }
}

function onTouchEnd(e) {
    draggedBlock = null;
}

function onMouseDown(e) {
    if (GameState.isInputLocked) return;
    draggedBlock = e.target.closest('.block');
    startX = e.clientX;
    startY = e.clientY;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
    if (!draggedBlock || GameState.isInputLocked) return;
    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;

    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        let targetRow = parseInt(draggedBlock.dataset.row);
        let targetCol = parseInt(draggedBlock.dataset.col);

        if (Math.abs(diffX) > Math.abs(diffY)) {
            targetCol += diffX > 0 ? 1 : -1;
        } else {
            targetRow += diffY > 0 ? 1 : -1;
        }

        let sourceRow = parseInt(draggedBlock.dataset.row);
        let sourceCol = parseInt(draggedBlock.dataset.col);

        draggedBlock = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        handleSwap(sourceRow, sourceCol, targetRow, targetCol);
    }
}

function onMouseUp() {
    draggedBlock = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// ----------------------------------------------------
// Logic
// ----------------------------------------------------

async function handleSwap(r1, c1, r2, c2) {
    if (r2 < 0 || r2 >= GameState.config.rows || c2 < 0 || c2 >= GameState.config.cols) return;

    GameState.isInputLocked = true;

    // Swap in data structure
    const temp = GameState.board[r1][c1];
    GameState.board[r1][c1] = GameState.board[r2][c2];
    GameState.board[r2][c2] = temp;

    // Visually swap
    setBlockPosition(GameState.board[r1][c1].element, r1, c1);
    setBlockPosition(GameState.board[r2][c2].element, r2, c2);

    await sleep(250); // wait for animation

    const matches = findMatches();

    if (matches.length > 0) {
        GameState.currentMoves--;
        GameState.updateHUD();
        await processMatches(matches);
    } else {
        // Swap back (Invalid move)
        const tempBack = GameState.board[r1][c1];
        GameState.board[r1][c1] = GameState.board[r2][c2];
        GameState.board[r2][c2] = tempBack;

        setBlockPosition(GameState.board[r1][c1].element, r1, c1);
        setBlockPosition(GameState.board[r2][c2].element, r2, c2);
        await sleep(250);
        GameState.isInputLocked = false;
    }
}

function findMatches() {
    let matchedBlocks = new Set();

    // Check rows
    for (let r = 0; r < GameState.config.rows; r++) {
        for (let c = 0; c < GameState.config.cols - 2; c++) {
            let b1 = GameState.board[r][c];
            let b2 = GameState.board[r][c + 1];
            let b3 = GameState.board[r][c + 2];

            if (b1 && b2 && b3 && b1.color === b2.color && b2.color === b3.color) {
                matchedBlocks.add(`${r},${c}`);
                matchedBlocks.add(`${r},${c + 1}`);
                matchedBlocks.add(`${r},${c + 2}`);
            }
        }
    }

    // Check cols
    for (let c = 0; c < GameState.config.cols; c++) {
        for (let r = 0; r < GameState.config.rows - 2; r++) {
            let b1 = GameState.board[r][c];
            let b2 = GameState.board[r + 1][c];
            let b3 = GameState.board[r + 2][c];

            if (b1 && b2 && b3 && b1.color === b2.color && b2.color === b3.color) {
                matchedBlocks.add(`${r},${c}`);
                matchedBlocks.add(`${r + 1},${c}`);
                matchedBlocks.add(`${r + 2},${c}`);
            }
        }
    }

    return Array.from(matchedBlocks).map(str => {
        let [r, c] = str.split(',').map(Number);
        return { r, c };
    });
}

async function processMatches(matches) {
    // 1. Remove blocks
    matches.forEach(m => {
        let block = GameState.board[m.r][m.c];
        if (block) {
            if (block.color === GameState.config.objectiveColor) {
                GameState.currentObjectiveCount++;
                GameState.updateHUD();
            }

            // Visual pop
            block.element.style.transform += ' scale(0)';
            block.element.style.opacity = '0';

            setTimeout(() => {
                if (block.element.parentNode) block.element.parentNode.removeChild(block.element);
            }, 200);

            GameState.board[m.r][m.c] = null;
        }
    });

    await sleep(250);

    // 2. Gravity (Fall down)
    let moved = false;
    for (let c = 0; c < GameState.config.cols; c++) {
        let emptySlots = 0;
        for (let r = GameState.config.rows - 1; r >= 0; r--) {
            if (!GameState.board[r][c]) {
                emptySlots++;
            } else if (emptySlots > 0) {
                // Move block down
                GameState.board[r + emptySlots][c] = GameState.board[r][c];
                GameState.board[r][c] = null;
                setBlockPosition(GameState.board[r + emptySlots][c].element, r + emptySlots, c);
                moved = true;
            }
        }

        // 3. Spawn new blocks at top
        for (let i = 0; i < emptySlots; i++) {
            spawnNewBlock(i, c);
            moved = true;
        }
    }

    if (moved) await sleep(300);

    // 4. Check Cascades
    const newMatches = findMatches();
    if (newMatches.length > 0) {
        await processMatches(newMatches);
    } else {
        GameState.updateHUD(); // final sync
        const isGameOver = GameState.checkWinLossEndCard();
        if (!isGameOver) {
            GameState.isInputLocked = false;
        }
    }
}

function spawnNewBlock(r, c) {
    // Re-implemented simple spawn for gravity
    const colorIndex = Math.floor(Math.random() * GameState.config.colors.length);
    const color = GameState.config.colors[colorIndex];

    const blockEl = document.createElement('div');
    blockEl.className = `block ${color}`;

    const cellSize = GameState.config.cellSize;
    blockEl.style.width = `${cellSize}px`;
    blockEl.style.height = `${cellSize}px`;

    // Start above board
    blockEl.style.transform = `translate(${c * (cellSize + GameState.config.cellGap) + GameState.config.cellGap}px, -100px)`;

    setupInputHandlers(blockEl);

    document.getElementById('game-board').appendChild(blockEl);

    GameState.board[r][c] = {
        element: blockEl,
        color: color
    };

    // Ensure CSS transition triggers after append
    setTimeout(() => {
        setBlockPosition(blockEl, r, c);
    }, 10);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
