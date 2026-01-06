// js/managers/SelectionManager.js
import { State } from "../core/state.js";

/**
 * Handles selecting and deselecting UI elements (rooms, apertures, etc.).
 * Ensures only one element can be selected at a time and updates the
 * global UI state accordingly.
 */
export class SelectionManager {

    /**
     * Clears the current selection.
     * Removes the visual highlight and hides the JSON editor panel.
     */
    clearSelection() {
        if (State.selected) {
            State.selected.classList.remove("selected");
        }

        State.selected = null;
        State.ui.jsonEditorContainer.style.display = "none";
    }

    /**
     * Selects a given DOM element.
     * Applies the visual highlight, focuses the element,
     * and updates global selection state.
     *
     * @param {HTMLElement} el - The element to select.
     */
    selectElement(el) {
        this.clearSelection();

        el.focus();
        el.classList.add("selected");

        State.selected = el;
    }
}
