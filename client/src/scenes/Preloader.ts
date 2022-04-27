import { MENU_KEY } from './Menu';

export default class Preloader extends Phaser.Scene {

    constructor() {
        super(PRELOADER_KEY);
    }

    create() {
        this.load.multiatlas('anims', 'assets/chars/multiatlas.json', 'assets/chars/');
        const loadTx = this.add.text(this.scale.width / 2, this.scale.height / 2, '0%', {
            fontSize: '45px',
        }).setOrigin(0.5);
        this.load.animation('animsData', 'assets/chars/anims.json');
        this.load.on('progress', value => {
            loadTx.setText(`${Math.floor(value * 100)}%`);
        });
        this.load.once('complete', () => this.onLoadComplete());
        this.load.start();
    }

    onLoadComplete() {
        this.scene.start(MENU_KEY);
    }

}

export const PRELOADER_KEY:string = 'Preloader';
