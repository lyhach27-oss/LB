import { GameState } from './gameState.js';
import { setBlockPosition } from './gameBoard.js';
import { removePuzzleBlocks } from './physics.js';
import { AppConfig } from './configManager.js';

export async function handleInputTap(r, c) {
    if (GameState.isInputLocked) return;
    
    let block = GameState.board[r][c];
    if (!block) return;
    
    const color = block.color;
    const connected = findConnectedBlocks(r, c, color);
    
    if (connected.length >= 2) {
        GameState.isInputLocked = true;
        await processMatchesAndGravity(connected);
        GameState.isInputLocked = false;
    }
}

function findConnectedBlocks(startR, startC, color) {
    const rows = AppConfig.board.rows;
    const cols = AppConfig.board.cols;
    const visited = new Set();
    const result = [];
    
    const queue = [{ r: startR, c: startC }];
    visited.add(`${startR},${startC}`);
    
    while (queue.length > 0) {
        const curr = queue.shift();
        result.push(curr);
        
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
    
    return result;
}

async function processMatchesAndGravity(matches) {
    const deletePhysicsIds = [];

    // 1. Remove blocks natively
    matches.forEach(m => {
        let block = GameState.board[m.r][m.c];
        if (block && block.element) {
            deletePhysicsIds.push(block.id);
            block.element.style.transform = `${block.element.style.transform} scale(0)`;
            setTimeout(() => { if (block.element.parentNode) block.element.remove(); }, 200);
            GameState.board[m.r][m.c] = null;
        }
    });

    // 2. Open physical holes
    removePuzzleBlocks(deletePhysicsIds);

    await sleep(200);
    
    // 3. Apply Column Gravity
    await applyGravity();
}

async function applyGravity() {
    const rows = AppConfig.board.rows;
    const cols = AppConfig.board.cols;
    let movedAny = false;

    for (let c = 0; c < cols; c++) {
        // Collect surviving blocks in this column from bottom to top
        let columnBlocks = [];
        for (let r = rows - 1; r >= 0; r--) {
            if (GameState.board[r][c] !== null) {
                columnBlocks.push(GameState.board[r][c]);
            }
        }
        
        // Write them back to board, from bottom up
        for (let r = rows - 1; r >= 0; r--) {
            if (columnBlocks.length > 0) {
                const blockObj = columnBlocks.shift();
                if (GameState.board[r][c] !== blockObj) {
                    movedAny = true;
                    GameState.board[r][c] = blockObj;
                    setBlockPosition(blockObj.element, r, c);
                }
            } else {
                GameState.board[r][c] = null;
            }
        }
    }
    
    if (movedAny) {
        await sleep(200); // Give time for visuals to slide down
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
