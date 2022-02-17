import { GAME_KEY } from './Game';

export default class Menu extends Phaser.Scene {

    constructor() {
        super(MENU_KEY);
    }

    create(data:{message:string}) {
        this.add.text(this.scale.width / 2, this.scale.height / 2,
            'Play A Round', BUTTON_TEXT_STYLE)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on(Phaser.Input.Events.POINTER_UP, () => this.scene.start(GAME_KEY));

        if (data?.message) {
            this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, data.message)
                .setFontSize(18)
                .setOrigin(0.5);
        }
    }

}

export const MENU_KEY:string = 'Menu';

const BUTTON_TEXT_STYLE:Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#cccccc',
    stroke: '#222222',
    fontSize: '32px',
    backgroundColor: '#113333',
    // @ts-expect-error wrong Phaser's types
    padding: 10,
};
