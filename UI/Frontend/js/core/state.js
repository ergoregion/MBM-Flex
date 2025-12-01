// js/core/state.js

export const State = {
    rooms: new Map(),        // id → Room instance
    apertures: new Map(),    // id → Aperture instance

    selected: null,          // DOM element
    linkMode: false,
    linkSelection: [],       // room IDs selected for linking
    linkingDOMElements: [],  // DOM elements involved in linking

    ui: {
        canvas: null,
        connectionLayer: null,
        jsonEditor: null,
        jsonEditorContainer: null,
        jsonError: null,
    }
};
