// js/objects/Room.js

export class Room {

    constructor({ id, label, data, ui }) {
        this.id = id;
        this.label = label || `Room`;
        this.data = data || `{}`;   // room JSON string
        this.ui = ui;             // UI metadata (position, size)
    }

    setPosition(left, top) {
        this.ui.position.left = left;
        this.ui.position.top = top;
    }

    setSize(width, height) {
        this.ui.size.width = width;
        this.ui.size.height = height;
    }

    serialize() {
        return {
            id: this.id,
            label: this.label,
            data: this.data,
            ui: this.ui
        };
    }
}
