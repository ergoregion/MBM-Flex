// js/managers/RoomManager.js

import { State } from "../core/state.js";
import { generateId } from "../core/utils.js";
import { Room } from "../objects/Room.js";

export class RoomManager {

    constructor() {}

    createRoom(initialData = {}) {
        const id = generateId();

        const room = new Room({
            id,
            label: initialData.label || `Room`,
            data: initialData.data || {},
            ui: initialData.ui || {
                position: { left: 50, top: 50 },
                size: { width: 120, height: 90 }
            }
        });

        State.rooms.set(id, room);
        return room;
    }

    removeRoom(id) {
        State.apertures.forEach(ap => {
            ap.rooms = ap.rooms.filter(rid => rid !== id);
        });
        State.rooms.delete(id);
    }
}
