import { Room } from 'colyseus.js';
import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, FIELD_TILE_SIZE, isWater } from 'shared/constants';
import { MessageKind, sendMessage } from 'shared/messages';
import Game from 'scenes/Game';
import CardHand from './CardHand';
import { EntitySync } from 'schema/EntitySync';
import { PlayerSync } from 'schema/PlayerSync';
import { MapSchema } from '@colyseus/schema';
import { ENTITIES, EntityType, InfluenceRange, getInfluence, withinInfluence } from 'shared/entities';

export default class ClientGameplay {

    hand:CardHand;
    public ourPlayer:PlayerSync;
    public ourKey:string;

    private entities:MapSchema<EntitySync>;
    private influences:Map<string, InfluenceRange> = new Map();

    constructor(private room:Room, private game:Game) {
        this.game.input.enabled = false;
        this.hand = new CardHand(game.handRender);
        this.hand.onRequestConfirmed = id => game.removeDummy(id);
        this.game.handRender.onCardDragMove = this.onCardDragMove.bind(this);
    }

    onCardDragMove(index:number, x:number, y:number, isDone:boolean):boolean {
        const p = this.game.field.root.getLocalPoint(x, y);
        const placement = this.getFieldPlacement(p);
        const id = this.hand.getNextId();
        this.game.field.setInfluenceVisible(!isDone);
        if (isDone) {
            if (placement.type != Placement.VALID) {
                if (placement.type == Placement.BELOW_LINE) placement.type = Placement.DONE_NOT_PLACED;
                else placement.type = Placement.DONE_INVALID_POS;
            } else if (this.ourPlayer.secret.mana < this.hand.predictMana(index)) {
                placement.type = Placement.DONE_NO_MANA;
            } else {
                const cardReq = this.hand.playCard(index);
                sendMessage(this.room, MessageKind.PLAY_CARD, {
                    card: cardReq.card,
                    id: cardReq.id,
                    tileX: placement.tileX,
                    tileY: placement.tileY
                });
                placement.type = Placement.DONE_PLACED;
            }
        }
        // Assume placement in the middle of the tile.
        placement.tileX += 0.5;
        placement.tileY += 0.5;
        this.flipIfNeeded(placement); // Flip to rendering coordinates.
        this.game.updateDummy(id, this.hand.cards[index], placement);
        return isDone || placement.type == Placement.BELOW_LINE;
    }

    start(entities:MapSchema<EntitySync>) {
        this.entities = entities;
        this.game.input.enabled = true;
    }

    end() {
        this.game.input.off(Phaser.Input.Events.POINTER_DOWN);
    }

    getFieldPlacement(p:{x:number, y:number}):FieldPlacement {
        const { isFlipped } = this.ourPlayer.secret;
        const f = isFlipped ? Math.ceil : Math.floor;
        const pTile = { tileX: p.x / FIELD_TILE_SIZE, tileY: p.y / FIELD_TILE_SIZE };
        const result = {
            type: Placement.VALID,
            tileX: f(pTile.tileX),
            tileY: f(pTile.tileY),
        };
        if (p.y > FIELD_TILES_HEIGHT * FIELD_TILE_SIZE) {
            result.type = Placement.BELOW_LINE;
            return result;
        }
        this.flipIfNeeded(result); // Flip to logical coordinates.
        this.flipIfNeeded(pTile);
        // Clamp on sides.
        if (result.tileY < 0) result.tileY = 0;
        else if (result.tileY >= FIELD_TILES_HEIGHT) result.tileY = FIELD_TILES_HEIGHT - 1;
        if (result.tileX < 0) result.tileX = 0;
        else if (result.tileX >= FIELD_TILES_WIDTH) result.tileX = FIELD_TILES_WIDTH - 1;

        if (isWater(result.tileX, result.tileY)) {
            if (result.tileX > 0 && !isWater(result.tileX - 1, result.tileY))
                result.tileX--;
            else if (result.tileX < FIELD_TILES_WIDTH - 1 && !isWater(result.tileX + 1, result.tileY))
                result.tileX++;
            else if (result.tileY > 0 && !isWater(result.tileX, result.tileY - 1))
                result.tileY--;
            else if (result.tileY < FIELD_TILES_HEIGHT - 1 && !isWater(result.tileX, result.tileY + 1))
                result.tileY++;
        }

        // Clamp around buildings.
        for (const e of this.entities.values()) {
            const { size } = ENTITIES[e.type as EntityType];
            if (size.t == 'square') {
                const x = Math.round(e.tileX - size.size / 2);
                const y = Math.round(e.tileY - size.size / 2);
                if (result.tileX >= x && result.tileX < x + size.size
                        && result.tileY >= y && result.tileY < y + size.size) {
                    if (Math.abs(e.tileX - pTile.tileX) > Math.abs(e.tileY - pTile.tileY)) {
                        if (pTile.tileX > e.tileX) result.tileX = x + size.size;
                        else result.tileX = x - 1;
                    } else {
                        if (pTile.tileY > e.tileY) result.tileY = y + size.size;
                        else result.tileY = y - 1;
                    }
                }
            }

        }

        for (const inf of this.influences.values()) {
            if (withinInfluence(inf, result.tileX, result.tileY)) result.type = Placement.INVALID;
        }
        return result;
    }

    addEntity(entity:EntitySync, key:string) {
        const pos = { tileX: entity.tileX, tileY: entity.tileY };
        this.flipIfNeeded(pos);
        this.game.addEntity(key, pos, entity.type, entity.owner == this.ourKey);
        if (entity.owner != this.ourKey) {
            const inf = getInfluence(entity.type, entity.tileX, entity.tileY);
            if (inf) {
                this.influences.set(key, inf);
                this.redrawInfluence();
            }
        }
    }

    removeEntity(key:string) {
        this.game.removeEntity(key);
        if (this.influences.delete(key)) this.redrawInfluence();
    }

    redrawInfluence() {
        for (const inf of this.influences.values()) this.flipInfluenceIfNeeded(inf);
        this.game.field.redrawInfluence(this.influences.values());
        for (const inf of this.influences.values()) this.flipInfluenceIfNeeded(inf);
    }

    updateEntities(time:number) {
        for (const [key, entity] of this.entities) {
            const render = this.game.entities.get(key);
            if (render.interpolator) {
                const pos = { tileX: entity.tileX, tileY: entity.tileY };
                this.flipIfNeeded(pos);
                render.interpolator.add(time, pos.tileX, pos.tileY);
            }
            render.hitpointsInterpolator.add(time, entity.hp);
        }
    }

    flipIfNeeded(o:{tileX:number, tileY:number}) {
        if (this.ourPlayer.secret.isFlipped) {
            o.tileX = FIELD_TILES_WIDTH - o.tileX;
            o.tileY = FIELD_TILES_HEIGHT - o.tileY;
        }
    }

    flipInfluenceIfNeeded(inf:InfluenceRange) {
        if (this.ourPlayer.secret.isFlipped) {
            [inf.x1, inf.x2, inf.y1, inf.y2] = [
                FIELD_TILES_WIDTH - inf.x2, FIELD_TILES_WIDTH - inf.x1,
                FIELD_TILES_HEIGHT - inf.y2, FIELD_TILES_HEIGHT - inf.y1];
        }
    }

}

export const enum Placement {
    VALID,
    INVALID,
    BELOW_LINE,
    DONE_NOT_PLACED,
    DONE_PLACED,
    DONE_NO_MANA,
    DONE_INVALID_POS,
}

export type FieldPlacement = {
    type:Placement,
    tileX:number,
    tileY:number
}
