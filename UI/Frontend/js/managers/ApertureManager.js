import { State } from "../core/state.js";
import { generateId } from "../core/utils.js";
import { Aperture } from "../objects/Aperture.js";

/**
 * Manages creation and removal of Aperture objects.
 * An "aperture" represents an opening between rooms or between a room and the outside.
 */
export class ApertureManager {

    /**
     * Create a generic aperture using raw data.
     * @param {Object} data - Aperture configuration.
     * @returns {Aperture}
     */
    createAperture(data) {

        const id = generateId();
        
        // Construct the aperture using provided data
        const ap = new Aperture(data);

        // Store in global state
        State.apertures.set(id, ap);
        return ap;
    }

    /**
     * Create an aperture positioned between two rooms.
     * Automatically computes a midpoint between the room centers.
     *
     * @param {Room} roomA
     * @param {Room} roomB
     * @param {number} area - Size of the aperture (default 1.0)
     * @returns {Aperture}
     */
    createApertureBetween(roomA, roomB, area = 1.0) {

        const id = generateId();
        const aperture_graphic_diameter = 24;

        // Compute midpoint between room centers (minus offset for the size of the aperture graphic)
        const l = (
            roomA.ui.position.left + roomA.ui.size.width / 2 +
            roomB.ui.position.left + roomB.ui.size.width / 2 
        ) / 2;

        const t = (
            roomA.ui.position.top + roomA.ui.size.height / 2 +
            roomB.ui.position.top + roomB.ui.size.height / 2 
        ) / 2;

        // Create aperture linking the two rooms
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

    /**
     * Create an aperture attached to a specific side of a room.
     * Used for doors/windows that connect a room to the outside world.
     *
     * @param {Room} roomA
     * @param {"Front"|"Back"|"Left"|"Right"} side - Which side of the room the aperture is on.
     * @param {number} area
     * @returns {Aperture}
     */
    createGroundedAperture(roomA, side, area = 1.0) {

        const id = generateId();
        const aperture_graphic_radius = 12;

        // Determine offset based on which side the aperture is grounded to.
        // These values align the aperture visually relative to the room's UI box.
        const top_delta =
            side === "Front" ? roomA.ui.size.height+aperture_graphic_radius :
            side === "Back"  ? -aperture_graphic_radius :
            roomA.ui.size.height / 2;

        const left_delta =
            side === "Left"  ? -aperture_graphic_radius :
            side === "Right" ? roomA.ui.size.width+aperture_graphic_radius :
            roomA.ui.size.width / 2;

        // Final UI position (centered with a -12px offset)
        const l = roomA.ui.position.left + left_delta;
        const t = roomA.ui.position.top + top_delta;

        // Create aperture linking the room to a "side" (treated like an external boundary)
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

    /**
     * Remove an aperture by ID.
     * @param {string} id
     */
    removeAperture(id) {
        State.apertures.delete(id);
    }
}
