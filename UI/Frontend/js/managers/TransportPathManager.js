import { State } from "../core/state.js";

export class TransportPathManager {
    
    constructor(connectionRenderer) {
        this.renderer = connectionRenderer;
    }

    getRoomLabel(roomId) {
        return State.rooms.get(roomId).label;
    }

    path_input(){
        const aperture_data = [];
        State.apertures.forEach(ap => {   
            const rooms = ap.rooms;   
            if(ap.grounded){

                const originRoom = this.getRoomLabel(rooms[0]);
                const destination = rooms[1];
                aperture_data.push({
                origin: originRoom,
                destination: destination,
                id: ap.id
                });

            }
            else if (rooms.length === 2) {
                const originRoom = this.getRoomLabel(rooms[0]);
                const destRoom = this.getRoomLabel(rooms[1]);
                aperture_data.push({
                origin: originRoom,
                destination: destRoom,
                id: ap.id
                });
            }
        });
        return aperture_data
    }

    
    async invoke(apertures) {
        const result = await fetch(`/transport/paths`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({apertures})
        });
        return result.json();
    }

    deducePaths(){
        const input = this.path_input();
        const pathPromise = this.invoke(input);
        return pathPromise
    }

    start() {
        if (State.transportPathMode) return;
        State.transportPathMode = true;
        
        State.ui.tranportPathList.style.display = "flex";

        const pathPromise = this.deducePaths();
        pathPromise.then((paths) => {
            for (let i = 0; i < paths.length; i++) {
                const tile = document.createElement("div");
                tile.className = "tile";
                State.ui.tranportPathList.appendChild(tile);
                tile.addEventListener("mouseenter", () => this.highlightFor(paths[i], true));
                tile.addEventListener("mouseleave", () => this.highlightFor(paths[i], false));
            }
        
        });
    }

    end(){
        if (!State.transportPathMode) return;
        console.log("leaving tp mode")
        State.transportPathMode = false;
        State.ui.tranportPathList.style.display = "none";
        State.ui.tranportPathList.innerHTML = 'Transport paths:';

    }
    
    highlightFor(path, mode) {
        this.renderer.transportModeFor(path, mode)
        document.querySelectorAll(".aperture").forEach(aperture => {
            console.log(aperture.dataset.id + " is in path: " +path.includes(aperture.dataset.id))
            if (path.includes(aperture.dataset.id)) {
                aperture.classList.toggle("transport", mode);
            }
        });
    }
}