// js/core/state.js

export const State = {
    rooms: new Map(),        // id → Room instance
    apertures: new Map(),    // id → Aperture instance

    selected: null,          // DOM element
    linkMode: false,
    linkSelection: [],       // room IDs selected for linking
    linkingDOMElements: [],  // DOM elements involved in linking

    transportPathMode: false,
    resultsViewMode: false,

    ui: {
        canvas: null,
        highlightedConnectionLayer: null,
        connectionLayer: null,
        jsonEditor: null,
        jsonEditorContainer: null,
        jsonError: null,
        tranportPathList: null,
        resultsView: null
    },
    
    results: {
        gradientSelect: null,
        speciesInput: null,
        speciesList: null,
        timeSlider: null,
        timeLabel: null,
    }
};
