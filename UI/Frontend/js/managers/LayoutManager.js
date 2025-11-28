// js/managers/LayoutManager.js

import { State } from "../core/state.js";
import { downloadFile, safeParseJSON } from "../core/utils.js";

export class LayoutManager {

    constructor(roomManager, apertureManager, createDomRoom, createDomAperture) {
        this.roomManager = roomManager;
        this.apertureManager = apertureManager;

        // DOM creation functions
        this.createDomRoom = createDomRoom;
        this.createDomAperture = createDomAperture;
    }

    save() {
        const rooms = [];
        const apertures = [];

        State.rooms.forEach(room => rooms.push(room.serialize()));
        State.apertures.forEach(ap => apertures.push(ap.serialize()));

        const json = JSON.stringify({ rooms, apertures }, null, 2);
        downloadFile(json, "layout.json");
    }

    async load(fileList) {
        const master = await this.findMaster(fileList);
        if (!master) return;

        this.reset();

        const roomData = master.rooms;
        const apertureData = master.apertures;

        // 1. Rooms
        roomData.forEach(r => {
            const room = this.roomManager.createRoom(r);
            this.createDomRoom(room);
        });

        // 2. Apertures
        apertureData.forEach(ap => {
            const roomA = State.rooms.get(ap.rooms[0]);
            const roomB = State.rooms.get(ap.rooms[1]);
            if (roomA && roomB) {
                const aperture = this.apertureManager.createApertureBetween(roomA, roomB, ap.area);
                aperture.ui = ap.ui;
                this.createDomAperture(aperture);
            }
        });
    }

    reset() {
        State.ui.canvas.innerHTML = "";
        State.rooms.clear();
        State.apertures.clear();
    }

    async findMaster(files) {
        for (const f of files) {
            try {
                const text = await f.text();
                const json = safeParseJSON(text, null);
                if (json?.rooms && json?.apertures) return json;
            } catch {}
        }
        alert("Master file not found.");
        return null;
    }
}
