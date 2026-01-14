import { State } from "../core/state.js";
import { generateId } from "../core/utils.js";
import { Room } from "../objects/Room.js";
import { defaultRoomText } from "../core/default_room_text.js";

/**
 * Handles creation and deletion of Room objects.
 * Also ensures that removing a room updates any apertures connected to it.
 */
export class RoomManager {

    constructor() {}

    /**
     * Creates a new Room instance and registers it in global state.
     * Automatically assigns:
     *   - a unique ID
     *   - a default label ("Room N") if none provided
     *   - default room text if none provided
     *   - default UI position/size if none provided
     *
     * @param {Object} initialData - Optional overrides for label, data, and UI.
     * @returns {Room}
     */
    createRoom(initialData = {}) {
        const id = generateId();

        // Construct the room with defaults where needed
        const room = new Room({
            id,
            label: initialData.label || (`Room ` + State.rooms.size),
            data: initialData.data || defaultRoomText(),
            ui: initialData.ui || {
                position: { left: 50, top: 50 },
                size: { width: 120, height: 90 }
            }
        });

        // Register room in global state
        State.rooms.set(id, room);
        return room;
    }

    /**
     * Removes a room from the layout.
     * Also cleans up any apertures that reference this room by
     * removing the room ID from their connection list.
     *
     * @param {string} id - Room ID to remove.
     */
    removeRoom(id) {
        // Remove this room from all apertures' room lists
        State.apertures.forEach(ap => {
            ap.rooms = ap.rooms.filter(rid => rid !== id);
        });

        // Remove the room itself
        State.rooms.delete(id);
    }
}
