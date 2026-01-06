// js/objects/Room.js
import { defaultRoomText } from "../core/default_room_text.js";

/**
 * Represents a room in the layout.
 * Stores both:
 *   - logical data (label, JSON content)
 *   - UI metadata (position, size)
 *
 * The Room object is the core unit of the layout model.
 */
export class Room {

    /**
     * @param {Object} param0
     * @param {string} param0.id - Unique room ID.
     * @param {string} param0.label - Human-readable room name.
     * @param {string} param0.data - Raw JSON text describing the room.
     * @param {Object} param0.ui - UI metadata (position + size).
     */
    constructor({ id, label, data, ui }) {
        this.id = id;
        this.label = label || `Room`;
        this.data = data || defaultRoomText();   // JSON string defining room properties
        this.ui = ui;                            // { position: {left, top}, size: {width, height} }
    }

    /**
     * Updates the room's position in the UI.
     * Called by drag/resize logic.
     */
    setPosition(left, top) {
        this.ui.position.left = left;
        this.ui.position.top = top;
    }

    /**
     * Updates the room's size in the UI.
     * Called by resize logic.
     */
    setSize(width, height) {
        this.ui.size.width = width;
        this.ui.size.height = height;
    }

    /**
     * Produces a plain JSON‑serializable representation of the room.
     * Used when saving layouts to disk.
     */
    serialize() {
        return {
            id: this.id,
            label: this.label,
            data: this.data,
            ui: this.ui
        };
    }
}
