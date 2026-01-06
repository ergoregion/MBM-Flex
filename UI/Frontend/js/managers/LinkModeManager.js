import { State } from "../core/state.js";

/**
 * Manages "link mode", a temporary UI state where the user selects
 * rooms or sides to create apertures (connections) between them.
 *
 * Handles:
 *  - entering/exiting link mode
 *  - tracking selected rooms
 *  - creating apertures when enough selections are made
 *  - updating DOM elements to reflect linking state
 */
export class LinkModeManager {

    constructor(apertureManager, createDomAperture) {
        // Logic for creating Aperture objects
        this.apertureManager = apertureManager;

        // Function that creates the corresponding DOM element for an aperture
        this.createDomAperture = createDomAperture;
    }

    /**
     * Enables link mode.
     * Clears previous selections and notifies the UI.
     */
    enableLinkMode() {
        State.linkMode = true;
        State.linkSelection = [];
        document.dispatchEvent(new CustomEvent("ui:linkModeOn"));
    }

    /**
     * Called when the user clicks a room while in link mode.
     * Adds the room to the selection and visually marks it.
     * When two rooms are selected, an aperture is created between them.
     */
    linkRoom(room, el) {
        if (!State.linkMode) return;

        // Prevent selecting the same room twice
        if (room in State.linkSelection) return;

        State.linkSelection.push(room);

        // Mark the room visually as part of the linking process
        el.classList.add("linking");
        State.linkingDOMElements.push(el);

        // When two rooms are selected, create the connection
        if (State.linkSelection.length === 2) {
            const aperture = this.apertureManager.createApertureBetween(
                State.linkSelection[0],
                State.linkSelection[1]
            );

            this.createDomAperture(aperture);
            this.disableLinkMode();
        }
    }

    /**
     * Called when the user clicks a "side banner" (Front/Back/Left/Right)
     * to create a grounded aperture from the selected room to the outside.
     */
    linkClickBanner(side) {
        if (!State.linkMode) return;

        // Must have exactly one room selected before choosing a side
        if (State.linkSelection.length !== 1) return;

        const aperture = this.apertureManager.createGroundedAperture(
            State.linkSelection[0],
            side
        );

        this.createDomAperture(aperture);
        this.disableLinkMode();
    }

    /**
     * Exits link mode.
     * Clears selections, removes visual indicators, and notifies the UI.
     */
    disableLinkMode() {
        State.linkMode = false;
        State.linkSelection = [];
        document.dispatchEvent(new CustomEvent("ui:linkModeOff"));

        // Remove "linking" highlight from all previously selected elements
        State.linkingDOMElements.forEach(element => {
            element.classList.remove("linking");
        });

        State.linkingDOMElements = [];
    }
}
