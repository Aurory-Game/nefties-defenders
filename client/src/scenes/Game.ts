import { startMatch } from 'logic/RoomManager';
import { GAME_STATE } from 'shared/GAME_STATE';
import ManaBar from 'render/ManaBar';
import CardHandRender from 'render/CardHandRender';
import FieldRender from 'render/FieldRender';
import { CardId } from 'shared/cards';
import EntityRender from 'render/EntityRender';
import { FieldPlacement, PLACEMENT } from 'logic/ClientGameplay';

export default class Game extends Phaser.Scene {

    public manaBar:ManaBar;
    public handRender:CardHandRender;
    public field:FieldRender;
    private infoTx:Phaser.GameObjects.Text;
    private entities:Map<string, EntityRender> = new Map();
    private dummies:Map<number, EntityRender> = new Map();

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

    updateDummy(id:number, type:CardId, placement:FieldPlacement) {
        if (!this.dummies.has(id)) {
            const dummy = new EntityRender(this, type);
            dummy.addMarker();
            this.dummies.set(id, dummy);
            this.field.root.add(dummy.root);
        }
        const dummy = this.dummies.get(id);
        dummy.root.setVisible(placement.type != PLACEMENT.BELOW_LINE);
        if (placement.type == PLACEMENT.PLACED) dummy.marker.setVisible(false);
        switch (placement.type) {
        case PLACEMENT.VALID:
        case PLACEMENT.PLACED:
            dummy.updatePos(placement);
            break;
        case PLACEMENT.ERR_INVALID_POS:
        case PLACEMENT.ERR_NO_MANA:
            this.removeDummy(id);
            break;
        }
        // TODO error msg.
    }

    removeDummy(id:number) {
        this.dummies.get(id)?.destroy();
        this.dummies.delete(id);
    }

    addEntity(key:string, pos:{tileX:number, tileY:number}, type:CardId) {
        const render = new EntityRender(this, type);
        this.entities.set(key, render);
        this.field.root.add(render.root);
        render.updatePos(pos);
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
