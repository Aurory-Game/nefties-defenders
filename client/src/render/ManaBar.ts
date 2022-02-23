import { MANA_MAX, MANA_START } from 'shared/constants';
import { HEIGHT, WIDTH } from 'src/scenes/Game';

export default class ManaBar {

    scene:Phaser.Scene;
    root:Phaser.GameObjects.Container;
    slots:Array<Phaser.GameObjects.Rectangle> = [];

    constructor(scene:Phaser.Scene) {
        this.scene = scene;
        const width = WIDTH * 0.8;
        const height = HEIGHT * 0.07;
        const x = WIDTH * 0.1;
        const y = HEIGHT - height;
        this.root = scene.add.container(x, y).setDepth(4);
        const background = scene.add.rectangle(0, 0, width, height, 0x331111).setOrigin(0, 0);

        const barWidth = (width / MANA_MAX);
        for (let i = 0; i < MANA_MAX; i++) {
            this.slots.push(scene.add.rectangle(
                i * barWidth + barWidth * 0.05, height * 0.05,
                barWidth * 0.9, height * 0.9, 0x6666cc).setOrigin(0, 0).setVisible(i < MANA_START)
            );
        }
        this.root.add([background, ...this.slots]);
    }

    setMana(mana:number) {
        for (let i = 0; i < MANA_MAX; i++) this.slots[i].visible = i < mana;
    }

}
