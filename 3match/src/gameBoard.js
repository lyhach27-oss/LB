import { GameState } from './gameState.js';
import { setupInputHandlers } from './matchLogic.js';

export function initBoard() {
    const container = document.getElementById('board-container');
    const boardEl = document.getElementById('game-board');

    // Calculate dynamic cell size based on container width and height
    const containerRect = container.getBoundingClientRect();
    // Use fallbacks in case layout hasn't fully applied yet
    const availableWidth = Math.max(containerRect.width, 300) - 20; // minus padding
    const availableHeight = Math.max(containerRect.height, 300) - 20;

    const maxCellWidth = Math.floor(availableWidth / GameState.config.cols);
    const maxCellHeight = Math.floor(availableHeight / GameState.config.rows);

    let calculatedSize = Math.min(maxCellWidth, maxCellHeight, 60) - GameState.config.cellGap;
    GameState.config.cellSize = Math.max(20, calculatedSize); // Prevent too small or negative sizes
    const cellSize = GameState.config.cellSize;
    const gap = GameState.config.cellGap;

    boardEl.style.width = `${(cellSize + gap) * GameState.config.cols + gap}px`;
    boardEl.style.height = `${(cellSize + gap) * GameState.config.rows + gap}px`;
    boardEl.innerHTML = '';

    GameState.board = Array.from({ length: GameState.config.rows }, () =>
        Array(GameState.config.cols).fill(null)
    );

    // Generate initial board (preventing initial matches)
    for (let r = 0; r < GameState.config.rows; r++) {
        for (let c = 0; c < GameState.config.cols; c++) {
            // Draw background cell
            const bgCell = document.createElement('div');
            bgCell.className = 'cell-bg';
            bgCell.style.width = `${cellSize}px`;
            bgCell.style.height = `${cellSize}px`;
            bgCell.style.left = `${c * (cellSize + gap) + gap}px`;
            bgCell.style.top = `${r * (cellSize + gap) + gap}px`;
            boardEl.appendChild(bgCell);

            // Spawn actual block
            spawnBlock(r, c);
        }
    }
}

function spawnBlock(r, c) {
    const gap = GameState.config.cellGap;
    const cellSize = GameState.config.cellSize;

    // Pick a color that doesn't cause immediate 3-match
    let allowedColors = [...GameState.config.colors];

    if (r >= 2 && GameState.board[r - 1][c] && GameState.board[r - 2][c] &&
        GameState.board[r - 1][c].color === GameState.board[r - 2][c].color) {
        allowedColors = allowedColors.filter(color => color !== GameState.board[r - 1][c].color);
    }
    if (c >= 2 && GameState.board[r][c - 1] && GameState.board[r][c - 2] &&
        GameState.board[r][c - 1].color === GameState.board[r][c - 2].color) {
        allowedColors = allowedColors.filter(color => color !== GameState.board[r][c - 1].color);
    }

    const colorIndex = Math.floor(Math.random() * allowedColors.length);
    const color = allowedColors[colorIndex];

    const blockEl = document.createElement('div');
    blockEl.className = `block ${color}`;
    blockEl.dataset.row = r;
    blockEl.dataset.col = c;

    blockEl.style.width = `${cellSize}px`;
    blockEl.style.height = `${cellSize}px`;

    // Initial position logic
    setBlockPosition(blockEl, r, c);

    // Hook up inputs
    setupInputHandlers(blockEl);

    document.getElementById('game-board').appendChild(blockEl);

    GameState.board[r][c] = {
        element: blockEl,
        color: color
    };
}

export function setBlockPosition(element, row, col) {
    const gap = GameState.config.cellGap;
    const cellSize = GameState.config.cellSize;
    element.style.transform = `translate(${col * (cellSize + gap) + gap}px, ${row * (cellSize + gap) + gap}px)`;
    element.dataset.row = row;
    element.dataset.col = col;
}
