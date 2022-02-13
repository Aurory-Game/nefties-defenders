import { Client, Room } from "colyseus";
import { CrRoomSync } from "../schema/CrRoomSync";

export default class CrRoom extends Room<CrRoomSync> {

    onCreate() {
        this.maxClients = 2;
        this.setState(new CrRoomSync());
    }

    onJoin(client:Client) {
        console.log(`Client ${client.id} joined.`);
    }

}
