import Matter from 'matter-js';
import { levels } from './levelConfig.js';
import { AppConfig } from './configManager.js';

const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

let engine;
let render;
let runner;
let balls = [];
const MAX_BALLS = 180;

export let doorObj = null;
export let floorPlatform = null;
let isGameOver = false;
let isGameClear = false;
export const puzzleBodies = {};

export let canvasW = 500;
export let canvasH = 900;
let smoothedVelocity = 0;
let ballsSpawned = 0;
let ballSpawnInterval;

export function initPhysics(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    canvasW = container.clientWidth;
    canvasH = container.clientHeight;

    engine = Engine.create();
    
    // Canvas strictly exactly 1:1 view
    render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: canvasW,
            height: canvasH,
            wireframes: false,
            background: 'transparent'
        }
    });

    Render.run(render);
    
    runner = Runner.create();
    Runner.run(runner, engine);

    setupGameLoop();
    
    ballsSpawned = 0;

    // Ball Spawner
    ballSpawnInterval = setInterval(() => {
        if (isGameOver || isGameClear || ballsSpawned >= AppConfig.physics.totalBalls) {
            if (ballsSpawned >= AppConfig.physics.totalBalls) clearInterval(ballSpawnInterval);
            return;
        }

        for (let i = 0; i < 2; i++) {
            const x = (50 + Math.random() * 100) * (canvasW / AppConfig.physics.canvasW);
            const y = -20 - Math.random() * 20;
            createBall(x, y);
        }
    }, AppConfig.physics.ballSpawnIntervalMs); 
}

function setupGameLoop() {
    Events.on(engine, 'beforeUpdate', () => {
        if (isGameOver || !doorObj || !floorPlatform) return;

        // Apply natural leftward force simulating the defender pushing back
        // Adjusted for heavier door mass
        Body.applyForce(doorObj, doorObj.position, { x: AppConfig.physics.defenderPushForceX, y: 0 }); 

        let boardTopPx = canvasH * 0.5;
        let boardRightPx = canvasW;
        const board = document.getElementById('game-board');
        if (board && board.offsetHeight > 0) {
            const rect = board.getBoundingClientRect();
            boardTopPx = rect.top;
            boardRightPx = rect.right;
        }

        const baselineX = canvasW * 0.5; // ~50% across the screen (Moved from 70%)
        // Floor platform is 10px high sitting on top of board. Door sits on top of platform.
        const doorY = boardTopPx - 60;

        // Force door to stay on Y axis right above the board and securely upright
        Body.setPosition(doorObj, { x: doorObj.position.x, y: doorY });
        Body.setVelocity(doorObj, { x: doorObj.velocity.x, y: 0 });
        Body.setAngle(doorObj, 0);
        Body.setAngularVelocity(doorObj, 0);

        // Dynamically keep the floor perfectly synced right beneath door
        const platformW = canvasW; 
        const platformX = baselineX + platformW / 2;
        const platformY = boardTopPx - 5;
        Body.setPosition(floorPlatform, { x: platformX, y: platformY });

        // Prevent door from pushing *too* far left past its baseline
        if (doorObj.position.x < baselineX) {
            Body.setPosition(doorObj, { x: baselineX, y: doorY });
            Body.setVelocity(doorObj, { x: 0, y: 0 });
        }

        // Game Over & Health Logic
        const deathThresholdX = boardRightPx - 12; 
        const totalDist = deathThresholdX - baselineX;
        let currentDist = doorObj.position.x - baselineX;
        if(currentDist < 0) currentDist = 0;

        let dangerRatio = currentDist / totalDist;
        if(dangerRatio > 1) dangerRatio = 1;
        
        const healthArc = document.getElementById('health-arc');
        if (healthArc) {
            const circumference = 125.6;
            // When danger=0 (offset=0, full ring). When danger=1 (offset=125.6, empty ring).
            healthArc.style.strokeDashoffset = circumference * dangerRatio;
        }

        if (doorObj.position.x >= deathThresholdX) {
            if (!isGameOver && !isGameClear) {
                isGameOver = true;
                const defender = document.getElementById('defender');
                if(defender && defender.childNodes[0]) defender.childNodes[0].nodeValue = AppConfig.texts.defenderDeadEmoji;
                
                const modal = document.getElementById('game-over-modal');
                if (modal) modal.style.display = 'flex';
            }
        }

        // Visual Sync for Defender Emoji based on Door position
        const defender = document.getElementById('defender');
        if (defender) {
            const doorRightPx = doorObj.position.x + 10; 
            const doorTopPx = doorY - 55; // Sit on the exact logical unit
            defender.style.transform = `translate(${doorRightPx}px, ${doorTopPx}px)`;
        }

        // Win Condition logic
        let activeBalls = 0;
        Composite.allBodies(engine.world).forEach(body => {
            if (body.label === 'ball') activeBalls++;
            
            // Clean up bodies that fall out of bounds
            if (body.position.y > canvasH + 100) {
                World.remove(engine.world, body);
            }
        });

        if (ballsSpawned >= AppConfig.physics.totalBalls && activeBalls === 0 && !isGameOver && !isGameClear) {
            isGameClear = true;
            const clearModal = document.getElementById('game-clear-modal');
            if (clearModal) clearModal.style.display = 'flex';
        }
    });
}

