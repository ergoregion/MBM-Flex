import { State } from "../core/state.js";
import { safeParseJSON } from "../core/utils.js";
import { JsonValidatorInterface } from "../interfaces/jsonValidatorInterface.js";

/**
 * Handles the JSON editor panel used to edit room and aperture data.
 * 
 * Responsibilities:
 *  - Showing/hiding the editor when an element is selected
 *  - Validating JSON input (rooms validated via backend, apertures locally)
 *  - Updating the underlying Room/Aperture objects as the user types
 */
export class JsonEditor {

    constructor() {
        this.editor = State.ui.jsonEditor;
        this.error = State.ui.jsonError;

        // Re-validate and update data whenever the user types
        this.editor.addEventListener("input", () => this.onChange());

        // Backend validator for room JSON
        this.validator = new JsonValidatorInterface();
    }

    /**
     * Displays the editor for a room and loads its JSON content.
     */
    showForRoom(room) {
        State.ui.jsonEditorContainer.style.display = "block";
        this.editor.value = room.data;
        this.check_room();
    }

    /**
     * Displays the editor for an aperture.
     * Apertures only expose their "area" property for editing.
     */
    showForAperture(ap) {
        State.ui.jsonEditorContainer.style.display = "block";
        this.editor.value = JSON.stringify({ area: ap.area }, null, 2);
        this.check_aperture();
    }

    /**
     * Clears and hides the editor.
     */
    clear() {
        this.editor.value = "";
        State.ui.jsonEditorContainer.style.display = "none";
    }

    /**
     * Validates room JSON by sending it to the backend validator.
     * Displays validation errors in the UI.
     */
    async check_room() {
        const txt = this.editor.value;
        const validation = await this.validator.validateRoomData(txt);

        if (!validation.success) {
            this.error.style.display = "block";
            this.error.innerHTML = validation.message;
        } else {
            this.error.style.display = "none";
        }
    }

    /**
     * Validates aperture JSON locally.
     * Apertures only require an "area" field.
     */
    async check_aperture() {
        const obj = safeParseJSON(this.editor.value, null);

        if (obj != null && obj.area) {
            this.error.style.display = "none";
        } else {
            this.error.style.display = "block";
            this.error.innerHTML = "Area of aperture not defined";
        }
    }

    /**
     * Called whenever the user types in the editor.
     * Updates the underlying Room or Aperture object and re-validates.
     */
    async onChange() {
        const el = State.selected;
        if (!el) return;

        const id = el.dataset.id;
        const txt = this.editor.value;

        // Editing a room
        if (State.rooms.has(id)) {
            this.check_room();
            State.rooms.get(id).data = txt;
        }

        // Editing an aperture
        else if (State.apertures.has(id)) {
            this.check_aperture();
            const obj = safeParseJSON(txt, null);
            if (obj?.area) {
                State.apertures.get(id).area = Number(obj.area);
            }
        }
    }
}
