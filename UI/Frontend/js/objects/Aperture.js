/**
 * Represents an aperture (opening) between rooms or between a room and the outside.
 * Stores both logical data (connected rooms, area) and UI metadata (position).
 */
export class Aperture {

    /**
     * @param {Object} param0
     * @param {string} param0.id - Unique aperture ID.
     * @param {number} param0.area - Size of the aperture (defaults to 1.0).
     * @param {string[]} param0.rooms - IDs of connected rooms or [roomId, side].
     * @param {Object} param0.ui - UI metadata (position, size, etc.).
     * @param {boolean} param0.grounded - Whether this aperture connects to a side instead of another room.
     */
    constructor({ id, area, rooms, ui, grounded }) {
        this.id = id;
        this.area = area ?? 1.0;
        this.grounded = grounded ?? false;

        // List of room IDs (or room + side for grounded apertures)
        this.rooms = rooms || [];

        // UI metadata used for rendering on the canvas
        this.ui = ui || { position: { left: 0, top: 0 } };
    }

    /**
     * Produces a plain JSON‑serializable representation of the aperture.
     * Used when saving layouts to disk.
     */
    serialize() {
        return {
            id: this.id,
            area: this.area,
            rooms: this.rooms,
            ui: this.ui
        };
    }
}
