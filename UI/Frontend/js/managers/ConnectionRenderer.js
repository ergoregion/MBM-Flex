// js/managers/ConnectionRenderer.js

import { State } from "../core/state.js";
import { getCenter } from "../core/utils.js";

export class ConnectionRenderer {

    update() {
        const svg = State.ui.connectionLayer;
        const highlightSvg = State.ui.highlightedConnectionLayer;
        const canvas = State.ui.canvas;

        svg.innerHTML = "";
        highlightSvg.innerHTML = "";

        const apertures = State.apertures;

        apertures.forEach(ap => {
            const apEl = document.querySelector(`[data-id="${ap.id}"]`);
            if (!apEl) return;

            const apCenter = getCenter(apEl, canvas);

            ap.rooms.forEach(rid => {
                const room = State.rooms.get(rid);
                if (!room) return;

                const roomEl = document.querySelector(`[data-id="${rid}"]`);
                if (!roomEl) return;

                const rCenter = getCenter(roomEl, canvas);

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", apCenter.x);
                line.setAttribute("y1", apCenter.y);
                line.setAttribute("x2", rCenter.x);
                line.setAttribute("y2", rCenter.y);
                line.setAttribute("stroke", "green");
                line.setAttribute("stroke-width", "2");
                line.classList.add("connection-line");
                line.dataset.apertureId = ap.id;
                line.dataset.roomId = rid;

                svg.appendChild(line);
            });
        });
    }

    highlightFor(el, mode) {
        const svg = State.ui.connectionLayer;
        const highlightSvg = State.ui.highlightedConnectionLayer;
        const id = el.dataset.id;

        document.querySelectorAll(".connection-line").forEach(line => {
            if (line.dataset.apertureId === id) {
                if(mode){
                    highlightSvg.appendChild(line)
                }
                else{
                    svg.appendChild(line);
                }

                line.classList.toggle("highlight", mode);
            }
        });
    }
    
    transportModeFor(path, mode) {
        const svg = State.ui.connectionLayer;
        const highlightSvg = State.ui.highlightedConnectionLayer;
        document.querySelectorAll(".connection-line").forEach(line => {
            if (path.includes(line.dataset.apertureId)) {
                if(mode){
                    highlightSvg.appendChild(line)
                }
                else{
                    svg.appendChild(line);
                }

                line.classList.toggle("transport", mode);
            }
        });
    }
}
