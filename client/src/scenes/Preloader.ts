import { MENU_KEY } from './Menu';
import OutlineSpriteFX from 'render/OutlineSpriteFx';

export default class Preloader extends Phaser.Scene {

    constructor() {
        super(PRELOADER_KEY);
    }

    create() {
        this.sound.pauseOnBlur = false;
        this.load.multiatlas('img', 'assets/multiatlas.json', 'assets/');
        this.load.pack('audioPack', 'assets/audiopack.json');
        const loadTx = this.add.text(this.scale.width / 2, this.scale.height / 2, '0%', {
            fontSize: '45px',
        }).setOrigin(0.5);
        this.load.animation('animsData', 'assets/anims.json');
        this.load.on('progress', value => {
            loadTx.setText(`${Math.floor(value * 100)}%`);
        });
        this.load.once('complete', () => {
            loadTx.destroy();
            this.onLoadComplete();
        });
        this.load.start();
    }

    onLoadComplete() {
        this.add.image(0, 0, 'img', 'background').setOrigin(0);
        this.scene.launch(MENU_KEY);
        if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
            const red = this.renderer.pipelines.add('redOutline', new OutlineSpriteFX(this.game)) as OutlineSpriteFX;
            const blue = this.renderer.pipelines.add('blueOutline', new OutlineSpriteFX(this.game)) as OutlineSpriteFX;
            red.thickness = 3;
            red.color.setFromRGB(Phaser.Display.Color.IntegerToRGB(0xff3333));
            blue.thickness = 3;
            blue.color.setFromRGB(Phaser.Display.Color.IntegerToRGB(0x3333ff));
        }
    }

}

export const PRELOADER_KEY:string = 'Preloader';
