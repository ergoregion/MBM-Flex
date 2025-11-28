// js/managers/SelectionManager.js
import { State } from "../core/state.js";

export class SelectionManager {

    clearSelection() {
        if (State.selected) {
            State.selected.classList.remove("selected");
        }
        State.selected = null;
        State.ui.jsonEditorContainer.style.display = "none";
    }

    selectElement(el) {
        this.clearSelection();
        el.classList.add("selected");
        State.selected = el;
    }


}
