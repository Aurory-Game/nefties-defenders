import { Client, Room } from 'colyseus.js';
import Game from 'src/scenes/Game';
import { CrRoomSync } from 'schema/CrRoomSync';
import { MANA_MAX, MANA_REGEN_TICKS, ROOM_NAME, TICKS_HALF_S, TIMESTEP, TIMESTEP_S } from 'shared/constants';
import { MENU_KEY } from 'src/scenes/Menu';
import { GAME_STATE } from 'shared/GAME_STATE';
import FixedTimestep from 'shared/FixedTimestep';
import InitTimeSync from './InitTimeSync';
import { PlayerSync } from 'schema/PlayerSync';

class RoomManager {

    private game:Game;
    private room:Room<CrRoomSync>;
    private sync:CrRoomSync;

    private ourPlayer:PlayerSync;
    private timestep:FixedTimestep;
    private initTimeSync:InitTimeSync;

    constructor(game:Game, room:Room<CrRoomSync>) {
        this.game = game;
        this.room = room;
        this.sync = room.state;
        this.room.onStateChange(sync => this.onSyncChange(sync));
        this.sync.listen('state', state => {
            this.updateText();
            if (state == GAME_STATE.PLAYING && !this.timestep.isEnabled()) {
                // If for any reason we didn't start yet, do it now.
                this.timestep.startNowAtTick(this.sync.tick);
            }
        });
        this.sync.players.onAdd = (player, key) => {
            if (key == room.sessionId) {
                this.ourPlayer = player;
            }
        };
        this.initTimeSync = new InitTimeSync(TIMESTEP);
        this.timestep = new FixedTimestep(TIMESTEP, () => this.update());
        this.room.onLeave(code => {
            // Code 1000 is normal socket shutdown.
            if (code > 1000) this.disconnected();
        });
        this.room.onError(() => this.disconnected());
        this.game.events.on(Phaser.Scenes.Events.PRE_UPDATE, () => {
            // This is driven by RAF. We check if fixed timestep needs to run, then render.
            this.timestep.tick();
            this.game.render(this.timestep.getCurrentTime().time);
        });
        this.game.events.once('shutdown', () => {
            if (this.timestep) this.timestep.stop();
            this.game.events.off(Phaser.Scenes.Events.PRE_UPDATE);
            this.game = null;
            this.room?.removeAllListeners();
            this.room?.leave();
            this.room = null;
        });
    }

    onSyncChange(sync:CrRoomSync) {
        if (sync.state == GAME_STATE.STARTING) {
            const ticksUntilStart = sync.nextStateAt - sync.tick;
            if (ticksUntilStart > TICKS_HALF_S) {
                this.updateText();
                this.initTimeSync.addTimePoint(ticksUntilStart);
            } else if (ticksUntilStart == TICKS_HALF_S) { // Estimate actual start time a bit before it happens.
                const startTime = this.initTimeSync.estimate();
                if (isFinite(startTime)) {
                    // Actual server zero time is at tick 0.
                    const zeroTime = startTime - sync.nextStateAt * TIMESTEP;
                    this.timestep.start(zeroTime, startTime, sync.nextStateAt - 1);
                }
            }
        }
    }

    update() {
        if (this.sync.state != GAME_STATE.PLAYING) {
            this.updateText();
        }
        if (!this.ourPlayer) return;
        const time = this.timestep.getSteppedTime();
        let mana = this.ourPlayer.secret.mana;
        const ticksSinceLastRegen = this.timestep.ticks - this.ourPlayer.secret.manaRegenLastTick;
        if (ticksSinceLastRegen > 0) mana += ticksSinceLastRegen / MANA_REGEN_TICKS;
        if (mana > MANA_MAX) mana = MANA_MAX;
        this.game.manaBar.interpolator.add(time, mana);
    }

    updateText() {
        const secondsLeft = this.getSecondsUntil(this.sync.nextStateAt);
        this.game.updateText(this.sync.state, secondsLeft);
    }

    getSecondsUntil(untilTick:number) {
        const ticksUntilStart = untilTick - this.sync.tick;
        return Math.ceil(ticksUntilStart * TIMESTEP_S);
    }

    disconnected() {
        this.game.scene.start(MENU_KEY, { message: 'Disconnected' });
    }

}

const client = new Client(`ws://${location.hostname}:5001`);

export function startMatch(game:Game) {
    client.joinOrCreate(ROOM_NAME, null, CrRoomSync)
        .then(room => this.roomManager = new RoomManager(game, room))
        .catch(e => {
            console.error('join error', e);
            game.scene.start(MENU_KEY, { message: 'Connection Failed' });
        });
}
