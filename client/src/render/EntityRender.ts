import { CardId } from 'shared/cards';

export default class EntityRender {

    root:Phaser.GameObjects.Container;

    constructor(scene:Phaser.Scene, x:number, y:number, type:CardId) {
        this.root = scene.add.container(x, y);
        const img = scene.add.rectangle(0, 0, 80, 120, 0xcc3333).setOrigin(0.5, 1);
        const tx = scene.add.text(0, 5, CardId[type]).setOrigin(0.5, 0);
        tx.setScale(70 / tx.width);
        this.root.add([img, tx]);
    }

    destroy() {
        this.root.destroy();
    }
}
