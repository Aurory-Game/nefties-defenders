import { ENTITIES, EntityState, EntityType } from 'shared/entities';
import { FIELD_TILES_HEIGHT, FIELD_TILE_SIZE, TIMESTEP } from 'shared/constants';
import Interpolator from 'util/Interpolator';

export default class EntityRender {

    root:Phaser.GameObjects.Container;
    marker:Phaser.GameObjects.Rectangle;
    stateTx:Phaser.GameObjects.Text;
    hitpointsTx:Phaser.GameObjects.Text;
    interpolator:Interpolator;
    hitpointsInterpolator:Interpolator;
    readonly maxHitpoints:number;
    sprite:Phaser.GameObjects.Sprite;
    skin:string;
    dir:string;
    state:EntityState;

    constructor(scene:Phaser.Scene, type:EntityType, private isOurs:boolean) {
        this.root = scene.add.container(0, 0);
        const data = ENTITIES[type];
        const size = data.size.size * FIELD_TILE_SIZE;
        const color = isOurs ? 0x3333cc : 0xcc3333;
        const color2 = isOurs ? 0x0000ff : 0xff0000;
        if (data.skin) {
            this.skin = data.skin;
            this.sprite = scene.add.sprite(0, 0, 'anims');
            this.dir = isOurs ? '0' : '4';
            this.root.add(this.sprite);
            this.sprite.setPipeline(isOurs ? 'blueOutline' : 'redOutline');
            this.sprite.setFXPadding(4);
        } else if (data.size.t == 'square') {
            this.root.add(scene.add.rectangle(0, 0, size, size, color));
        } else {
            const tall = scene.add.rectangle(0, size * 0.5, size * 2, size * 3, color).setOrigin(0.5, 1);
            const circ = scene.add.circle(0, 0, size / 2, color2);
            this.root.add([tall, circ]);
        }
        if (!this.sprite) {
            const tx = scene.add.text(0, 5, EntityType[type]).setOrigin(0.5, 0).setAlpha(0.8);
            tx.setScale(70 / tx.width);
            this.stateTx = scene.add.text(0, -10, EntityState[EntityState.SPAWNING]).setOrigin(0.5, 0);
            this.root.add([tx, this.stateTx]);
        }
        this.hitpointsTx = scene.add.text(0, -25, '').setOrigin(0.5, 0);
        this.root.add(this.hitpointsTx);
        if (data.walkSpeed > 0) this.interpolator = new Interpolator(TIMESTEP * 2, TIMESTEP, 2);
        else this.interpolator = null;
        this.hitpointsInterpolator = new Interpolator(TIMESTEP * 2, TIMESTEP, 2);
        this.hitpointsInterpolator.add(0, data.hitpoints);
        this.maxHitpoints = data.hitpoints;
    }

    addMarker() {
        this.marker = this.root.scene.add.rectangle(0, 0, FIELD_TILE_SIZE, FIELD_TILE_SIZE, 0xaaaaaa, 0.25);
        this.marker.setStrokeStyle(4, 0xaaaaaa, 0.5);
        this.root.add(this.marker);
        this.sprite?.setTexture('anims', `${this.skin}-Idle4-0.png`);
    }

    update(time:number) {
        if (this.interpolator) {
            const pos = this.interpolator.getAtTime(time);
            this.setPos(pos.x, pos.y);
            if (pos.angle) {
                // Normalize in 45 deg steps.
                const adjusted = (pos.angle + Math.PI * 2) % (Math.PI * 2);
                const dir = String(Math.floor(adjusted / (Math.PI / 4) + 2.5) % 8);
                if (this.dir != dir) {
                    this.dir = dir;
                    this.setState(this.state);
                }
            }
        }
        const hp = Math.round((this.hitpointsInterpolator.getAtTime(time).x / this.maxHitpoints) * 100);
        this.hitpointsTx.setText(`HP: ${hp}%`);
    }

    setPos(tileX:number, tileY:number) {
        this.root.setPosition(tileX * FIELD_TILE_SIZE, tileY * FIELD_TILE_SIZE);
        this.root.setDepth(tileY / FIELD_TILES_HEIGHT);
    }

    setState(state:EntityState) {
        this.state = state;
        this.stateTx?.setText(EntityState[state]);
        if (this.sprite) {
            switch (state) {
            case EntityState.SPAWNING:
                this.sprite.play(`${this.skin}-Spawn${this.dir}`);
                break;
            case EntityState.ATTACKING:
                // TODO rotate to attacking target. Needed for ranged units that won't move towards them,
                // so our angle doesn't change. Will need support from server.
                this.sprite.play(`${this.skin}-Attack${this.dir}`);
                break;
            case EntityState.MOVING:
                this.sprite.play(`${this.skin}-Move${this.dir}`);
                break;
            case EntityState.IDLE:
                this.sprite.play(`${this.skin}-Idle4`);
                break;
            }
        }
    }

    destroy(instant:boolean) {
        if (!instant && this.sprite) {
            const num = this.isOurs ? 0 : 4;
            this.sprite.play(`${this.skin}-Death${num}`);
            this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.root.destroy());
        } else {
            this.root.destroy();
        }
    }
}
