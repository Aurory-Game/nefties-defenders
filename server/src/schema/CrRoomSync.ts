import { MapSchema, Schema, filter, type } from '@colyseus/schema';
import { Client } from 'colyseus';
import { MANA_START } from '../../../shared/constants';
import { EntityState, EntityType } from '../../../shared/entities';
import { GameState } from '../../../shared/GameState';

export class PlayerSecretSync extends Schema {
    /** Player's current mana. */
    @type('uint8') mana:number = MANA_START;
    /** The last tick that mana regenerated on. */
    @type('uint16') manaRegenLastTick:number = 0;
    @type('boolean') isFlipped:boolean = false;
}

export class PlayerSync extends Schema {
    /** Player's name. */
    @type('string') name:string;
    /** Player's sync data that are only send to them. */
    @filter(onlyOwnerPlayer)
    @type(PlayerSecretSync) secret = new PlayerSecretSync();
    constructor(name:string) {
        super();
        this.name = name;
    }
}

export class EntitySync extends Schema {
    @type('float32') tileX:number;
    @type('float32') tileY:number;
    @type('uint8') type:EntityType;
    @type('string') owner:string;
    @type('uint8') state:EntityState;
    constructor(tileX:number, tileY:number, type:EntityType, owner:string) {
        super();
        this.tileX = tileX;
        this.tileY = tileY;
        this.type = type;
        this.owner = owner;
        this.state = EntityState.SPAWNING;
    }
}

export class CrRoomSync extends Schema {
    @type('uint8') state = GameState.WAITING;
    @type('uint16') nextStateAt = 0;
    @type('uint16') tick = 0;
    @type({ map: PlayerSync }) players = new MapSchema<PlayerSync>();
    @type({ map: EntitySync }) entities = new MapSchema<EntitySync>();
}

function onlyOwnerPlayer(this:PlayerSync, client:Client, value:unknown, root:CrRoomSync) {
    return root.players.get(client.sessionId) == this;
}
