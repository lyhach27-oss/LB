import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import SelectScene from './scenes/SelectScene';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, SelectScene, GameScene]
};

const game = new Phaser.Game(config);
