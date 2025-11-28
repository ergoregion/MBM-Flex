// js/managers/ApertureManager.js

import { State } from "../core/state.js";
import { generateId } from "../core/utils.js";
import { Aperture } from "../objects/Aperture.js";

export class ApertureManager {

    createApertureBetween(roomA, roomB, area = 1.0) {

        const id = generateId();
        const l = (roomA.ui.position.left + roomB.ui.position.left)/2.0;
        const t = (roomA.ui.position.top + roomB.ui.position.top)/2.0;

        const ap = new Aperture({
            id,
            area,
            rooms: [roomA.id, roomB.id],
            ui: {
                position: { left: l, top: t }
            }
        });

        State.apertures.set(id, ap);
        return ap;
    }

    removeAperture(id) {
        State.apertures.delete(id);
    }
}
