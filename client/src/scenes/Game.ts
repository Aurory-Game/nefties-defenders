import { startMatch } from 'logic/RoomManager';
import { GameState } from 'shared/GameState';
import ManaBar from 'render/ManaBar';
import CardHandRender from 'render/CardHandRender';
import FieldRender from 'render/FieldRender';
import { CARDS, CardId } from 'shared/cards';
import EntityRender from 'render/EntityRender';
import { FieldPlacement, Placement } from 'logic/ClientGameplay';
import { EntityState, EntityType } from 'shared/entities';

export default class Game extends Phaser.Scene {

    public manaBar:ManaBar;
    public handRender:CardHandRender;
    public field:FieldRender;
    public entities:Map<string, EntityRender> = new Map();
    private infoTx:Phaser.GameObjects.Text;
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
        for (const entity of this.entities.values()) {
            entity.update(time);
        }
    }

    updateText(gameState:GameState, secondsLeft:number) {
        switch (gameState) {
        case GameState.WAITING:
            this.infoTx.setText('WAITING FOR MORE PLAYERS').setVisible(true);
            break;
        case GameState.STARTING:
            this.infoTx.setText(`GAME STARTING IN ${secondsLeft}`).setVisible(true);
            break;
        case GameState.PLAYING:
            this.infoTx.setVisible(false);
            break;
        case GameState.DONE:
            this.infoTx.setText('GAME OVER').setVisible(true);
            break;
        }
    }

    updateDummy(id:number, type:CardId, placement:FieldPlacement) {
        if (!this.dummies.has(id)) {
            const dummy = new EntityRender(this, CARDS[type].entityType, true);
            dummy.addMarker();
            this.dummies.set(id, dummy);
            this.field.root.add(dummy.root);
        }
        const dummy = this.dummies.get(id);
        dummy.root.setVisible(placement.type != Placement.BELOW_LINE);
        if (placement.type == Placement.PLACED) dummy.marker.setVisible(false);
        switch (placement.type) {
        case Placement.VALID:
        case Placement.PLACED:
        case Placement.INVALID:
            dummy.setPos(placement.tileX, placement.tileY);
            break;
        case Placement.ERR_INVALID_POS:
        case Placement.ERR_NO_MANA:
            this.removeDummy(id);
            break;
        }
        switch (placement.type) {
        case Placement.ERR_INVALID_POS:
            this.showError('Invalid Placement');
            break;
        case Placement.ERR_NO_MANA:
            this.showError('Not Enough Mana');
            break;
        }

    }

    removeDummy(id:number) {
        this.dummies.get(id)?.destroy();
        this.dummies.delete(id);
    }

    addEntity(key:string, pos:{tileX:number, tileY:number}, type:EntityType, isOurs:boolean) {
        const render = new EntityRender(this, type, isOurs);
        this.entities.set(key, render);
        this.field.root.add(render.root);
        render.setPos(pos.tileX, pos.tileY);
    }

    removeEntity(key:string) {
        // TODO handle interpolation delay.
        const render = this.entities.get(key);
        if (render) {
            this.entities.delete(key);
            render.destroy();
        }
    }

    entityStateChanged(key:string, state:EntityState) {
        this.entities.get(key)?.setState(state);
    }

    showError(tx:string) {
        const text = this.add.text(this.scale.width / 2, this.scale.height * 0.33, tx, {
            fontSize: '28px',
            color: '#cc3333',
            fontStyle: 'bold',
        }).setOrigin(0.5)
            .setDepth(6)
            .setAlpha(0);
        this.tweens.timeline({
            targets: text,
            onComplete: () => text.destroy(),
            tweens: [
                {
                    alpha: 1,
                    y: '-=30',
                    duration: 200,
                    ease: 'Quad.easeOut'
                },
                {
                    y: '-=10',
                    duration: 2000,
                },
                {
                    alpha: 0,
                    offset: '-=200',
                    duration: 200,
                    ease: 'Quad.easeIn'
                }
            ]
        });
    }

}

export const GAME_KEY:string = 'Game';
export const WIDTH:number = 960;
export const HEIGHT:number = 1280;
