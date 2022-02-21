import { Client } from 'colyseus';
import { MANA_MAX, MANA_REGEN_TICKS, TICKS_3S } from 'shared/constants';
import { GAME_STATE } from 'shared/GAME_STATE';
import CrRoom from 'src/rooms/CrRoom';
import { CrRoomSync, PlayerSync } from 'src/schema/CrRoomSync';

export default class ServerLogicEngine {

    private room:CrRoom;
    private sync:CrRoomSync;
    private players:Map<string, PlayerData>;

    private manaRegenTicksLeft:number = MANA_REGEN_TICKS;

    constructor(room:CrRoom) {
        this.room = room;
        this.sync = room.state;
        this.players = new Map();
    }

    addPlayer(client:Client) {
        const playerSync = new PlayerSync(client.sessionId); // Using sessionId as player name for the prototype.
        this.sync.players.set(client.sessionId, playerSync);

        const data:PlayerData = {
            sync: playerSync,
        };
        this.players.set(client.sessionId, data);
    }

    removePlayer(client:Client) {
        this.players.delete(client.sessionId);
        this.sync.players.delete(client.sessionId);
    }

    start() {
        if (this.sync.state == GAME_STATE.WAITING) {
            this.sync.state = GAME_STATE.STARTING;
            this.sync.nextStateAt = this.sync.tick + TICKS_3S; // Start in three seconds.
        }
    }

    update() {
        switch (this.sync.state) {
        case GAME_STATE.STARTING:
            if (this.sync.tick >= this.sync.nextStateAt) {
                this.sync.state = GAME_STATE.PLAYING;
            }
            break;
        case GAME_STATE.PLAYING:{
            this.gameLogic();
            break;
        }
        case GAME_STATE.DONE:
            if (this.sync.tick >= this.sync.nextStateAt) {
                this.room.disconnect();
            }
            break;
        }
    }

    gameLogic() {
        // Mana regen.
        if (--this.manaRegenTicksLeft <= 0) {
            this.manaRegenTicksLeft += MANA_REGEN_TICKS;
            for (const player of this.players.values()) {
                if (player.sync.secret.mana < MANA_MAX)
                    player.sync.secret.mana++;
            }
        }
        console.log([...this.players.values()].map(p => p.sync.secret.mana));
    }

}

type PlayerData = {
    sync:PlayerSync,
}
