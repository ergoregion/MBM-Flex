// js/core/utils.js

export function generateId() {
    return crypto.randomUUID();
}

export function getCenter(el, container) {
    const rect = el.getBoundingClientRect();
    const crect = container.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - crect.left,
        y: rect.top + rect.height / 2 - crect.top,
    };
}

export function downloadFile(text, filename) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function safeParseJSON(text, fallback = {}) {
    try { return JSON.parse(text); }
    catch { return fallback; }
}

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
        room.label = label.textContent
        
    });

    // Save on Enter
    label.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            label.blur();  // triggers save
        }
    });
}