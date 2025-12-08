// js/managers/LayoutManager.js

import { State } from "../core/state.js";
import { downloadFile, safeParseJSON } from "../core/utils.js";

export class LoadSaveManager {

    constructor(roomManager, apertureManager, createDomRoom, createDomAperture) {
        this.roomManager = roomManager;
        this.apertureManager = apertureManager;

        // DOM creation functions
        this.createDomRoom = createDomRoom;
        this.createDomAperture = createDomAperture;
    }

    
    getRoomLabel(roomId) {
        return State.rooms.get(roomId).label;
    }

    save() {        
        const roomFiles = {};
        const aperturesList = [];
        const ui_data = {};

        State.rooms.forEach(room => {
            const label = room.label
            const filename = `room_${label}.json`;
            downloadFile(room.data, filename);
            roomFiles[label] = filename;
            ui_data[label] = room.ui
        });
        
        const ui_aperture_data = [];
        State.apertures.forEach(ap => {
            const rooms = ap.rooms;
            ui_aperture_data.push(ap.ui)
            
            if(ap.grounded){

                const originRoom = this.getRoomLabel(rooms[0]);
                const destination = rooms[1];
                aperturesList.push({
                origin: originRoom,
                destination: destination,
                area: ap.area
                });

            }
            else if (rooms.length === 2) {
                const originRoom = this.getRoomLabel(rooms[0]);
                const destRoom = this.getRoomLabel(rooms[1]);

                aperturesList.push({
                origin: originRoom,
                destination: destRoom,
                area: ap.area
                });
            }
        });

        ui_data[`apertures`]= ui_aperture_data
        // Master file
        const masterJson = JSON.stringify(
            {
            rooms: roomFiles,
            apertures: aperturesList,
            ui: ui_data
            },
            null,
            2
        );

        downloadFile(masterJson, "layout_master.json");
    }

    async load(fileList) {
        const master = await this.findMaster(fileList);
        if (!master) return;

        this.reset();

        const roomData = master.rooms;
        const apertureData = master.apertures;
        const uiData = master.ui
        const hasUIData = uiData != null

        const temp_rooms={}
        // 1. Rooms
        for (const [key, value] of Object.entries(roomData)) {
            const file_name_only = value.substring(value.lastIndexOf('/')+1)
            const matchingFile =  [...fileList].find((f) => f.name === file_name_only);
            const text =  matchingFile ? await matchingFile.text() : `{}`;
            const roomUIData = hasUIData? uiData[key] : null;
            const room = this.roomManager.createRoom({label : key, data: text, ui:roomUIData});
            temp_rooms[key] = room;
            this.createDomRoom(room);
        }

        // 2. Apertures
        for (const [i, ap] of apertureData.entries()){
            const roomA = temp_rooms[ap.origin];
            const roomB = temp_rooms[ap.destination];
            if (roomA && roomB) {
                const aperture = this.apertureManager.createApertureBetween(roomA, roomB, ap.area);
                if(hasUIData){
                    aperture.ui = uiData.apertures[i];
                }
                this.createDomAperture(aperture);
            }
            else if (roomA) {
                const aperture = this.apertureManager.createGroundedAperture(roomA, ap.destination, ap.area);
                if(hasUIData){
                    aperture.ui = uiData.apertures[i];
                }
                this.createDomAperture(aperture);
            }
        };
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