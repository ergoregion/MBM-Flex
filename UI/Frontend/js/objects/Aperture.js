// js/objects/Aperture.js

export class Aperture {

    constructor({ id, area, rooms, ui }) {
        this.id = id;
        this.area = area ?? 1.0;
        this.rooms = rooms || [];  // linked room IDs
        this.ui = ui || { position: { left: 0, top: 0 } };
    }

    serialize() {
        return {
            id: this.id,
            area: this.area,
            rooms: this.rooms,
            ui: this.ui
        };
    }
}
