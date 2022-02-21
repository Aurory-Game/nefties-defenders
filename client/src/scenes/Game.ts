import { startMatch } from 'src/logic/RoomManager';
import { GAME_STATE } from 'shared/GAME_STATE';

export default class Game extends Phaser.Scene {

    private infoTx:Phaser.GameObjects.Text;

    constructor() {
        super(GAME_KEY);
    }

    create() {
        this.infoTx = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Connecting...')
            .setFontSize(18)
            .setOrigin(0.5);
        startMatch(this);
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
