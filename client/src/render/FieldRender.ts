import { FIELD_MAP_DATA, FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, FIELD_TILE_SIZE } from 'shared/constants';
import { HEIGHT, WIDTH } from 'scenes/Game';
import { InfluenceRange } from 'shared/entities';

export default class FieldRender {

    root:Phaser.GameObjects.Container;
    background:Phaser.Tilemaps.TilemapLayer;
    influence:Phaser.GameObjects.Graphics;
    influenceRt:Phaser.GameObjects.RenderTexture;

    constructor(public scene:Phaser.Scene) {
        const availableWidth = WIDTH; // TODO responsive scaling.
        const availableHeight = HEIGHT * (1 - 0.17);
        const minPadding = 30;
        const w = FIELD_TILES_WIDTH * FIELD_TILE_SIZE;
        const h = FIELD_TILES_HEIGHT * FIELD_TILE_SIZE;
        const scale = Math.min(availableWidth / (w + minPadding), availableHeight / (h + minPadding));

        this.root = scene.add.container((availableWidth - w * scale) / 2, (availableHeight - h * scale) / 2)
            .setScale(scale).setDepth(1);
        this.background = this.makeTilemap().layers[0].tilemapLayer;
        this.background.setScale(scale).setPosition(this.root.x, this.root.y);
        this.influence = scene.make.graphics({fillStyle: { color: 0xdd2222 }}).setScale(scale);
        this.influenceRt = scene.add.renderTexture(this.root.x, this.root.y,
            this.background.displayWidth, this.background.displayHeight).setDepth(10).setAlpha(0).setOrigin(0);
    }

    makeTilemap() {
        this.scene.add.graphics()
            .fillStyle(0x113311).fillRect(0, 0, FIELD_TILE_SIZE + 2, FIELD_TILE_SIZE + 2)
            .fillStyle(0x111166).fillRect(FIELD_TILE_SIZE + 2, 0, FIELD_TILE_SIZE + 2, FIELD_TILE_SIZE + 2)
            .fillStyle(0x663311).fillRect(2 * (FIELD_TILE_SIZE + 2), 0, FIELD_TILE_SIZE + 2, FIELD_TILE_SIZE + 2)
            .generateTexture('mapTiles', 3 * (FIELD_TILE_SIZE + 2), FIELD_TILE_SIZE + 2).destroy();
        const map = this.scene.make.tilemap({
            data: FIELD_MAP_DATA,
            width: FIELD_TILES_WIDTH,
            height: FIELD_TILES_HEIGHT,
            tileWidth: FIELD_TILE_SIZE,
            tileHeight: FIELD_TILE_SIZE
        });
        const tileset = map.addTilesetImage('mapTiles', 'mapTiles', FIELD_TILE_SIZE, FIELD_TILE_SIZE, 1, 2);
        map.createLayer(0, tileset, 0, 0);
        return map;
    }

    redrawInfluence(infs:IterableIterator<InfluenceRange>) {
        this.influence.clear();
        this.influenceRt.clear();
        for (const inf of infs) {
            this.influence.fillRect(inf.x1 * FIELD_TILE_SIZE, inf.y1 * FIELD_TILE_SIZE,
                (inf.x2 - inf.x1) * FIELD_TILE_SIZE, (inf.y2 - inf.y1) * FIELD_TILE_SIZE);
        }
        this.influenceRt.draw(this.influence);
    }

    setInfluenceVisible(val:boolean) {
        const targetAlpha = val ? 0.4 : 0;
        const tweens = this.scene.tweens.getTweensOf(this.influence);
        if (tweens.length > 0 && tweens[0].data[0].end == targetAlpha) return;
        if (tweens.length > 0) this.scene.tweens.killTweensOf(this.influenceRt);
        this.scene.tweens.add({
            targets: this.influenceRt,
            alpha: targetAlpha,
            duration: 400,
            ease: Phaser.Math.Easing.Quadratic.Out
        });
    }

}
