import * as Phaser from 'phaser';
import Game from './scenes/Game';
import Menu from './scenes/Menu';

export class CrPrototype {

    public phaser: Phaser.Game;

    constructor() {
        this.phaser = new Phaser.Game({
            backgroundColor: 0x636363,
            scale: {
                width: 960,
                height: 1280,
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            type: Phaser.AUTO,
            scene: [Menu, Game],
        });
    }
}
