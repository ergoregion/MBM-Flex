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
import {makeLabelEditable} from "./core/utils.js"

window.onbeforeunload = function() {
  return "Data will be lost if you leave the page, are you sure?";
};

document.addEventListener("DOMContentLoaded", () => {

    // Setup UI refs
    State.ui.canvas = document.getElementById("canvas");
    State.ui.connectionLayer = document.getElementById("connection-lines");
    State.ui.highlightedConnectionLayer = document.getElementById("highlighted-lines");
    State.ui.jsonEditorContainer = document.getElementById("json-editor-container");
    State.ui.jsonEditor = document.getElementById("json-editor");
    State.ui.jsonError = document.getElementById("json-error");
    State.ui.tranportPathList = document.getElementById("transport-path-list")
    State.ui.resultsView = document.getElementById("results-view")


    const roomManager = new RoomManager();
    const apertureManager = new ApertureManager();
    const selectionManager = new SelectionManager();
    const renderer = new ConnectionRenderer();
    const dragResizeManager = new DragResizeManager(renderer);
    const jsonEditor = new JsonEditor();
    const transportPathManager= new TransportPathManager(renderer);
    const resultsViewManager= new ResultsViewManager();
    const toolbar = new Toolbar();

    
    function createDomAperture(aperture) {
        const el = document.createElement("div");
        el.className = "square aperture";
        el.dataset.id = aperture.id;

        if(aperture.grounded){
            el.textContent = aperture.rooms[1][0];
        }

        el.style.left = aperture.ui.position.left + "px";
        el.style.top = aperture.ui.position.top + "px";

        el.addEventListener("click", (e) => {
            e.stopPropagation();
            selectionManager.selectElement(el);
            jsonEditor.showForAperture(aperture);
        });

        el.addEventListener("mouseenter", () => renderer.highlightFor(el, true));
        el.addEventListener("mouseleave", () => renderer.highlightFor(el, false));

        State.ui.canvas.appendChild(el);
        dragResizeManager.attach(el);
        renderer.update()

        return el;
    }
    
    const linkModeManager = new LinkModeManager(
        apertureManager,
        createDomAperture
    );

    // DOM creation functions (injected into LayoutManager)
    function createDomRoom(room) {
        const el = document.createElement("div");
        el.className = "square room";
        el.dataset.id = room.id;

        el.style.left = room.ui.position.left + "px";
        el.style.top = room.ui.position.top + "px";
        el.style.width = room.ui.size.width + "px";
        el.style.height = room.ui.size.height + "px";

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = room.label;
        makeLabelEditable(label, room)
        el.appendChild(label);

        const handle = document.createElement("div");
        handle.className = "resize-handle";
        el.appendChild(handle);

        // selection
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

    const loadSaveManager = new LoadSaveManager(
        roomManager,
        apertureManager,
        createDomRoom,
        createDomAperture
    );

    // Toolbar buttons (assume you have elements with IDs)
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
        // link performed by clicking rooms + aperture
    };

    
    document.getElementById("deduce-transport-paths").onclick = () => {
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode();
        transportPathManager.start();
        resultsViewManager.end();
    };

    document.getElementById("save-layout").onclick = () => {
        console.log("save clicked")
        loadSaveManager.save()};

    document.getElementById("fileInput").addEventListener("change", async e => {
        await loadSaveManager.load(e.target.files);
        renderer.update();
        // Allow selecting the same file again
        e.target.value = ""
    });

    document.getElementById("resultsFileInput").addEventListener("change", async e => {
        console.log("changed to file " + e.target.files[0].name)
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode();
        transportPathManager.end();
        resultsViewManager.start(e.target.files[0]);
        // Allow selecting the same file again
        e.target.value = ""
    });

    document.getElementById("canvas").addEventListener("click", () => {
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode()
        transportPathManager.end();
        resultsViewManager.end();
    });

    
    document.addEventListener("keydown", (e) => {
    if (e.key === "Delete") {
        console.log("delete_pressed")
    }
    if (e.key === "Escape") {
        selectionManager.clearSelection();
        linkModeManager.disableLinkMode();
        transportPathManager.end();
        resultsViewManager.end();
    }
    });

    document.getElementById("link-mode-banner-front").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Front")
    });
    document.getElementById("link-mode-banner-back").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Back")
    });
    document.getElementById("link-mode-banner-left").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Left")
    });
    document.getElementById("link-mode-banner-right").addEventListener("click", () => {
        linkModeManager.linkClickBanner("Right")
    });

    renderer.update();


});
