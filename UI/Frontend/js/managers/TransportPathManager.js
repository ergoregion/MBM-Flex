import { State } from "../core/state.js";
import { TransportPathDeductionInterface } from "../interfaces/TransportPathDeductionInterface.js";

/**
 * Handles the "transport path" visualization mode.
 * This mode highlights possible movement/flow paths through apertures.
 *
 * Responsibilities:
 *  - Trigger path deduction logic
 *  - Display a list of selectable path tiles
 *  - Highlight apertures and connection lines when hovering over a path
 *  - Cleanly exit the mode and reset UI state
 */
export class TransportPathManager {
    
    constructor(connectionRenderer) {
        // Used to highlight SVG connection lines
        this.renderer = connectionRenderer;

        // Computes transport paths based on the current layout graph
        this.transportPathDeductionInterface = new TransportPathDeductionInterface();
    }

    /**
     * Activates transport path mode.
     * Shows the path list UI and populates it with tiles representing each path.
     * Hovering a tile highlights the corresponding apertures and lines.
     */
    start() {
        if (State.transportPathMode) return;
        State.transportPathMode = true;
        
        State.ui.tranportPathList.style.display = "flex";

        // Deduce paths asynchronously (may involve graph traversal)
        const pathPromise = this.transportPathDeductionInterface.deducePaths();

        pathPromise.then((paths) => {
            for (let i = 0; i < paths.length; i++) {
                const tile = document.createElement("div");
                tile.className = "tile";
                State.ui.tranportPathList.appendChild(tile);

                // Highlight apertures + lines on hover
                tile.addEventListener("mouseenter", () => this.highlightFor(paths[i], true));
                tile.addEventListener("mouseleave", () => this.highlightFor(paths[i], false));
            }
        });
    }

    /**
     * Deactivates transport path mode.
     * Hides the UI and resets the list content.
     */
    end() {
        if (!State.transportPathMode) return;

        State.transportPathMode = false;
        State.ui.tranportPathList.style.display = "none";
        State.ui.tranportPathList.innerHTML = "Transport paths:";
    }
    
    /**
     * Highlights all apertures and connection lines belonging to a given path.
     * Called when hovering over a path tile.
     *
     * @param {string[]} path - List of aperture IDs in the path.
     * @param {boolean} mode - true = highlight on, false = highlight off.
     */
    highlightFor(path, mode) {
        // Highlight SVG connection lines
        this.renderer.transportModeFor(path, mode);

        // Highlight aperture DOM elements
        document.querySelectorAll(".aperture").forEach(aperture => {
            if (path.includes(aperture.dataset.id)) {
                aperture.classList.toggle("transport", mode);
            }
        });
    }
}
