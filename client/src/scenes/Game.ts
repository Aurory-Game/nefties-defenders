import { startMatch } from 'logic/RoomManager';
import { GameState } from 'shared/GameState';
import ManaBar from 'render/ManaBar';
import CardHandRender from 'render/CardHandRender';
import FieldRender from 'render/FieldRender';
import { CARDS, CardId } from 'shared/cards';
import EntityRender from 'render/EntityRender';
import { FieldPlacement, Placement } from 'logic/ClientGameplay';
import { EntityState, EntityType } from 'shared/entities';
import { MENU_KEY } from './Menu';

export default class Game extends Phaser.Scene {

    public manaBar:ManaBar;
    public handRender:CardHandRender;
    public field:FieldRender;
    public entities:Map<string, EntityRender> = new Map();
    private infoTx:Phaser.GameObjects.Text;
    private timeLeftTx:Phaser.GameObjects.Text;
    private dummies:Map<number, EntityRender> = new Map();

    constructor() {
        super(GAME_KEY);
    }

    create() {
        this.infoTx = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Connecting...')
            .setFontSize(18)
            .setOrigin(0.5)
            .setDepth(5);
        this.timeLeftTx = this.add.text(this.scale.width - 10, 10, '')
            .setFontSize(25)
            .setOrigin(1, 0)
            .setDepth(5)
            .setAlign('center');
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

    updateTimeLeft(timeLeft:number) {
        this.timeLeftTx.setText(`Time Left\n${timeLeft}s`);
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
        if (placement.type == Placement.DONE_PLACED) dummy.marker.setVisible(false);
        switch (placement.type) {
        case Placement.VALID:
        case Placement.DONE_PLACED:
        case Placement.INVALID:
            dummy.setPos(placement.tileX, placement.tileY);
            break;
        case Placement.DONE_INVALID_POS:
        case Placement.DONE_NO_MANA:
        case Placement.DONE_NOT_PLACED:
            this.removeDummy(id);
            break;
        }
        switch (placement.type) {
        case Placement.DONE_INVALID_POS:
            this.showMsg('Invalid Placement');
            break;
        case Placement.DONE_NO_MANA:
            this.showMsg('Not Enough Mana');
            break;
        }

    }

    removeDummy(id:number) {
        this.dummies.get(id)?.destroy(true);
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
            render.destroy(false);
        }
    }

    entityStateChanged(key:string, state:EntityState) {
        this.entities.get(key)?.setState(state);
    }

    projectile(attacker:string, victim:string) {
        const from = this.entities.get(attacker);
        const to = this.entities.get(victim);
        if (from && to) {
            from.playAttackSfx?.();
            const src = from.root.getBounds();
            const target = to.root.getBounds();
            const obj = this.add.circle(src.centerX, src.centerY, 6, 0xee2222);
            obj.depth = 2;
            this.tweens.add({
                targets: obj,
                x: target.centerX,
                y: target.centerY,
                duration: Phaser.Math.Distance.Between(
                    src.centerX, src.centerY,
                    target.centerX, target.centerY
                ) * 3,
                onUpdate: (tween:Phaser.Tweens.Tween) => {
                    if (to.root) {
                        to.root.getBounds(target);
                        tween.updateTo('x', target.centerX, false);
                        tween.updateTo('y', target.centerY, false);
                    }
                },
                onComplete: () => obj.destroy()
            });
        }
    }

    showMsg(tx:string, isError:boolean = true) {
        const text = this.add.text(this.scale.width / 2, this.scale.height * 0.33, tx, {
            fontSize: '28px',
            color: isError ? '#cc3333' : '#33cc33',
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

    gameOver(result:boolean | null) {
        const message = result == null ? 'A Tie!' : (result ? 'You Won!' : 'You lost!');
        this.showMsg(message, false);
        this.time.delayedCall(3000, () => this.scene.start(MENU_KEY, { message }));
    }

}

export const GAME_KEY:string = 'Game';
export const WIDTH:number = 723;
export const HEIGHT:number = 1280;
