import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, FIELD_TILE_SIZE } from 'shared/constants';
import { HEIGHT, WIDTH } from 'scenes/Game';

export default class FieldRender {

    root:Phaser.GameObjects.Container;
    background:Phaser.GameObjects.Rectangle;

    constructor(public scene:Phaser.Scene) {
        const availableWidth = WIDTH; // TODO responsive scaling.
        const availableHeight = HEIGHT * (1 - 0.17);
        const minPadding = 30;
        const w = FIELD_TILES_WIDTH * FIELD_TILE_SIZE;
        const h = FIELD_TILES_HEIGHT * FIELD_TILE_SIZE;
        const scale = Math.min(availableWidth / (w + minPadding), availableHeight / (h + minPadding));

        this.root = scene.add.container((availableWidth - w * scale) / 2, (availableHeight - h * scale) / 2)
            .setScale(scale);
        this.background = scene.add.rectangle(0, 0, w, h, 0x113311)
            .setOrigin(0, 0);

        this.root.add(this.background);
    }

}
