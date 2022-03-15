import { EntityType } from 'shared/entities';
import { FIELD_TILE_SIZE, TIMESTEP } from 'shared/constants';
import Interpolator from 'util/Interpolator';

export default class EntityRender {

    root:Phaser.GameObjects.Container;
    marker:Phaser.GameObjects.Graphics;
    interpolator:Interpolator;

    constructor(scene:Phaser.Scene, type:EntityType) {
        this.root = scene.add.container(0, 0);
        const img = scene.add.rectangle(0, 10, 40, 60, 0xcc3333).setOrigin(0.5, 1);
        const tx = scene.add.text(0, 5, EntityType[type]).setOrigin(0.5, 0);
        tx.setScale(70 / tx.width);
        this.root.add([img, tx]);
        this.interpolator = new Interpolator(TIMESTEP * 2, TIMESTEP, 2);
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
