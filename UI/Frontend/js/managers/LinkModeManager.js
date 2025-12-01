// js/managers/LinkModeManager.js

import { State } from "../core/state.js";

export class LinkModeManager {

    constructor(apertureManager, createDomAperture) {
        this.apertureManager = apertureManager;
        this.createDomAperture = createDomAperture;
    }

    
    enableLinkMode() {
        State.linkMode = true;
        State.linkSelection = [];
        document.dispatchEvent(new CustomEvent("ui:linkModeOn"));
    }

    linkRoom(room, el){
        if (!State.linkMode) return;
        if (room in State.linkSelection) return;
        State.linkSelection.push(room)

        
        el.classList.add("linking");
        State.linkingDOMElements.push(el);

        if(State.linkSelection.length == 2){
            const aperture = this.apertureManager.createApertureBetween(State.linkSelection[0], State.linkSelection[1]);
            this.createDomAperture(aperture);
            this.disableLinkMode()
        }

    }

    
    linkClickBanner(side){
        if (!State.linkMode) return;
        if (State.linkSelection.length != 1) return;
        const aperture = this.apertureManager.createGroundedAperture(State.linkSelection[0], side);
        this.createDomAperture(aperture);
        this.disableLinkMode()
    }
    
    disableLinkMode() {
        State.linkMode = false;
        State.linkSelection = [];
        document.dispatchEvent(new CustomEvent("ui:linkModeOff"));
        
        State.linkingDOMElements.forEach(element => {
            element.classList.remove("linking");
        }); 
        State.linkingDOMElements = [];
    }
}