import Phaser from 'phaser';

export default class SelectScene extends Phaser.Scene {
    constructor() {
        super('SelectScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, 80, 'Makeover Master', {
            fontSize: '56px',
            fill: '#ffffff',
            fontFamily: '"Fredoka One", cursive',
            stroke: '#ff007f',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 10, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, 160, 'Choose an object to clean!', {
            fontSize: '28px',
            fill: '#ffdd00',
            fontFamily: '"Poppins", sans-serif',
            fontStyle: '800',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const options = [
            { key: 'car', image: 'car-dirty', x: width / 4, y: height / 2 },
            { key: 'tank', image: 'tank-dirty', x: width / 2, y: height / 2 },
            { key: 'airplane', image: 'airplane-dirty', x: width * 3 / 4, y: height / 2 }
        ];

        options.forEach(opt => {
            const yOffset = 40;
            const img = this.add.image(opt.x, opt.y + yOffset, opt.image);
            
            const targetSize = 250;
            opt.scale = Math.min(targetSize / img.width, targetSize / img.height);
            img.setScale(opt.scale);
            
            img.setInteractive({ useHandCursor: true });

            // Hover effect
            this.tweens.add({
                targets: img,
                y: opt.y + yOffset - 15,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Math.random() * 500
            });

            img.on('pointerover', () => {
                this.tweens.add({ targets: img, scaleX: opt.scale * 1.15, scaleY: opt.scale * 1.15, duration: 200 });
            });
            img.on('pointerout', () => {
                this.tweens.add({ targets: img, scaleX: opt.scale, scaleY: opt.scale, duration: 200 });
            });

            // Click to start
            img.on('pointerdown', () => {
                this.scene.start('GameScene', { selectedObject: opt.key });
            });

            this.add.text(opt.x, opt.y + yOffset + 140, opt.key.toUpperCase(), {
                fontSize: '28px', fill: '#ffffff', fontFamily: '"Fredoka One", cursive',
                stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5);
        });
    }
}
