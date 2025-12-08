import { State } from "../core/state.js";

export class TransportPathDeductionInterface {

    getRoomLabel(roomId) {
        return State.rooms.get(roomId).label;
    }

    path_input(){
        const aperture_data = [];
        State.apertures.forEach(ap => {   
            const rooms = ap.rooms;   
            if(ap.grounded){

                const originRoom = this.getRoomLabel(rooms[0]);
                const destination = rooms[1];
                aperture_data.push({
                origin: originRoom,
                destination: destination,
                id: ap.id
                });

            }
            else if (rooms.length === 2) {
                const originRoom = this.getRoomLabel(rooms[0]);
                const destRoom = this.getRoomLabel(rooms[1]);
                aperture_data.push({
                origin: originRoom,
                destination: destRoom,
                id: ap.id
                });
            }
        });
        return aperture_data
    }

    
    async invoke(apertures) {
        const result = await fetch(`/transport/paths`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({apertures})
        });
        return result.json();
    }

    deducePaths(){
        const input = this.path_input();
        const pathPromise = this.invoke(input);
        return pathPromise
    }

}