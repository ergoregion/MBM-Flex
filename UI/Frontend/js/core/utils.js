/**
 * Generates a unique ID using the browser's cryptographic UUID generator.
 * Used for rooms, apertures, and other uniquely identifiable objects.
 */
export function generateId() {
    return crypto.randomUUID();
}

/**
 * Computes the center point of an element relative to a container.
 * Useful for drawing connection lines between UI elements.
 *
 * @param {HTMLElement} el - The element whose center is needed.
 * @param {HTMLElement} container - The reference container (e.g., canvas).
 * @returns {{x:number, y:number}}
 */
export function getCenter(el, container) {
    const rect = el.getBoundingClientRect();
    const crect = container.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - crect.left,
        y: rect.top + rect.height / 2 - crect.top,
    };
}

/**
 * Triggers a download of a text file in the browser.
 * Used for exporting room files and the master layout file.
 *
 * @param {string} text - File contents.
 * @param {string} filename - Name of the downloaded file.
 */
export function downloadFile(text, filename) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

/**
 * Safely parses JSON, returning a fallback value if parsing fails.
 * Prevents crashes when loading malformed room files.
 *
 * @param {string} text - JSON string.
 * @param {*} fallback - Value returned on parse failure.
 */
export function safeParseJSON(text, fallback = {}) {
    try { 
        return JSON.parse(text); 
    } catch { 
        return fallback; 
    }
}

/**
 * Creates a throttled version of a function.
 * Ensures the function runs at most once every `delay` milliseconds.
 * Used to limit expensive UI updates during dragging/resizing.
 *
 * @param {Function} fn - Function to throttle.
 * @param {number} delay - Minimum time between calls.
 */
export function throttle(fn, delay) {
    let last = 0;
    return (...args) => {
        const now = performance.now();
        if (now - last >= delay) {
            last = now;
            fn(...args);
        }
    };
}

/**
 * Makes a room label editable in-place.
 * Handles:
 *   - enabling contentEditable on double-click
 *   - saving changes on blur or Enter
 *   - selecting text automatically when editing begins
 *
 * @param {HTMLElement} label - The label element.
 * @param {Room} room - The room object whose label should update.
 */
export function makeLabelEditable(label, room) {

    // Enable editing on double click
    label.addEventListener("dblclick", () => {
        label.setAttribute("contentEditable", "true");
        label.focus();
        document.execCommand("selectAll", false, null);
    });

    // Save on blur
    label.addEventListener("blur", () => {
        label.setAttribute("contentEditable", "false");
        room.label = label.textContent;
    });

    // Save on Enter
    label.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            label.blur();  // triggers save
        }
    });
}
