import { State } from "../core/state.js";
import { downloadFile, safeParseJSON } from "../core/utils.js";

/**
 * Handles exporting and importing complete layout configurations.
 * A layout consists of:
 *   - Individual room JSON files
 *   - A master file describing connections and UI metadata
 *
 * This manager coordinates saving/loading both the logical model
 * (rooms, apertures) and the UI state (positions, sizes).
 */
export class LoadSaveManager {

    constructor(roomManager, apertureManager, createDomRoom, createDomAperture) {
        this.roomManager = roomManager;
        this.apertureManager = apertureManager;

        // Functions responsible for creating DOM elements for rooms/apertures
        this.createDomRoom = createDomRoom;
        this.createDomAperture = createDomAperture;
    }

    /**
     * Convenience helper: returns the label for a room ID.
     * Labels are used as keys in the saved master file.
     */
    getRoomLabel(roomId) {
        return State.rooms.get(roomId).label;
    }

    /**
     * Saves the entire layout to disk.
     * Produces:
     *   - One JSON file per room (its raw data)
     *   - A master JSON file describing:
     *       - room filenames
     *       - aperture connections
     *       - UI metadata for rooms and apertures
     */
    save() {        
        const roomFiles = {};
        const aperturesList = [];
        const ui_data = {};

        // --- Save rooms ---
        State.rooms.forEach(room => {
            const label = room.label;
            const filename = `room_${label}.json`;

            // Save raw room data as its own file
            downloadFile(room.data, filename);

            roomFiles[label] = filename;
            ui_data[label] = room.ui; // store UI metadata
        });
        
        // --- Save apertures ---
        const ui_aperture_data = [];

        State.apertures.forEach(ap => {
            const rooms = ap.rooms;
            ui_aperture_data.push(ap.ui);

            // Grounded apertures connect a room to a side (Front/Back/Left/Right)
            if (ap.grounded) {
                const originRoom = this.getRoomLabel(rooms[0]);
                const destination = rooms[1];

                aperturesList.push({
                    origin: originRoom,
                    destination: destination,
                    area: ap.area
                });
            }
            // Normal apertures connect two rooms
            else if (rooms.length === 2) {
                const originRoom = this.getRoomLabel(rooms[0]);
                const destRoom = this.getRoomLabel(rooms[1]);

                aperturesList.push({
                    origin: originRoom,
                    destination: destRoom,
                    area: ap.area
                });
            }
        });

        ui_data["apertures"] = ui_aperture_data;

        // --- Save master file ---
        const masterJson = JSON.stringify(
            {
                rooms: roomFiles,
                apertures: aperturesList,
                ui: ui_data
            },
            null,
            2
        );

        downloadFile(masterJson, "layout_master.json");
    }

    /**
     * Loads a layout from a set of uploaded files.
     * Expects:
     *   - A master file describing the layout
     *   - Room files referenced by the master file
     *
     * Reconstructs:
     *   - Room objects + DOM
     *   - Aperture objects + DOM
     *   - UI metadata (positions, sizes)
     */
    async load(fileList) {
        const master = await this.findMaster(fileList);
        if (!master) return;

        this.reset();

        const roomData = master.rooms;
        const apertureData = master.apertures;
        const uiData = master.ui;
        const hasUIData = uiData != null;

        const temp_rooms = {};

        // --- 1. Load rooms ---
        for (const [label, filename] of Object.entries(roomData)) {
            // Extract filename only (master may store paths)
            const file_name_only = filename.substring(filename.lastIndexOf('/') + 1);

            // Find matching uploaded file
            const matchingFile = [...fileList].find(f => f.name === file_name_only);
            const text = matchingFile ? await matchingFile.text() : `{}`;

            const roomUIData = hasUIData ? uiData[label] : null;

            // Create room object
            const room = this.roomManager.createRoom({
                label: label,
                data: text,
                ui: roomUIData
            });

            temp_rooms[label] = room;

            // Create DOM element for the room
            this.createDomRoom(room);
        }

        // --- 2. Load apertures ---
        for (const [i, ap] of apertureData.entries()) {
            const roomA = temp_rooms[ap.origin];
            const roomB = temp_rooms[ap.destination];

            // Normal aperture between two rooms
            if (roomA && roomB) {
                const aperture = this.apertureManager.createApertureBetween(
                    roomA,
                    roomB,
                    ap.area
                );

                if (hasUIData) {
                    aperture.ui = uiData.apertures[i];
                }

                this.createDomAperture(aperture);
            }
            // Grounded aperture (room → side)
            else if (roomA) {
                const aperture = this.apertureManager.createGroundedAperture(
                    roomA,
                    ap.destination,
                    ap.area
                );

                if (hasUIData) {
                    aperture.ui = uiData.apertures[i];
                }

                this.createDomAperture(aperture);
            }
        }
    }

    /**
     * Clears all rooms, apertures, and UI elements.
     * Used before loading a new layout.
     */
    reset() {
        State.ui.canvas.innerHTML = "";
        State.rooms.clear();
        State.apertures.clear();
    }

    /**
     * Attempts to locate and parse the master layout file
     * from a list of uploaded files.
     * The master file is identified by containing both:
     *   - "rooms"
     *   - "apertures"
     */
    async findMaster(files) {
        for (const f of files) {
            try {
                const text = await f.text();
                const json = safeParseJSON(text, null);

                if (json?.rooms && json?.apertures) {
                    return json;
                }
            } catch {
                // Ignore parse errors and continue searching
            }
        }

        alert("Master file not found.");
        return null;
    }
}
