import { CardId } from 'shared/cards';
import { FIELD_TILE_SIZE } from 'shared/constants';

export default class EntityRender {

    root:Phaser.GameObjects.Container;
    marker:Phaser.GameObjects.Graphics;

    constructor(scene:Phaser.Scene, type:CardId) {
        this.root = scene.add.container(0, 0);
        const img = scene.add.rectangle(0, 10, 40, 60, 0xcc3333).setOrigin(0.5, 1);
        const tx = scene.add.text(0, 5, CardId[type]).setOrigin(0.5, 0);
        tx.setScale(70 / tx.width);
        this.root.add([img, tx]);
    }

    addMarker() {
        this.marker = this.root.scene.add.graphics()
            .lineStyle(4, 0xaaaaaa, 0.5)
            .fillStyle(0xaaaaaa, 0.25)
            .fillRoundedRect(-FIELD_TILE_SIZE / 2, -FIELD_TILE_SIZE / 2, FIELD_TILE_SIZE, FIELD_TILE_SIZE, 5)
            .strokeRoundedRect(-FIELD_TILE_SIZE / 2, -FIELD_TILE_SIZE / 2, FIELD_TILE_SIZE, FIELD_TILE_SIZE, 5);
        this.root.add(this.marker);
    }

    updatePos(pos:{tileX:number, tileY:number}) {
        this.root.setPosition(pos.tileX * FIELD_TILE_SIZE, pos.tileY * FIELD_TILE_SIZE);
    }

    destroy() {
        this.root.destroy();
    }
}
