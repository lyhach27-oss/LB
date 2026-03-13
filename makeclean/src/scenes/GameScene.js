import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // Define correct tools for each object
        this.correctTools = {
            'car': 'cream',
            'tank': 'screwdriver',
            'airplane': 'razor'
        };

        this.selectedTool = null;
        this.cleanPercentage = 0;
        this.gridSize = 20; // For tracking clean progress
        this.hitGrid = new Set();
        this.totalGridCells = 0;
        this.isWon = false;
    }

    init(data) {
        this.objectKey = data.selectedObject || 'car';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.isWon = false;
        this.hitGrid.clear();

        // 1. Layout Object
        // Add Clean image at center
        const cleanImage = this.add.image(width / 2 - 100, height / 2, `${this.objectKey}-clean`);
        this.objectScale = Math.min(
            (width - 250) / cleanImage.width, // leave room for sidebar
            (height - 100) / cleanImage.height
        );
        cleanImage.setScale(this.objectScale);

        // Calculate total grid cells based on image bounds
        const bounds = cleanImage.getBounds();
        this.objectBounds = bounds;
        const cols = Math.ceil(bounds.width / this.gridSize);
        const rows = Math.ceil(bounds.height / this.gridSize);
        this.totalGridCells = cols * rows;

        // Add RenderTexture to cover the entire screen
        this.rt = this.add.renderTexture(0, 0, width, height);

        // Draw the dirty image perfectly overlaid onto the clean image location
        const tempDirty = this.make.image({
            x: width / 2 - 100,
            y: height / 2,
            key: `${this.objectKey}-dirty`,
            add: false
        });
        tempDirty.setScale(this.objectScale);

        // RT draw maintains object transforms (like position and origin)
        this.rt.draw(tempDirty);

        // Brush (Eraser) setup
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(30, 30, 30);
        graphics.generateTexture('brush', 60, 60);
        graphics.destroy();

        // 2. Layout Tools Sidebar
        this.createSidebar(width, height);

        // 3. Interaction Logic
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerdown', this.handlePointerMove, this);

        // UI text
        const uiBg = this.add.graphics();
        uiBg.fillStyle(0x000000, 0.5);
        uiBg.fillRoundedRect(15, 15, 230, 50, 15);

        this.progressText = this.add.text(30, 25, 'Cleaned: 0%', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: '"Poppins", sans-serif',
            fontStyle: '800'
        });

        // CTA Button (hidden initially)
        this.ctaGroup = this.add.group();
        const ctaShadow = this.add.graphics();
        ctaShadow.fillStyle(0x000000, 0.3);
        ctaShadow.fillRoundedRect(width / 2 - 146, height - 96, 300, 75, 35);

        this.ctaButton = this.add.graphics();
        this.ctaButton.fillStyle(0xff007f, 1);
        this.ctaButton.fillRoundedRect(width / 2 - 150, height - 100, 300, 75, 35);

        // Invisible hit area
        this.ctaHitArea = this.add.rectangle(width / 2, height - 60, 300, 75, 0x000000, 0);
        this.ctaHitArea.setInteractive({ useHandCursor: true });

        this.ctaText = this.add.text(width / 2, height - 62, 'PLAY NOW!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: '"Fredoka One", cursive',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.ctaGroup.addMultiple([ctaShadow, this.ctaButton, this.ctaText, this.ctaHitArea]);
        this.ctaGroup.setAlpha(0);
        this.ctaHitArea.setVisible(false);

        this.ctaHitArea.on('pointerdown', () => {
            // Bounce
            this.tweens.add({
                targets: this.ctaGroup.getChildren(),
                scaleX: 0.9, scaleY: 0.9,
                yoyo: true, duration: 100,
                onComplete: () => { window.open('https://play.google.com/store', '_blank'); }
            });
        });
    }

    createSidebar(width, height) {
        const sidebarX = width - 80;
        const tools = ['chisel', 'cream', 'razor', 'scissors', 'screwdriver'];

        const sideBg = this.add.graphics();
        sideBg.fillStyle(0x222233, 0.8);
        sideBg.fillRoundedRect(width - 160, -20, 180, height + 40, 30);

        this.toolButtons = [];

        tools.forEach((tool, index) => {
            const y = 80 + index * 105;

            // Selection highlight (rounded)
            const bg = this.add.graphics();
            bg.fillStyle(0x444466, 1);
            bg.fillRoundedRect(sidebarX - 45, y - 45, 90, 90, 20);
            bg.setDepth(-1);

            const img = this.add.image(sidebarX, y, tool).setScale(0.5).setInteractive({ useHandCursor: true });

            img.on('pointerdown', () => {
                this.selectTool(tool);
            });

            this.toolButtons.push({ img, bg, tool });
        });
    }

    selectTool(selectedToolName) {
        this.selectedTool = selectedToolName;
        const width = this.cameras.main.width;

        // Reset all backgrounds
        this.toolButtons.forEach(tb => {
            tb.bg.clear();
            if (tb.tool === selectedToolName) {
                // Highlight active
                tb.bg.fillStyle(0xff007f, 1);
            } else {
                // Default background
                tb.bg.fillStyle(0x444466, 1);
            }
            tb.bg.fillRoundedRect(width - 125, tb.img.y - 45, 90, 90, 20);
        });
    }

    handlePointerMove(pointer) {
        if (!pointer.isDown || this.isWon) return;

        // Check if correct tool is selected
        if (this.selectedTool !== this.correctTools[this.objectKey]) return;

        const x = pointer.x;
        const y = pointer.y;

        // Erase using absolute screen coords!
        this.rt.erase('brush', x - 30, y - 30);

        // Some particles effect
        this.addParticleEffect(x, y);

        // Grid progress relies on bounds object
        const gridX = x - this.objectBounds.x;
        const gridY = y - this.objectBounds.y;

        if (gridX >= 0 && gridX <= this.objectBounds.width && gridY >= 0 && gridY <= this.objectBounds.height) {
            this.updateProgress(gridX, gridY);
        }
    }

    addParticleEffect(x, y) {
        // Just a simple visual feedback
        if (Math.random() > 0.3) return; // Throttling
        const p = this.add.circle(x, y, 5, 0xdddddd);
        this.tw = this.tweens.add({
            targets: p,
            y: y + 50,
            x: x + Phaser.Math.Between(-30, 30),
            alpha: 0,
            duration: 500,
            onComplete: () => p.destroy()
        });
    }

    updateProgress(x, y) {
        // Radius of brush is 30. Calculate which grid cells are covered
        const radius = 30;
        const minC = Math.max(0, Math.floor((x - radius) / this.gridSize));
        const maxC = Math.min(Math.ceil(this.objectBounds.width / this.gridSize) - 1, Math.floor((x + radius) / this.gridSize));
        const minR = Math.max(0, Math.floor((y - radius) / this.gridSize));
        const maxR = Math.min(Math.ceil(this.objectBounds.height / this.gridSize) - 1, Math.floor((y + radius) / this.gridSize));

        for (let c = minC; c <= maxC; c++) {
            for (let r = minR; r <= maxR; r++) {
                // Approximate circle check
                const cellX = c * this.gridSize + this.gridSize / 2;
                const cellY = r * this.gridSize + this.gridSize / 2;
                const dist = Phaser.Math.Distance.Between(x, y, cellX, cellY);
                if (dist <= radius) {
                    this.hitGrid.add(`${c},${r}`);
                }
            }
        }

        const percentage = Math.min(100, Math.floor((this.hitGrid.size / this.totalGridCells) * 100));
        this.progressText.setText(`Cleaned: ${percentage}%`);

        if (percentage >= 90 && !this.isWon) {
            this.triggerWin();
        }
    }

    triggerWin() {
        this.isWon = true;
        this.progressText.setText(`Cleaned: 100%`);
        // Remove dirty layer completely
        this.tweens.add({
            targets: this.rt,
            alpha: 0,
            duration: 1000
        });

        // Show CTA
        this.ctaHitArea.setVisible(true);

        this.tweens.add({
            targets: this.ctaGroup.getChildren(),
            alpha: 1,
            y: '-=20',
            duration: 1000,
            delay: 500,
            ease: 'Back.easeOut'
        });

        // Idle animation for CTA
        this.tweens.add({
            targets: this.ctaGroup.getChildren(),
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            delay: 1500
        });

        // Final particle celebration
        const emitter = this.add.particles(0, 0, 'cream', {
            x: this.cameras.main.width / 2,
            y: this.cameras.main.height / 2,
            speed: { min: -400, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 1500,
            quantity: 50,
            blendMode: 'ADD'
        });

        this.time.delayedCall(1500, () => emitter.stop());
    }
}
