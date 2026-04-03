import { GameState } from './gameState.js';
import { handleInputSwap } from './matchLogic.js';

let draggedBlock = null;
let startX = 0, startY = 0;

export function initBoard() {
    const board = document.getElementById('game-board');
    if (!board) return;

    // Use available screen width but bound it
    const containerWidth = Math.min(window.innerWidth, 500);
    const gap = GameState.config.cellGap;
    const cols = GameState.config.cols;
    const rows = GameState.config.rows;
    
    GameState.config.cellSize = Math.floor((containerWidth - gap * (cols + 1)) / cols);
    const cellSize = GameState.config.cellSize;

    board.style.width = `${cols * (cellSize + gap) + gap}px`;
    board.style.height = `${rows * (cellSize + gap) + gap}px`;
    board.innerHTML = '';

    GameState.board = Array.from({ length: rows }, () => Array(cols).fill(null));

    // Cells
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const bg = document.createElement('div');
            bg.className = 'cell-bg';
            bg.style.width = `${cellSize}px`;
            bg.style.height = `${cellSize}px`;
            bg.style.left = `${c * (cellSize + gap) + gap}px`;
            bg.style.top = `${r * (cellSize + gap) + gap}px`;
            board.appendChild(bg);
        }
    }

    // Blocks
    let blockIdCounter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let colors = [...GameState.config.colors];
            // Prevent initial matches
            if (c >= 2 && GameState.board[r][c - 1]?.color === GameState.board[r][c - 2]?.color) {
                colors = colors.filter(color => color !== GameState.board[r][c - 1].color);
            }
            if (r >= 2 && GameState.board[r - 1][c]?.color === GameState.board[r - 2][c]?.color) {
                colors = colors.filter(color => color !== GameState.board[r - 1][c].color);
            }

            const color = colors[Math.floor(Math.random() * colors.length)];
            const block = spawnRawBlock(r, c, color, blockIdCounter++);
            
            GameState.board[r][c] = {
                id: block.dataset.id,
                color: color,
                element: block
            };
            setBlockPosition(block, r, c);
        }
    }
}

export function spawnRawBlock(r, c, color, idStr) {
    const board = document.getElementById('game-board');
    const cellSize = GameState.config.cellSize;
    
    const block = document.createElement('div');
    block.className = `block ${color}`;
    block.style.width = `${cellSize}px`;
    block.style.height = `${cellSize}px`;
    block.dataset.id = idStr;
    block.dataset.row = r;
    block.dataset.col = c;

    block.addEventListener('touchstart', handlePointerDown, { passive: false });
    block.addEventListener('mousedown', handlePointerDown);
    block.addEventListener('touchend', handlePointerUp);
    block.addEventListener('mouseup', handlePointerUp);
    block.addEventListener('mouseleave', handlePointerUp);

    board.appendChild(block);
    return block;
}

export function setBlockPosition(block, row, col) {
    const gap = GameState.config.cellGap;
    const cellSize = GameState.config.cellSize;
    block.dataset.row = row;
    block.dataset.col = col;
    block.style.transform = `translate(${col * (cellSize + gap) + gap}px, ${row * (cellSize + gap) + gap}px)`;
}

function handlePointerDown(e) {
    if (GameState.isInputLocked) return;
    draggedBlock = e.target;
    if (e.touches && e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else {
        startX = e.clientX;
        startY = e.clientY;
    }
}

function handlePointerUp(e) {
    if (!draggedBlock || GameState.isInputLocked) return;
    
    let endX, endY;
    if (e.changedTouches && e.changedTouches.length > 0) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
    } else {
        endX = e.clientX;
        endY = e.clientY;
    }

    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > 20 || Math.abs(diffY) > 20) {
        let dirX = 0, dirY = 0;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            dirX = diffX > 0 ? 1 : -1;
        } else {
            dirY = diffY > 0 ? 1 : -1;
        }

        const r = parseInt(draggedBlock.dataset.row);
        const c = parseInt(draggedBlock.dataset.col);
        handleInputSwap(r, c, dirX, dirY);
    }
    draggedBlock = null;
}