export function loadLevel(levelName) {
    if (!engine) return;
    const levelData = levels[levelName];
    if (!levelData) return;

    World.clear(engine.world);
    Engine.clear(engine);

    // Add visual funnel scaling to 1:1
    const sX = canvasW / AppConfig.physics.canvasW;
    levelData.forEach(wall => {
        const staticBody = Bodies.rectangle(wall.x * sX, wall.y, wall.width * sX, wall.height, {
            isStatic: true,
            angle: wall.angle,
            render: { fillStyle: '#ffaa00' }
        });
        World.add(engine.world, staticBody);
    });

    const baselineX = canvasW * 0.5;
    let boardTopPx = canvasH * 0.5;
    const board = document.getElementById('game-board');
    if (board && board.offsetHeight > 0) {
        boardTopPx = board.getBoundingClientRect().top;
    }
    
    // Create the standing platform exactly on top of the puzzle roof
    const platformW = canvasW; 
    const platformX = baselineX + platformW / 2; // stretches infinitely to the right
    const platformY = boardTopPx - 5; // 10px high, hugs exactly the roof
    floorPlatform = Bodies.rectangle(platformX, platformY, platformW, 10, {
        isStatic: true,
        render: { fillStyle: '#ffaa00' } // Matching the wall aesthetics
    });

    const doorY = boardTopPx - 60; // 50px (half door) + 10px (platform thickness)
    
    doorObj = Bodies.rectangle(baselineX, doorY, 20, 100, {
        isStatic: false,
        mass: AppConfig.physics.doorMass,
        frictionAir: AppConfig.physics.doorFrictionAir,
        inertia: AppConfig.physics.doorInertia || Infinity,
        render: { fillStyle: '#a30000' }
    });

    World.add(engine.world, [doorObj, floorPlatform]);
    balls = [];
    isGameOver = false;
    isGameClear = false;
    ballsSpawned = 0;
}

export function createPuzzleBlock(id, x, y, width, height) {
    if (!engine) return;
    const body = Bodies.rectangle(x, y, width - 2, height - 2, {
        isStatic: true, 
        render: { visible: false }
    });

    puzzleBodies[id] = body;
    World.add(engine.world, body);
}

export function removePuzzleBlocks(ids) {
    if (!engine) return;
    ids.forEach(id => {
        const body = puzzleBodies[id];
        if (body) {
            World.remove(engine.world, body);
            delete puzzleBodies[id];
        }
    });
}

export function movePuzzleBlock(id, x, y) {
    const body = puzzleBodies[id];
    if (body) {
        Body.setPosition(body, { x, y });
    }
}

export function createSideWall(x, y, w, h) {
    if (!engine) return;
    const body = Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        render: { fillStyle: '#ffaa00' } 
    });
    World.add(engine.world, body);
}

export function createBall(x, y) {
    if (!engine) return;

    ballsSpawned++;

    const scale = (canvasW / AppConfig.physics.canvasW);
    
    // Slight randomization sizes
    if (Math.random() < AppConfig.physics.smallBallChance) {
        const ball = Bodies.circle(x, y, scale * AppConfig.physics.smallBallScale, { 
            restitution: AppConfig.physics.smallBallRestitution, 
            density: AppConfig.physics.smallBallDensity, 
            label: 'ball',
            render: { fillStyle: '#ffeb3b', lineWidth: 1, strokeStyle: '#000' }
        });
        Body.setVelocity(ball, {x: 0, y: AppConfig.physics.smallBallVeloY});
        World.add(engine.world, ball);
    } else {
        const ball = Bodies.circle(x, y, scale * AppConfig.physics.largeBallScale, {
            restitution: AppConfig.physics.largeBallRestitution,
            density: AppConfig.physics.largeBallDensity,
            label: 'ball',
            render: { fillStyle: ['#4287f5', '#f54242', '#42f566', '#f5d142'][Math.floor(Math.random()*4)], lineWidth: 1, strokeStyle: '#000' }
        });
        Body.setVelocity(ball, {x: 0, y: AppConfig.physics.largeBallVeloY});
        World.add(engine.world, ball);
    }
}
