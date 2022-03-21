import { Client, Room } from 'colyseus';
import { CrRoomSync } from '../schema/CrRoomSync';
import ServerLogicEngine from '../logic/ServerLogicEngine';
import FixedTimestep from '../../../shared/FixedTimestep';
import { TIMESTEP } from '../../../shared/constants';
import { MessageKind } from '../../../shared/messages';

export default class CrRoom extends Room<CrRoomSync> {

    private engine!:ServerLogicEngine;
    private timestep!:FixedTimestep;

    onCreate() {
        this.maxClients = 2;
        this.setState(new CrRoomSync());
        this.engine = new ServerLogicEngine(this);
        this.timestep = new FixedTimestep(TIMESTEP, () => this.onTick());
        this.onMessage(MessageKind.PLAY_CARD, (client, msg) => this.engine.onPlayCard(client, msg));
    }

    onJoin(client:Client) {
        console.log(`Client ${client.id} joined.`);
        this.engine.addPlayer(client);
        if (this.state.players.size == this.maxClients) {
            this.startGame();
            this.setPrivate(true);
        }
    }

    onLeave(client:Client) {
        this.engine.removePlayer(client);
    }

    startGame() {
        // @ts-expect-error Colyseus has wrong types.
        this.setPatchRate(null); // Disable automatic patch send, we need precise timing.
        this.engine.start();
        this.timestep.start(undefined, undefined, this.state.tick);
    }

    onTick() {
        this.state.tick = this.timestep.ticks;
        this.engine.update();
        this.broadcastPatch();
    }

    onDispose() {
        this.timestep.stop();
    }

}
