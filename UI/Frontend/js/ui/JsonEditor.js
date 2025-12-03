// js/ui/JsonEditor.js

import { State } from "../core/state.js";
import { safeParseJSON } from "../core/utils.js";
import { JsonValidatorInterface } from "../interfaces/jsonValidatorInterface.js";

export class JsonEditor {

    constructor() {
        this.editor = State.ui.jsonEditor;
        this.error = State.ui.jsonError;

        this.editor.addEventListener("input", () => this.onChange());

        this.validator = new JsonValidatorInterface()
    }

    showForRoom(room) {
        State.ui.jsonEditorContainer.style.display = "block";
        this.editor.value = room.data;
        this.check_room()
    }

    showForAperture(ap) {
        State.ui.jsonEditorContainer.style.display = "block";
        this.editor.value = JSON.stringify({ area: ap.area }, null, 2);
        this.check_aperture()
    }

    clear() {
        this.editor.value = "";
        State.ui.jsonEditorContainer.style.display = "none";
    }

    
    async check_room() {
        const txt = this.editor.value;
        const validation = await this.validator.validateRoomData(txt)
        if (!validation.success) {
            this.error.style.display = "block";
            this.error.innerHTML = validation.message
        }
        else{
            this.error.style.display = "none";
        }
    }
    
    async check_aperture() {
        const obj = safeParseJSON(this.editor.value, null);
        if (obj != null && obj.area) {
            this.error.style.display = "none";
        }
        else{
            this.error.style.display = "block";
            this.error.innerHTML = "Area of aperture not defined"
        }
    }

    async onChange() {
        const el = State.selected;
        if (!el) return;

        const id = el.dataset.id;

        const txt = this.editor.value;

        if (State.rooms.has(id)) {
            this.check_room()
            State.rooms.get(id).data = txt;
        } else if (State.apertures.has(id)) {
            this.check_aperture()
            const obj = safeParseJSON(this.editor.value, null);
            if (obj.area) State.apertures.get(id).area = Number(obj.area);
        }
    }
}
