import { State } from "../core/state.js";
import { TransportPathDeductionInterface } from "../interfaces/TransportPathDeductionInterface.js";

export class TransportPathManager {
    
    constructor(connectionRenderer) {
        this.renderer = connectionRenderer;
        this.transportPathDeductionInterface= TransportPathDeductionInterface()
    }


    start() {
        if (State.transportPathMode) return;
        State.transportPathMode = true;
        
        State.ui.tranportPathList.style.display = "flex";

        const pathPromise = this.transportPathDeductionInterface.deducePaths();
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