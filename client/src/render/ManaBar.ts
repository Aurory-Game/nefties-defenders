import { MANA_MAX, MANA_START, TIMESTEP } from 'shared/constants';
import { HEIGHT, WIDTH } from 'scenes/Game';
import Interpolator from 'util/Interpolator';

export default class ManaBar {

    scene:Phaser.Scene;
    root:Phaser.GameObjects.Container;
    interpolator:Interpolator = new Interpolator(TIMESTEP);
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

    update(time:number) {
        const mana = this.interpolator.getAtTime(time)?.x;
        if (mana) for (let i = 0; i < MANA_MAX; i++) {
            const visible = i < mana;
            this.slots[i].visible = visible;
            if (visible && i == (mana | 0)) {
                this.slots[i].scaleX = mana - i;
                this.slots[i].alpha = 0.5 + 0.5 * (mana - i);
            } else {
                this.slots[i].scaleX = 1;
                this.slots[i].alpha = 1;
            }
        }
    }

}
