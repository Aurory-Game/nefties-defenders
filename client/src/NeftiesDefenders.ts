import * as Phaser from 'phaser';
import Preloader from 'scenes/Preloader';
import Game, { HEIGHT, WIDTH } from './scenes/Game';
import Menu from './scenes/Menu';

export class NeftiesDefenders {

    public phaser:Phaser.Game;

    constructor() {
        this.phaser = new Phaser.Game({
            backgroundColor: 0x636363,
            scale: {
                width: WIDTH,
                height: HEIGHT,
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            type: Phaser.AUTO,
            scene: [Preloader, Menu, Game],
        });
    }
}
