import { FIELD_HEIGHT, FIELD_WIDTH } from 'shared/constants';
import { HEIGHT, WIDTH } from 'scenes/Game';

export default class FieldRender {

    root:Phaser.GameObjects.Container;
    background:Phaser.GameObjects.Rectangle;

    constructor(public scene:Phaser.Scene) {
        this.root = scene.add.container((WIDTH - FIELD_WIDTH) / 2, (HEIGHT * (1 - 0.17) - FIELD_HEIGHT) / 2);
        this.background = scene.add.rectangle(0, 0, FIELD_WIDTH, FIELD_HEIGHT, 0x113311)
            .setOrigin(0, 0);

        this.root.add(this.background);
    }

}
