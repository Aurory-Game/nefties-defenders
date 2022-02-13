import { Server } from '@colyseus/core';
import CrRoom from './rooms/CrRoom';

const colyseus = new Server();

colyseus.define('cr', CrRoom);

colyseus.listen(5001).then(() => {
    console.log('Colyseus server started.');
}).catch(e => {
    console.error(e);
});
