// js/ui/Toolbar.js

export class Toolbar {

    constructor() {
        this.banner = document.getElementById("link-mode-banner");

        document.addEventListener("ui:linkModeOn", () => {
            this.banner.style.display = "block";
        });

        document.addEventListener("ui:linkModeOff", () => {
            this.banner.style.display = "none";
        });
    }
}
