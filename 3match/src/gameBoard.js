import { GameState } from './gameState.js';
import { handleInputSwap } from './matchLogic.js';
import { AppConfig } from './configManager.js';

let draggedBlock = null;
let startX = 0, startY = 0;

export function syncPhysicsBlock(block, r, c) {
    const board = document.getElementById('game-board');
    if (!board) return;

    // Use absolute screen coordinates so Physics Engine 1:1 perfectly overlaps
    const boardRect = board.getBoundingClientRect();
    const gap = GameState.config.cellGap;
    const cellSize = GameState.config.cellSize;
    const cols = GameState.config.cols;
    
    const boardLogicWidth = cols * (cellSize + gap) + gap;
    const scale = boardRect.width / boardLogicWidth;

    const localX = gap + c * (cellSize + gap) + cellSize / 2;
    const localY = gap + r * (cellSize + gap) + cellSize / 2;

    const absoluteX = boardRect.left + (localX * scale);
    const absoluteY = boardRect.top + (localY * scale);
    const absoluteSize = cellSize * scale;

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
    const board = document.getElementById('game-board');
    if (!board) return;

    // Responsive scaling based on a 500 logical layout target
    const scale = Math.min(window.innerWidth / 500, 1.0);
    board.style.transformOrigin = 'top center';
    board.style.transform = `scale(${scale})`;

    const gap = GameState.config.cellGap;
    const cols = GameState.config.cols;
    const rows = GameState.config.rows;
    
    const computedSize = Math.floor((500 - gap * (cols + 1)) / cols);
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

    // Encapsulate board on left and right explicitly with solid boundary walls
    // preventing dynamic falls off the side
    requestAnimationFrame(() => {
        const br = board.getBoundingClientRect();
        import('./physics.js').then(m => {
            m.createSideWall(br.left - 50, br.top + br.height/2, 100, br.height * 2); 
            m.createSideWall(br.right + 50, br.top + br.height/2, 100, br.height * 2);
        });
    });
}

export function spawnRawBlock(r, c, color, idStr) {
    const board = document.getElementById('game-board');
    const cellSize = GameState.config.cellSize;
    
    const block = document.createElement('div');
    block.className = `block ${color}`;
    block.style.width = `${cellSize}px`;
    block.style.height = `${cellSize}px`;
    
    if (AppConfig.images[color]) {
        // Create an inner div to act like the ::after pseudo-element
        // so it scales the same way.
        const innerImg = document.createElement('div');
        innerImg.style.width = '80%';
        innerImg.style.height = '80%';
        innerImg.style.position = 'absolute';
        innerImg.style.top = '10%';
        innerImg.style.left = '10%';
        innerImg.style.backgroundImage = `url('${AppConfig.images[color]}')`;
        innerImg.style.backgroundSize = 'contain';
        innerImg.style.backgroundPosition = 'center';
        innerImg.style.backgroundRepeat = 'no-repeat';
        innerImg.style.pointerEvents = 'none';
        block.appendChild(innerImg);
    }
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
    
    // Sync to physics accurately
    requestAnimationFrame(() => {
        syncPhysicsBlock(block, row, col);
    });
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
