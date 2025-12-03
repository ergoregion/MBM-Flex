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
    }

    showForAperture(ap) {
        State.ui.jsonEditorContainer.style.display = "block";
        this.editor.value = JSON.stringify({ area: ap.area }, null, 2);
    }

    clear() {
        this.editor.value = "";
        State.ui.jsonEditorContainer.style.display = "none";
    }

    async onChange() {
        const el = State.selected;
        if (!el) return;

        const id = el.dataset.id;

        const txt = this.editor.value;

        const validation = await this.validator.validateRoomData(txt)
        console.log(validation)
        if (!validation.success) {
            this.error.style.display = "block";
            this.error.innerHTML = validation.message
            return;
        }


        this.error.style.display = "none";

        if (State.rooms.has(id)) {
            State.rooms.get(id).data = txt;
        } else if (State.apertures.has(id)) {
            const obj = safeParseJSON(this.editor.value, null);
            if (obj.area) State.apertures.get(id).area = Number(obj.area);
        }
    }
}
