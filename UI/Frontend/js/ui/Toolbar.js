/**
 * Controls the toolbar UI elements, specifically the banner that appears
 * when link mode is active.
 *
 * Listens for global UI events fired by the LinkModeManager and updates
 * the banner visibility accordingly.
 */
export class Toolbar {

    constructor() {
        // Banner shown when the user is in link mode
        this.banner = document.getElementById("link-mode-banner");

        // Show banner when link mode is activated
        document.addEventListener("ui:linkModeOn", () => {
            this.banner.style.display = "block";
        });

        // Hide banner when link mode is deactivated
        document.addEventListener("ui:linkModeOff", () => {
            this.banner.style.display = "none";
        });
    }
}
