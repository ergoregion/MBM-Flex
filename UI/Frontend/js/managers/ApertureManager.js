// js/managers/ApertureManager.js

import { State } from "../core/state.js";
import { generateId } from "../core/utils.js";
import { Aperture } from "../objects/Aperture.js";

export class ApertureManager {

    createApertureBetween(roomA, roomB, area = 1.0) {

        const id = generateId();
        const l = (roomA.ui.position.left+roomA.ui.size.width/2 + roomB.ui.position.left+roomB.ui.size.width/2)/2.0-12;
        const t = (roomA.ui.position.top+roomA.ui.size.height/2 + roomB.ui.position.top+roomB.ui.size.height/2)/2.0-12;

        const ap = new Aperture({
            id,
            area,
            rooms: [roomA.id, roomB.id],
            ui: {
                position: { left: l, top: t }
            },
            grounded: false
        });

        State.apertures.set(id, ap);
        return ap;
    }

    createGroundedAperture(roomA, side, area = 1.0) {

        const id = generateId();

        const top_delta =
            side === "Front" ? roomA.ui.size.height+12  :
            side === "Back"  ? -24 :
            roomA.ui.size.height/2;
        const left_delta =
            side === "Left" ? -24 :
            side === "Right"  ? roomA.ui.size.width +12 :
            roomA.ui.size.width/2;
        

        const l = (roomA.ui.position.left +left_delta-12);
        const t = (roomA.ui.position.top +top_delta-12);

        const ap = new Aperture({
            id,
            area,
            rooms: [roomA.id, side],
            ui: {
                position: { left: l, top: t }
            },
            grounded: true
        });

        State.apertures.set(id, ap);
        return ap;
    }

    removeAperture(id) {
        State.apertures.delete(id);
    }
}
