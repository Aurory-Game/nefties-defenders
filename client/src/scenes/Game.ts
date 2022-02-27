import { startMatch } from 'src/logic/RoomManager';
import { GAME_STATE } from 'shared/GAME_STATE';
import ManaBar from 'src/render/ManaBar';
import CardHandRender from 'src/render/CardHandRender';

export default class Game extends Phaser.Scene {

    public manaBar:ManaBar;
    public handRender:CardHandRender;
    private infoTx:Phaser.GameObjects.Text;

    constructor() {
        super(GAME_KEY);
    }

    create() {
        this.infoTx = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Connecting...')
            .setFontSize(18)
            .setOrigin(0.5);
        startMatch(this);
        this.manaBar = new ManaBar(this);
        this.handRender = new CardHandRender(this);
    }

    /** Custom update function called by `RoomManager` server-synced time. */
    render(time:number) {
        this.manaBar.update(time);
    }

    updateText(gameState:GAME_STATE, secondsLeft:number) {
        switch (gameState) {
        case GAME_STATE.WAITING:
            this.infoTx.setText('WAITING FOR MORE PLAYERS').setVisible(true);
            break;
        case GAME_STATE.STARTING:
            this.infoTx.setText(`GAME STARTING IN ${secondsLeft}`).setVisible(true);
            break;
        case GAME_STATE.PLAYING:
            this.infoTx.setVisible(false);
            break;
        case GAME_STATE.DONE:
            this.infoTx.setText('GAME OVER').setVisible(true);
            break;
        }
    }

}

export const GAME_KEY:string = 'Game';
export const WIDTH:number = 960;
export const HEIGHT:number = 1280;
