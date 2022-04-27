import { Server } from '@colyseus/core';
import CrRoom from './rooms/CrRoom';
import { ROOM_NAME } from '../../shared/constants';

const colyseus = new Server();

colyseus.define(ROOM_NAME, CrRoom);

colyseus.listen(5001).then(() => {
    console.log('Colyseus server started.');
}).catch(e => {
    console.error(e);
});
