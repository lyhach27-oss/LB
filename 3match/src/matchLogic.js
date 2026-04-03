import { GameState } from './gameState.js';
import { setBlockPosition, spawnRawBlock } from './gameBoard.js';
import { removePuzzleBlocks } from './physics.js';

export function handleInputSwap(r, c, dirX, dirY) {
    if (GameState.isInputLocked) return;
    let targetRow = r + dirY;
    let targetCol = c + dirX;
    handleSwap(r, c, targetRow, targetCol);
}

// ----------------------------------------------------
// Logic
// ----------------------------------------------------

async function handleSwap(r1, c1, r2, c2) {
    if (r2 < 0 || r2 >= GameState.config.rows || c2 < 0 || c2 >= GameState.config.cols) return;
    
    // Prevent dragging to/from an empty permanent hole
    if (!GameState.board[r1][c1] || !GameState.board[r2][c2]) return;

    GameState.isInputLocked = true;

    // Swap in data structure
    const temp = GameState.board[r1][c1];
    GameState.board[r1][c1] = GameState.board[r2][c2];
    GameState.board[r2][c2] = temp;

    if (GameState.board[r1][c1]) setBlockPosition(GameState.board[r1][c1].element, r1, c1);
    if (GameState.board[r2][c2]) setBlockPosition(GameState.board[r2][c2].element, r2, c2);

    await sleep(200); 

    const matches = findMatches();

    if (matches.length > 0) {
        await processMatches(matches);
    } else {
        // Swap back (Invalid move)
        const tempBack = GameState.board[r1][c1];
        GameState.board[r1][c1] = GameState.board[r2][c2];
        GameState.board[r2][c2] = tempBack;
        
        if (GameState.board[r1][c1]) setBlockPosition(GameState.board[r1][c1].element, r1, c1);
        if (GameState.board[r2][c2]) setBlockPosition(GameState.board[r2][c2].element, r2, c2);
        
        await sleep(200);
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
    const deletePhysicsIds = [];

    // 1. Remove blocks via CSS animation
    matches.forEach(m => {
        let block = GameState.board[m.r][m.c];
        if (block && block.element) {
            deletePhysicsIds.push(block.id);
            block.element.style.transform = `${block.element.style.transform} scale(0)`;
            setTimeout(() => { if (block.element.parentNode) block.element.remove(); }, 200);
            GameState.board[m.r][m.c] = null;
        }
    });

    // Open holes in physics layer draining balls
    removePuzzleBlocks(deletePhysicsIds);

    await sleep(200);

    GameState.isInputLocked = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
