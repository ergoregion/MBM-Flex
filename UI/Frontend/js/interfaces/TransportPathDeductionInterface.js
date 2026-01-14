import { State } from "../core/state.js";

/**
 * Prepares and sends aperture/room connectivity data to the backend
 * for transport‑path deduction, then returns the resulting paths.
 *
 * This class acts as a thin interface layer between the front‑end
 * state model and the server‑side path‑finding logic.
 */
export class TransportPathDeductionInterface {

    /**
     * Convenience helper: returns the label for a room ID.
     * Labels are used instead of internal IDs when communicating
     * with the backend.
     */
    getRoomLabel(roomId) {
        return State.rooms.get(roomId).label;
    }

    /**
     * Builds the list of aperture connections in a backend‑friendly format.
     * Each entry describes:
     *   - origin: room label
     *   - destination: room label or side name (for grounded apertures)
     *   - id: aperture ID
     *
     * This produces the minimal graph representation needed for
     * transport‑path deduction.
     */
    path_input() {
        const aperture_data = [];

        State.apertures.forEach(ap => {
            const rooms = ap.rooms;

            // Grounded aperture: room → side (Front/Back/Left/Right)
            if (ap.grounded) {
                const originRoom = this.getRoomLabel(rooms[0]);
                const destination = rooms[1];

                aperture_data.push({
                    origin: originRoom,
                    destination: destination,
                    id: ap.id
                });
            }

            // Normal aperture: room → room
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

        return aperture_data;
    }

    /**
     * Sends the aperture graph to the backend for path deduction.
     * Expects the server to return an array of paths, where each path
     * is a list of aperture IDs.
     */
    async invoke(apertures) {
        const result = await fetch(`/transport/paths`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ apertures })
        });

        return result.json();
    }

    /**
     * High‑level entry point.
     * Gathers aperture data and sends it to the backend.
     * Returns a promise resolving to the list of deduced paths.
     */
    deducePaths() {
        const input = this.path_input();
        return this.invoke(input);
    }
}
