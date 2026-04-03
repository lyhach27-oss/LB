import Matter from 'matter-js';
import { levels } from './levelConfig.js';

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

let engine;
let render;
let runner;
let balls = [];
const MAX_BALLS = 150;

export let doorObj = null;
let isGameOver = false;

// Set up single instance of defense
export function initPhysics(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    engine = Engine.create();
    
    // Canvas set to top 50% logical size 500x450
    render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: 500,
            height: 450,
            wireframes: false,
            background: 'transparent'
        }
    });

    render.canvas.style.width = '100%';
    render.canvas.style.height = '100%';

    Render.run(render);
    
    runner = Runner.create();
    Runner.run(runner, engine);

    setupGameLoop();
    startSpawner();
}

function setupGameLoop() {
    Events.on(engine, 'beforeUpdate', () => {
        if (isGameOver || !doorObj) return;

        // Force door to stay on Y axis
        Body.setPosition(doorObj, { x: doorObj.position.x, y: 400 });
        Body.setVelocity(doorObj, { x: doorObj.velocity.x, y: 0 });

        // Prevent door from going too far left
        if (doorObj.position.x < 250) {
            Body.setPosition(doorObj, { x: 250, y: 400 });
            Body.setVelocity(doorObj, { x: 0, y: 0 });
        }

        // Game Over logic (Balls pushed the door too far right)
        if (doorObj.position.x > 450) {
            isGameOver = true;
            alert('Game Over! The door was breached.');
        }
    });
}

export function loadLevel(levelName) {
    if (!engine) return;
    const levelData = levels[levelName];
    if (!levelData) return;

    World.clear(engine.world);
    Engine.clear(engine);

    // Add walls
    levelData.forEach(wall => {
        const staticBody = Bodies.rectangle(wall.x, wall.y, wall.width, wall.height, {
            isStatic: true,
            angle: wall.angle,
            render: { fillStyle: '#ffaa00' }
        });
        World.add(engine.world, staticBody);
    });

    // The Defense Door
    doorObj = Bodies.rectangle(350, 400, 20, 100, {
        isStatic: false,
        mass: 300, 
        frictionAir: 0.1,
        render: { fillStyle: '#a30000' }
    });

    // Floor boundary exactly under the door to let balls funnel onto door
    const floor = Bodies.rectangle(250, 460, 500, 20, { isStatic: true });

    World.add(engine.world, [doorObj, floor]);
    balls = [];
    isGameOver = false;
}

function startSpawner() {
    setInterval(() => {
        if (!engine || isGameOver) return;
        
        if (balls.length >= MAX_BALLS) {
            const oldBall = balls.shift();
            World.remove(engine.world, oldBall);
        }

        // Flood drop balls
        for (let i = 0; i < 2; i++) {
            const radius = Math.random() * 5 + 10;
            const x = 50 + Math.random() * 50; 
            const y = -20 - Math.random() * 20;
            const ball = Bodies.circle(x, y, radius, {
                restitution: 0.4,
                density: 0.05, 
                render: { fillStyle: ['#4287f5', '#f54242', '#42f566', '#f5d142'][Math.floor(Math.random()*4)] }
            });
            balls.push(ball);
            World.add(engine.world, ball);
        }
    }, 500); // Very frequent dropping
}

export function pushDoor(comboCount) {
    if (!doorObj || isGameOver) return;
    
    // Push the door leftwards dramatically proportional to combo items destroyed
    const force = 10 * comboCount;
    Body.applyForce(doorObj, doorObj.position, { x: -force, y: 0 });
}
