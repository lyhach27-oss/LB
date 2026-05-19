import { GameState } from './gameState.js';
import { handleInputTap } from './matchLogic.js';
import { AppConfig } from './configManager.js';

export function syncPhysicsBlock(block, r, c) {
    const boardC = document.getElementById(AppConfig.instanceId + '-board-container');
    if (!boardC) return;

    // Use pure logical coordinates matching the AppConfig.physics.canvasWxAppConfig.physics.canvasH physics engine
    const gap = GameState.config.cellGap;
    const cellSize = GameState.config.cellSize;
    const cols = GameState.config.cols;
    
    const boardLogicWidth = cols * (cellSize + gap) + gap;
    const boardLeftLogic = (AppConfig.physics.canvasW - boardLogicWidth) / 2;
    const boardTopLogic = boardC.offsetTop;

    const localX = gap + c * (cellSize + gap) + cellSize / 2;
    const localY = gap + r * (cellSize + gap) + cellSize / 2;

    const absoluteX = boardLeftLogic + localX;
    const absoluteY = boardTopLogic + localY;
    const absoluteSize = cellSize;

    const id = block.dataset.id;

    import('./physics.js').then(module => {
        if (!block.dataset.physCreated) {
            module.createPuzzleBlock(id, absoluteX, absoluteY, absoluteSize, absoluteSize);
            block.dataset.physCreated = "true";
        } else {
            module.movePuzzleBlock(id, absoluteX, absoluteY);
        }
    });
}

export function initBoard() {
    const board = document.getElementById(AppConfig.instanceId + '-game-board');
    if (!board) return;

    // Fixed logical AppConfig.physics.canvasWxAppConfig.physics.canvasH coordinate system, scaling is handled by #app wrapper
    board.style.transformOrigin = 'top center';
    board.style.transform = `scale(1.0)`;

    const gap = GameState.config.cellGap;
    const cols = GameState.config.cols;
    const rows = GameState.config.rows;
    
    const computedSize = Math.floor((AppConfig.physics.canvasW - gap * (cols + 1)) / cols);
    GameState.config.cellSize = computedSize;
    const cellSize = computedSize;

    board.style.width = `${cols * (cellSize + gap) + gap}px`;
    board.style.height = `${rows * (cellSize + gap) + gap}px`;
    board.innerHTML = '';

    GameState.board = Array.from({ length: rows }, () => Array(cols).fill(null));

    // Blocks
    let blockIdCounter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let colors = [...GameState.config.colors];
            if (c >= 2 && GameState.board[r][c - 1]?.color === GameState.board[r][c - 2]?.color) {
                colors = colors.filter(color => color !== GameState.board[r][c - 1].color);
            }
            if (r >= 2 && GameState.board[r - 1][c]?.color === GameState.board[r - 2][c]?.color) {
                colors = colors.filter(color => color !== GameState.board[r - 1][c].color);
            }

            const color = colors[Math.floor(Math.random() * colors.length)];
            const block = spawnRawBlock(r, c, color, `b_${blockIdCounter++}`);
            
            GameState.board[r][c] = {
                id: block.dataset.id,
                color: color,
                element: block
            };
            
            setBlockPosition(block, r, c);
        }
    }

    // Note: Side boundary walls are now generated centrally at initPhysics inside physics.js
}

export function spawnRawBlock(r, c, color, idStr) {
    const board = document.getElementById(AppConfig.instanceId + '-game-board');
    const cellSize = GameState.config.cellSize;
    
    const block = document.createElement('div');
    block.className = `block ${color}`;
    block.style.width = `${cellSize}px`;
    block.style.height = `${cellSize}px`;
    
    if (AppConfig.hexColors && AppConfig.hexColors[color]) {
        block.style.backgroundColor = AppConfig.hexColors[color];
    }
    block.dataset.id = idStr;
    block.dataset.row = r;
    block.dataset.col = c;

    block.addEventListener('click', () => {
        const row = parseInt(block.dataset.row);
        const col = parseInt(block.dataset.col);
        handleInputTap(row, col);
    });

    board.appendChild(block);
    return block;
}

export function setBlockPosition(block, row, col) {
    const gap = GameState.config.cellGap;
    const cellSize = GameState.config.cellSize;
    block.dataset.row = row;
    block.dataset.col = col;
    block.style.transform = `translate(${col * (cellSize + gap) + gap}px, ${row * (cellSize + gap) + gap}px)`;
    
    // Sync to physics accurately
    requestAnimationFrame(() => {
        syncPhysicsBlock(block, row, col);
    });
}
