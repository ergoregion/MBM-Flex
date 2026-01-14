import { State } from "../core/state.js";
import { throttle } from "../core/utils.js";

/**
 * Handles dragging and resizing of room/aperture UI elements.
 * Also triggers connection re-rendering while moving/resizing.
 */
export class DragResizeManager {

    constructor(connectionRenderer) {
        this.renderer = connectionRenderer;

        // Element currently being dragged or resized
        this.dragging = null;
        this.resizing = null;

        // Mouse offset relative to element's top-left corner during drag
        this.offsetX = 0;
        this.offsetY = 0;

        // Throttled renderer to avoid excessive SVG updates during movement
        this.throttledRender = throttle(() => this.renderer.update(), 16);
    }

    /**
     * Attach drag/resize behavior to a DOM element.
     * A child with class "resize-handle" triggers resizing instead of dragging.
     */
    attach(el) {
        el.addEventListener("mousedown", e => {
            if (e.target.classList.contains("resize-handle")) {
                this.startResize(el, e);
            } else {
                this.startDrag(el, e);
            }
        });
    }

    /**
     * Begin dragging an element.
     * Disabled when linkMode is active (to avoid interfering with connection creation).
     */
    startDrag(el, e) {
        if (State.linkMode) return;

        this.dragging = el;

        // Current element position
        const left = parseInt(el.style.left || 0, 10);
        const top = parseInt(el.style.top || 0, 10);

        // Mouse offset ensures smooth dragging without snapping
        this.offsetX = e.clientX - left;
        this.offsetY = e.clientY - top;

        document.addEventListener("mousemove", this.onDrag);
        document.addEventListener("mouseup", this.stopDrag);
    }

    /**
     * Drag handler: updates element position and syncs state.
     */
    onDrag = (e) => {
        if (!this.dragging) return;

        const left = e.clientX - this.offsetX;
        const top = e.clientY - this.offsetY;

        // Move element visually
        this.dragging.style.left = left + "px";
        this.dragging.style.top = top + "px";

        // Update underlying room/aperture data model
        this.updateUIData(this.dragging, left, top);

        // Re-render connection lines (throttled)
        this.throttledRender();
    };

    /**
     * End dragging and remove event listeners.
     */
    stopDrag = () => {
        this.dragging = null;
        document.removeEventListener("mousemove", this.onDrag);
        document.removeEventListener("mouseup", this.stopDrag);
    };

    /**
     * Begin resizing an element.
     */
    startResize(el, e) {
        this.resizing = el;
        document.addEventListener("mousemove", this.onResize);
        document.addEventListener("mouseup", this.stopResize);
    }

    /**
     * Resize handler: updates element dimensions and syncs state.
     */
    onResize = (e) => {
        if (!this.resizing) return;

        const rect = this.resizing.getBoundingClientRect();

        // Minimum size enforced to avoid collapsing the element
        const width = Math.max(40, e.clientX - rect.left);
        const height = Math.max(40, e.clientY - rect.top);

        this.resizing.style.width = width + "px";
        this.resizing.style.height = height + "px";

        // Update room size in state (apertures cannot be resized)
        const id = this.resizing.dataset.id;
        const room = State.rooms.get(id);
        if (room) room.setSize(width, height);

        this.throttledRender();
    };

    /**
     * End resizing and remove event listeners.
     */
    stopResize = () => {
        this.resizing = null;
        document.removeEventListener("mousemove", this.onResize);
        document.removeEventListener("mouseup", this.stopResize);
    };

    /**
     * Sync UI element movement with underlying room/aperture data.
     * Keeps the logical model aligned with the visual representation.
     */
    updateUIData(el, left, top) {
        const id = el.dataset.id;

        // Update room position
        if (State.rooms.has(id)) {
            State.rooms.get(id).setPosition(left, top);
        }

        // Update aperture position
        if (State.apertures.has(id)) {
            State.apertures.get(id).ui.position.left = left;
            State.apertures.get(id).ui.position.top = top;
        }
    }
}
