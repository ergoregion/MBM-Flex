import { State } from "../core/state.js";
import { getCenter } from "../core/utils.js";

/**
 * Renders visual connection lines between apertures and rooms.
 * Handles both normal rendering and temporary highlighting modes.
 */
export class ConnectionRenderer {

    /**
     * Rebuilds all connection lines from scratch.
     * Called whenever room/aperture positions change.
     */
    update() {
        const svg = State.ui.connectionLayer;
        const highlightSvg = State.ui.highlightedConnectionLayer;
        const canvas = State.ui.canvas;

        // Clear existing lines before re-rendering
        svg.innerHTML = "";
        highlightSvg.innerHTML = "";

        const apertures = State.apertures;

        apertures.forEach(ap => {
            // Find the aperture's DOM element
            const apEl = document.querySelector(`[data-id="${ap.id}"]`);
            if (!apEl) return;

            // Compute aperture center relative to the canvas
            const apCenter = getCenter(apEl, canvas);

            // Draw a line from the aperture to each connected room
            ap.rooms.forEach(rid => {
                const room = State.rooms.get(rid);
                if (!room) return;

                const roomEl = document.querySelector(`[data-id="${rid}"]`);
                if (!roomEl) return;

                const rCenter = getCenter(roomEl, canvas);

                // Create SVG line connecting aperture → room
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", apCenter.x);
                line.setAttribute("y1", apCenter.y);
                line.setAttribute("x2", rCenter.x);
                line.setAttribute("y2", rCenter.y);
                line.setAttribute("stroke", "green");
                line.setAttribute("stroke-width", "2");

                // Used later for highlighting/transport mode
                line.classList.add("connection-line");
                line.dataset.apertureId = ap.id;
                line.dataset.roomId = rid;

                svg.appendChild(line);
            });
        });
    }

    /**
     * Highlights all lines connected to a given element (usually an aperture).
     * Moves the lines into a separate SVG layer so they appear above others.
     *
     * @param {HTMLElement} el - Element whose connections should be highlighted.
     * @param {boolean} mode - true = highlight on, false = highlight off
     */
    highlightFor(el, mode) {
        const svg = State.ui.connectionLayer;
        const highlightSvg = State.ui.highlightedConnectionLayer;
        const id = el.dataset.id;

        document.querySelectorAll(".connection-line").forEach(line => {
            if (line.dataset.apertureId === id) {

                // Move line between layers depending on highlight mode
                if (mode) {
                    highlightSvg.appendChild(line);
                } else {
                    svg.appendChild(line);
                }

                // Toggle CSS highlight styling
                line.classList.toggle("highlight", mode);
            }
        });
    }
    
    /**
     * Highlights all lines whose aperture IDs appear in a given path.
     * Used for visualizing transport/flow paths through the building.
     *
     * @param {string[]} path - List of aperture IDs included in the transport path.
     * @param {boolean} mode - true = enable transport mode, false = disable
     */
    transportModeFor(path, mode) {
        const svg = State.ui.connectionLayer;
        const highlightSvg = State.ui.highlightedConnectionLayer;

        document.querySelectorAll(".connection-line").forEach(line => {
            if (path.includes(line.dataset.apertureId)) {

                // Move line to highlight layer when transport mode is active
                if (mode) {
                    highlightSvg.appendChild(line);
                } else {
                    svg.appendChild(line);
                }

                // Toggle CSS class for transport visualization
                line.classList.toggle("transport", mode);
            }
        });
    }
}
