import { startMatch } from 'logic/RoomManager';
import { GAME_STATE } from 'shared/GAME_STATE';
import ManaBar from 'render/ManaBar';
import CardHandRender from 'render/CardHandRender';
import FieldRender from 'render/FieldRender';
import { CardId } from 'shared/cards';
import EntityRender from 'render/EntityRender';

export default class Game extends Phaser.Scene {

    public manaBar:ManaBar;
    public handRender:CardHandRender;
    public field:FieldRender;
    private infoTx:Phaser.GameObjects.Text;
    private entities:Map<string, EntityRender> = new Map();

    constructor() {
        super(GAME_KEY);
    }

    create() {
        this.infoTx = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Connecting...')
            .setFontSize(18)
            .setOrigin(0.5)
            .setDepth(5);
        startMatch(this);
        this.manaBar = new ManaBar(this);
        this.handRender = new CardHandRender(this);
        this.field = new FieldRender(this);
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

    addEntity(key:string, x:number, y:number, type:CardId) {
        const render = new EntityRender(this, x, y, type);
        this.entities.set(key, render);
        this.field.root.add(render.root);
    }

    removeEntity(key:string) {
        const render = this.entities.get(key);
        if (render) {
            this.entities.delete(key);
            render.destroy();
        }
    }

}

export const GAME_KEY:string = 'Game';
export const WIDTH:number = 960;
export const HEIGHT:number = 1280;
