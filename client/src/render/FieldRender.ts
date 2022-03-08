import { FIELD_MAP_DATA, FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, FIELD_TILE_SIZE } from 'shared/constants';
import { HEIGHT, WIDTH } from 'scenes/Game';

export default class FieldRender {

    root:Phaser.GameObjects.Container;
    background:Phaser.Tilemaps.TilemapLayer;

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

}
