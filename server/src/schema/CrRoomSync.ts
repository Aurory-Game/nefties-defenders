import { MapSchema, Schema, filter, type } from '@colyseus/schema';
import { Client } from 'colyseus';
import { GAME_STATE } from 'shared/GAME_STATE';

export class PlayerSecretSync extends Schema {
    /** Player's current mana. */
    @type('uint8') mana:number = 0;
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

export class CrRoomSync extends Schema {
    @type('uint8') state = GAME_STATE.WAITING;
    @type('uint16') nextStateAt = 0;
    @type('uint16') tick = 0;
    @type({ map: PlayerSync }) players = new MapSchema<PlayerSync>();
}

function onlyOwnerPlayer(this:PlayerSync, client:Client, value:unknown, root:CrRoomSync) {
    return root.players.get(client.sessionId) == this;
}
filter(onlyOwnerPlayer)(PlayerSync.prototype, 'personal');
