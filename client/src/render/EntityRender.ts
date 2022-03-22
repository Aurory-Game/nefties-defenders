import { ENTITIES, EntityState, EntityType } from 'shared/entities';
import { FIELD_TILE_SIZE, TIMESTEP } from 'shared/constants';
import Interpolator from 'util/Interpolator';

export default class EntityRender {

    root:Phaser.GameObjects.Container;
    marker:Phaser.GameObjects.Graphics;
    stateTx:Phaser.GameObjects.Text;
    hitpointsTx:Phaser.GameObjects.Text;
    interpolator:Interpolator;
    hitpointsInterpolator:Interpolator;
    readonly maxHitpoints:number;

    constructor(scene:Phaser.Scene, type:EntityType, isOurs:boolean) {
        this.root = scene.add.container(0, 0);
        const data = ENTITIES[type];
        const size = data.size.size * FIELD_TILE_SIZE;
        const color = isOurs ? 0x3333cc : 0xcc3333;
        const color2 = isOurs ? 0x0000ff : 0xff0000;
        if (data.size.t == 'square') {
            this.root.add(scene.add.rectangle(0, 0, size, size, color));
        } else {
            const tall = scene.add.rectangle(0, size * 0.5, size * 2, size * 3, color).setOrigin(0.5, 1);
            const circ = scene.add.circle(0, 0, size / 2, color2);
            this.root.add([tall, circ]);
        }
        const tx = scene.add.text(0, 5, EntityType[type]).setOrigin(0.5, 0).setAlpha(0.8);
        tx.setScale(70 / tx.width);
        this.stateTx = scene.add.text(0, -10, EntityState[EntityState.SPAWNING]).setOrigin(0.5, 0);
        this.hitpointsTx = scene.add.text(0, -25, '').setOrigin(0.5, 0);
        this.root.add([tx, this.stateTx, this.hitpointsTx]);
        if (data.walkSpeed > 0) this.interpolator = new Interpolator(TIMESTEP * 2, TIMESTEP, 2);
        else this.interpolator = null;
        this.hitpointsInterpolator = new Interpolator(TIMESTEP * 2, TIMESTEP, 2);
        this.hitpointsInterpolator.add(0, data.hitpoints);
        this.maxHitpoints = data.hitpoints;
    }

    addMarker() {
        this.marker = this.root.scene.add.graphics()
            .lineStyle(4, 0xaaaaaa, 0.5)
            .fillStyle(0xaaaaaa, 0.25)
            .fillRoundedRect(-FIELD_TILE_SIZE / 2, -FIELD_TILE_SIZE / 2, FIELD_TILE_SIZE, FIELD_TILE_SIZE, 5)
            .strokeRoundedRect(-FIELD_TILE_SIZE / 2, -FIELD_TILE_SIZE / 2, FIELD_TILE_SIZE, FIELD_TILE_SIZE, 5);
        this.root.add(this.marker);
    }

    update(time:number) {
        if (this.interpolator) {
            const pos = this.interpolator.getAtTime(time);
            this.setPos(pos.x, pos.y);
        }
        const hp = Math.round((this.hitpointsInterpolator.getAtTime(time).x / this.maxHitpoints) * 100);
        this.hitpointsTx.setText(`HP: ${hp}%`);
    }

    setPos(tileX:number, tileY:number) {
        this.root.setPosition(tileX * FIELD_TILE_SIZE, tileY * FIELD_TILE_SIZE);
    }

    setState(state:EntityState) {
        this.stateTx.setText(EntityState[state]);
    }

    destroy() {
        this.root.destroy();
    }
}
