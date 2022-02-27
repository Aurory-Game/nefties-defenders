import { CARDS, CardId } from 'shared/cards';
export default class CardRender {

    root:Phaser.GameObjects.Container;
    tx:Phaser.GameObjects.Text;
    mp:Phaser.GameObjects.Text;

    constructor(public scene:Phaser.Scene, public width:number, public height:number) {
        this.root = scene.add.container(0, 0).setDepth(5);
        const background = scene.add.rectangle(0, 0, width, height, 0x333333).setOrigin(0, 0);
        this.tx = scene.add.text(width * 0.05, width * 0.05, '');
        this.mp = scene.add.text(width / 2, height, '').setOrigin(0.5, 1);

        this.root.add([background, this.tx, this.mp]);
    }

    set(id:CardId) {
        this.tx.setText(CardId[id]);
        this.tx.setScale((this.width * 0.9) / this.tx.width);
        this.mp.setText(String(CARDS[id].manaCost));
    }

}
