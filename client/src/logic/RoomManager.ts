import { Client, Room } from 'colyseus.js';
import Game from 'src/scenes/Game';
import { CrRoomSync } from 'schema/CrRoomSync';
import { ROOM_NAME } from 'shared/constants';
import { MENU_KEY } from 'src/scenes/Menu';

class RoomManager {

    private game: Game;
    private room: Room<CrRoomSync>;
    private sync: CrRoomSync;

    constructor(game:Game, room:Room<CrRoomSync>) {
        this.game = game;
        this.room = room;
        this.sync = room.state;
        this.sync.listen('state', state => {
            this.game.updateText(state);
        });
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
