import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load Models
        this.load.image('airplane-clean', 'assets/model/airplane-clean.png');
        this.load.image('airplane-dirty', 'assets/model/airplane-dirty.png');
        this.load.image('car-clean', 'assets/model/car-clean.png');
        this.load.image('car-dirty', 'assets/model/car-dirty.png');
        this.load.image('tank-clean', 'assets/model/tank-clean.png');
        this.load.image('tank-dirty', 'assets/model/tank-dirty.png');

        // Load Tools
        this.load.image('chisel', 'assets/tools/chisel-icon.png');
        this.load.image('cream', 'assets/tools/cream-icon.png');
        this.load.image('razor', 'assets/tools/razor-icon.png');
        this.load.image('scissors', 'assets/tools/scissors-icon.png');
        this.load.image('screwdriver', 'assets/tools/screwdriver-icon.png');
    }

    create() {
        this.scene.start('SelectScene');
    }
}
