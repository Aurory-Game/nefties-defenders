export default class Menu extends Phaser.Scene {

    constructor() {
        super('Menu');
    }

    create() {
        this.add.text(this.scale.width / 2, this.scale.height / 2,
            'Hello World', BUTTON_TEXT_STYLE)
            .setOrigin(0.5);
    }

}
const BUTTON_TEXT_STYLE:Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#cccccc',
    stroke: '#222222',
    fontSize: '32px',
    backgroundColor: '#113333',
    // @ts-ignore
    padding: 10,
};
