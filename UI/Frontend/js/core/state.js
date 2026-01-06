/**
 * Global application state container.
 * 
 * This object holds all shared data structures used across managers,
 * including:
 *   - the logical model (rooms, apertures)
 *   - UI mode flags (selection, linking, transport paths)
 *   - references to key DOM elements
 *
 * All managers read/write from this central state to stay in sync.
 */
export const State = {

    // --- Core data model ---
    rooms: new Map(),        // id → Room instance
    apertures: new Map(),    // id → Aperture instance

    // --- Selection state ---
    selected: null,          // Currently selected DOM element (room or aperture)

    // --- Link mode state ---
    linkMode: false,         // Whether the user is creating a connection
    linkSelection: [],       // Room IDs selected during link mode
    linkingDOMElements: [],  // DOM elements visually marked as "linking"

    
    // --- Results viewing state ---
	resultsViewMode: false, // Whether the user is viewing results

    // --- Transport path mode ---
    transportPathMode: false, // Whether transport path visualization is active

    // --- UI element references ---
    ui: {
        canvas: null,                     // Main layout container
        highlightedConnectionLayer: null, // SVG layer for highlighted lines
        connectionLayer: null,            // SVG layer for normal lines
        jsonEditor: null,                 // JSON editor textarea
        jsonEditorContainer: null,        // Container for the editor panel
        jsonError: null,                  // Error display for JSON validation
        tranportPathList: null            // UI list of transport paths
    },
    
    results: {
        gradientSelect: null,   // Selection of the colour scheme
        speciesInput: null,     // Select the species population to view
        speciesList: null,      // List of the possible species to choose
        timeSlider: null,       // Slider to choose the time to view
        timeLabel: null,        // Label showing the time currently choosen
    }
};
