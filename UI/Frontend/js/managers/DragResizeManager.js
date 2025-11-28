// js/managers/DragResizeManager.js
import { State } from "../core/state.js";
import { throttle } from "../core/utils.js";

export class DragResizeManager {

    constructor(connectionRenderer) {
        this.renderer = connectionRenderer;

        this.dragging = null;
        this.resizing = null;

        this.offsetX = 0;
        this.offsetY = 0;

        this.throttledRender = throttle(() => this.renderer.update(), 16);
    }

    attach(el) {
        el.addEventListener("mousedown", e => {
            if (e.target.classList.contains("resize-handle")) {
                this.startResize(el, e);
            } else {
                this.startDrag(el, e);
            }
        });
    }

    startDrag(el, e) {
    if (State.linkMode) return;

    this.dragging = el;

    // Get current position
    const left = parseInt(el.style.left || 0, 10);
    const top = parseInt(el.style.top || 0, 10);

    // Calculate offset relative to mouse
    this.offsetX = e.clientX - left;
    this.offsetY = e.clientY - top;

    document.addEventListener("mousemove", this.onDrag);
    document.addEventListener("mouseup", this.stopDrag);
}

    onDrag = (e) => {
        if (!this.dragging) return;

        const left = e.clientX - this.offsetX;
        const top = e.clientY - this.offsetY;

        this.dragging.style.left = left + "px";
        this.dragging.style.top = top + "px";

        this.updateUIData(this.dragging, left, top);

        this.throttledRender();
    };

    stopDrag = () => {
        this.dragging = null;
        document.removeEventListener("mousemove", this.onDrag);
        document.removeEventListener("mouseup", this.stopDrag);
    };

    startResize(el, e) {
        this.resizing = el;
        document.addEventListener("mousemove", this.onResize);
        document.addEventListener("mouseup", this.stopResize);
    }

    onResize = (e) => {
        if (!this.resizing) return;

        const rect = this.resizing.getBoundingClientRect();
        const width = Math.max(40, e.clientX - rect.left);
        const height = Math.max(40, e.clientY - rect.top);

        this.resizing.style.width = width + "px";
        this.resizing.style.height = height + "px";

        const id = this.resizing.dataset.id;
        const room = State.rooms.get(id);
        if (room) room.setSize(width, height);

        this.throttledRender();
    };

    stopResize = () => {
        this.resizing = null;
        document.removeEventListener("mousemove", this.onResize);
        document.removeEventListener("mouseup", this.stopResize);
    };

    updateUIData(el, left, top) {
        const id = el.dataset.id;

        if (State.rooms.has(id)) {
            State.rooms.get(id).setPosition(left, top);
        }

        if (State.apertures.has(id)) {
            State.apertures.get(id).ui.position.left = left;
            State.apertures.get(id).ui.position.top = top;
        }
    }
}
