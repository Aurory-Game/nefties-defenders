import { Room } from 'colyseus.js';
import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, FIELD_TILE_SIZE } from 'shared/constants';
import { MessageKind, sendMessage } from 'shared/messages';
import Game from 'scenes/Game';
import CardHand from './CardHand';
import { EntitySync } from 'schema/EntitySync';

export default class ClientGameplay {

    hand:CardHand;
    public isFlipped:boolean = false;

    constructor(private room:Room, private game:Game) {
        this.game.input.enabled = false;
        this.hand = new CardHand(game.handRender);
        this.hand.onRequestConfirmed = id => game.removeDummy(id);
        this.game.handRender.onCardDragMove = this.onCardDragMove.bind(this);
    }

    onCardDragMove(index:number, x:number, y:number, isDone:boolean):boolean {
        const p = this.game.field.background.getLocalPoint(x, y);
        const placement = this.getFieldPlacement(p);
        const id = this.hand.getNextId();
        // TODO display invalid placement shape.
        // TODO mana prediction.
        if (isDone) {
            // TODO check mana, display error if low, don't send request.
            if (placement.type != PLACEMENT.Valid) {
                // TODO display message about invalid placement attempt.
                this.game.removeDummy(id);
                return true;
            }
            const cardReq = this.hand.playCard(index);
            sendMessage(this.room, MessageKind.PlayCard, {
                card: cardReq.card,
                id: cardReq.id,
                tileX: placement.tileX,
                tileY: placement.tileY
            });
            placement.type = PLACEMENT.Placed;
        }
        // Assume placement in the middle of the tile.
        placement.tileX += 0.5;
        placement.tileY += 0.5;
        this.flipIfNeeded(placement); // Flip to rendering coordinates.
        this.game.updateDummy(id, this.hand.cards[index], placement);
        return placement.type == PLACEMENT.BelowLine;
    }

    start() {
        this.game.input.enabled = true;
    }

    end() {
        this.game.input.off(Phaser.Input.Events.POINTER_DOWN);
    }

    getFieldPlacement(p:{x:number, y:number}):FieldPlacement {
        const f = this.isFlipped ? Math.ceil : Math.floor;
        const result = {
            type: PLACEMENT.Valid,
            tileX: f(p.x / FIELD_TILE_SIZE),
            tileY: f(p.y / FIELD_TILE_SIZE),
        };
        if (p.y > FIELD_TILES_HEIGHT * FIELD_TILE_SIZE) result.type = PLACEMENT.BelowLine;
        this.flipIfNeeded(result); // Flip to logical coordinates.
        // Clamp on sides.
        if (result.tileY < 0) result.tileY = 0;
        else if (result.tileY >= FIELD_TILES_HEIGHT) result.tileY = FIELD_TILES_HEIGHT - 1;
        if (result.tileX < 0) result.tileX = 0;
        else if (result.tileX >= FIELD_TILES_WIDTH) result.tileX = FIELD_TILES_WIDTH - 1;

        // TODO check against water/bridges.
        // TODO check against tower instances. Clamp around ours. Handle opponent's influence field.
        return result;
    }

    addEntity(entity:EntitySync, key:string) {
        const pos = { tileX: entity.tileX, tileY: entity.tileY };
        this.flipIfNeeded(pos);
        this.game.addEntity(key, pos, entity.type);
    }

    removeEntity(key:string) {
        this.game.removeEntity(key);
    }

    flipIfNeeded(o:{tileX:number, tileY:number}) {
        if (this.isFlipped) {
            o.tileX = FIELD_TILES_WIDTH - o.tileX;
            o.tileY = FIELD_TILES_HEIGHT - o.tileY;
        }
    }

}

export const enum PLACEMENT {
    Valid,
    Invalid,
    BelowLine,
    Placed
}

export type FieldPlacement = {
    type:PLACEMENT,
    tileX:number,
    tileY:number
}
