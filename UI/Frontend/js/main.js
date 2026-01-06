// js/main.js

import { State } from "./core/state.js";
import { RoomManager } from "./managers/RoomManager.js";
import { ApertureManager } from "./managers/ApertureManager.js";
import { SelectionManager } from "./managers/SelectionManager.js";
import { DragResizeManager } from "./managers/DragResizeManager.js";
import { ConnectionRenderer } from "./managers/ConnectionRenderer.js";
import { LoadSaveManager } from "./managers/LoadSaveManager.js";
import { LinkModeManager } from "./managers/LinkModeManager.js";
import { TransportPathManager } from "./managers/TransportPathManager.js";
import { ResultsViewManager } from "./managers/ResultsViewManager.js";
import { JsonEditor } from "./ui/JsonEditor.js";
import { Toolbar } from "./ui/Toolbar.js";
import { makeLabelEditable } from "./core/utils.js";

// Warn user before leaving the page
window.onbeforeunload = function() {
  return "Data will be lost if you leave the page, are you sure?";
};

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------------
    // Initialize UI references
    // ------------------------------------------------------------
    State.ui.canvas = document.getElementById("canvas");
    State.ui.connectionLayer = document.getElementById("connection-lines");
    State.ui.highlightedConnectionLayer = document.getElementById("highlighted-lines");
    State.ui.jsonEditorContainer = document.getElementById("json-editor-container");
    State.ui.jsonEditor = document.getElementById("json-editor");
    State.ui.jsonError = document.getElementById("json-error");
    State.ui.tranportPathList = document.getElementById("transport-path-list")
    State.ui.resultsView = document.getElementById("results-view")

    State.results.gradientSelect = document.getElementById("gradientSelect");
    State.results.speciesInput = document.getElementById("speciesInput");
    State.results.speciesList = document.getElementById("speciesList");
    State.results.timeSlider = document.getElementById("timeSlider");
    State.results.timeLabel = document.getElementById("timeLabel");

    // ------------------------------------------------------------
    // Instantiate core managers
    // ------------------------------------------------------------
    const roomManager = new RoomManager();
    const apertureManager = new ApertureManager();
    const selectionManager = new SelectionManager();
    const renderer = new ConnectionRenderer();
    const dragResizeManager = new DragResizeManager(renderer);
    const jsonEditor = new JsonEditor();
    const transportPathManager= new TransportPathManager(renderer);
    const resultsViewManager= new ResultsViewManager();
    const toolbar = new Toolbar();

    // ------------------------------------------------------------
    // DOM creation helper for apertures
    // Called by LinkModeManager and LoadSaveManager
    // ------------------------------------------------------------
    function createDomAperture(aperture) {
        const el = document.createElement("div");
        el.className = "square aperture";
        el.dataset.id = aperture.id;

        // Grounded apertures display the side initial (F/B/L/R)
        if (aperture.grounded) {
            el.textContent = aperture.rooms[1][0];
        }

        // Position aperture on canvas
        el.style.left = aperture.ui.position.left + "px";
        el.style.top = aperture.ui.position.top + "px";

        // Selection + JSON editing
        el.addEventListener("click", (e) => {
            e.stopPropagation();
            selectionManager.selectElement(el);
            jsonEditor.showForAperture(aperture);
        });

        // Hover highlighting of connection lines
        el.addEventListener("mouseenter", () => renderer.highlightFor(el, true));
        el.addEventListener("mouseleave", () => renderer.highlightFor(el, false));

        State.ui.canvas.appendChild(el);
        dragResizeManager.attach(el);
        renderer.update();

        return el;
    }

    // Link mode manager (needs aperture creation callback)
    const linkModeManager = new LinkModeManager(
        apertureManager,
        createDomAperture
    );

    // ------------------------------------------------------------
    // DOM creation helper for rooms
    // Called by LoadSaveManager and toolbar actions
    // ------------------------------------------------------------
    function createDomRoom(room) {
        const el = document.createElement("div");
        el.className = "square room";
        el.dataset.id = room.id;

        // Apply UI position + size
        el.style.left = room.ui.position.left + "px";
        el.style.top = room.ui.position.top + "px";
        el.style.width = room.ui.size.width + "px";
        el.style.height = room.ui.size.height + "px";

        // Room label (editable)
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = room.label;
        makeLabelEditable(label, room);
        el.appendChild(label);

        // Resize handle
        const handle = document.createElement("div");
        handle.className = "resize-handle";
        el.appendChild(handle);

        // Selection + JSON editing + link mode integration
        el.addEventListener("click", e => {
            e.stopPropagation();
            if (!e.target.classList.contains("resize-handle")) {
                selectionManager.selectElement(el);
                jsonEditor.showForRoom(room);
                linkModeManager.linkRoom(room, el);
            }
        });

        State.ui.canvas.appendChild(el);
        dragResizeManager.attach(el);

        return el;
    }

    // ------------------------------------------------------------
    // Load/save manager (injects DOM creation functions)
    // ------------------------------------------------------------
    const loadSaveManager = new LoadSaveManager(
        roomManager,
        apertureManager,
        createDomRoom,
        createDomAperture
    );

    // ------------------------------------------------------------
    // Toolbar button actions
    // ------------------------------------------------------------
    document.getElementById("add-room").onclick = () => {
        selectionManager.clearSelection();
        transportPathManager.end();
        resultsViewManager.end();
        const room = roomManager.createRoom({});
        createDomRoom(room);
    };

    document.getElementById("add-aperture").onclick = () => {
        selectionManager.clearSelection();
        transportPathManager.end();
        resultsViewManager.end();
        linkModeManager.enableLinkMode();
    };

    document.getElementById("deduce-transport-paths").onclick = () => {
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode();
        transportPathManager.start();
        resultsViewManager.end();
    };

    document.getElementById("save-layout").onclick = () => {
        loadSaveManager.save();
    };

    // Load layout from uploaded files
    document.getElementById("fileInput").addEventListener("change", async e => {
        await loadSaveManager.load(e.target.files);
        renderer.update();
        e.target.value = ""; // allow re-uploading same file
    });

    document.getElementById("resultsFileInput").addEventListener("change", async e => {
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode();
        transportPathManager.end();
        resultsViewManager.start(e.target.files[0]);
        e.target.value = "";  // allow re-uploading same file
    });

    document.getElementById("canvas").addEventListener("click", () => {
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode()
        transportPathManager.end();
    });

    
    // ------------------------------------------------------------
    // Changing the results viewed
    // ------------------------------------------------------------
    State.results.speciesInput.addEventListener("change", () => {resultsViewManager.select_species()});
    State.results.timeSlider.addEventListener("input", () => {resultsViewManager.select_time()});
    State.results.gradientSelect.addEventListener("change", () => {resultsViewManager.select_gradient()});


    // ------------------------------------------------------------
    // Keyboard shortcuts
    // ------------------------------------------------------------
    document.addEventListener("keydown", (e) => {
        if (e.key === "Delete") {
            console.log("delete_pressed");
        }
        if (e.key === "Escape") {
            selectionManager.clearSelection();
            linkModeManager.disableLinkMode();
            transportPathManager.end();
            resultsViewManager.end();
        }
    });

    // Link mode banner side buttons
    document.getElementById("link-mode-banner-front").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Front");
    });
    document.getElementById("link-mode-banner-back").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Back");
    });
    document.getElementById("link-mode-banner-left").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Left");
    });
    document.getElementById("link-mode-banner-right").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Right");
    });

    // Initial render
    renderer.update();
});
