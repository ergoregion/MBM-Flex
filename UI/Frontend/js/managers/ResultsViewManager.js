import { State } from "../core/state.js";
import { ResultsViewInterface } from "../interfaces/ResultsViewInterface.js";

/**
 * Handles the “results view” mode, which visualizes simulation output
 * (species concentrations, temperatures, etc.) on top of the room layout.
 *
 * Responsibilities:
 *  - Loading result files
 *  - Managing time, species, and gradient selections
 *  - Coloring rooms based on simulation values
 *  - Resetting the UI when results view ends
 */
export class ResultsViewManager {
    
    constructor() {
        // Interface for loading and querying simulation results
        this.resultsViewInterface = new ResultsViewInterface();

        // Array of valid time points returned by the backend
        this.validTimes = null;

        // Min and max for the current species and 
        this.min = null;
        this.max = null;
    }

    /**
     * Activates results view mode and loads the selected results file.
     * Initializes the time slider and displays the results panel.
     */
    start(fileObject) {
        State.resultsViewMode = true;

        const loadPromise = this.resultsViewInterface.load(fileObject);

        loadPromise.then((loadResults) => {
            this.validTimes = loadResults.intersecting_times;

            // Configure time slider
            State.results.timeSlider.min = 0;
            State.results.timeSlider.max = this.validTimes.length - 1;
            State.results.timeSlider.step = 1;
            State.results.timeSlider.value = 0;

            timeLabel.textContent = `Time: ${this.validTimes[0]}`;

            // Show results panel
            State.ui.resultsView.style.display = "flex";
            this.updateNodeColors();
        });
    }

    /**
     * Deactivates results view mode and resets room colors.
     */
    end() {
        if (!State.resultsViewMode) return;

        this.resetNodeColors();
        State.resultsViewMode = false;
        State.ui.resultsView.style.display = "none";
    }

    /**
     * Adds a species to the species list (if not already present)
     * and updates room colors accordingly.
     */
    select_species() {
        const value = State.results.speciesInput.value.trim();
        if (!value) return;

        const exists = [...State.results.speciesList.options]
            .some(opt => opt.value === value);

        if (!exists) {
            const option = document.createElement("option");
            option.value = value;
            State.results.speciesList.appendChild(option);
        }

        this.update_min_max()

        this.updateNodeColors();
    }

    /**
     * Updates the selected time and recolors rooms.
     */
    select_time() {
        const index = Number(timeSlider.value);
        const time = this.validTimes[index];

        timeLabel.textContent = `Time: ${time}`;
        this.updateNodeColors();
    }

    /**
     * Updates the selected gradient and recolors rooms.
     */
    select_gradient() {
        const gradientName = State.results.gradientSelect.value;
        const colors = getGradientColors(gradientName);
        this.updateLegend(this.min, this.max, colors);
        this.updateNodeColors();
    }

    /**
     * Updates the min / max / colours /legend.
     */
    async update_min_max() {
        const gradientName = State.results.gradientSelect.value;
        const species = State.results.speciesInput.value;
        const colors = getGradientColors(gradientName);
        // Query global min/max for the selected species
        const ranges = await this.resultsViewInterface.range(species);
        let min = Infinity;
        let max = 0;

        State.rooms.forEach(room => {
            const label = room.label;
            if (ranges[label]) {
                const [low, high] = ranges[label];
                min = Math.min(min, low);
                max = Math.max(max, high);
            }
        });
        this.min = min
        this.max = Math.max(min, max)

        this.updateLegend(this.min, this.max, colors);

    }

    /**
     * Computes and applies background colors to each room based on:
     *  - selected species
     *  - selected time
     *  - selected gradient
     *  - min/max range of values across rooms
     */
    async updateNodeColors() {
        const gradientName = State.results.gradientSelect.value;
        const species = State.results.speciesInput.value;
        const time = this.validTimes[Number(timeSlider.value)];
        const colors = getGradientColors(gradientName);

        // Query actual values at the selected time
        const values = await this.resultsViewInterface.values(species, time);

        // Apply colors to each room DOM element
        document.querySelectorAll(".room").forEach(room_dom => {
            const room = State.rooms.get(room_dom.dataset.id);

            if (!room) {
                room_dom.style.backgroundColor = "#808080";
                return;
            }

            const value = values[room.label];
            if (value === undefined || value === null) {
                room_dom.style.backgroundColor = "#808080";
                return;
            }

            const color = getColorFromGradient(colors, value, this.min, this.max);
            room_dom.style.backgroundColor = color;
        });
    }

    /**
     * Clears all room background colors.
     */
    async resetNodeColors() {
        document.querySelectorAll(".room").forEach(room_dom => {
            room_dom.style.backgroundColor = "";
        });
    }

    updateLegend(min, max, colors) {
        const minEl = document.querySelector(".legend-min");
        const maxEl = document.querySelector(".legend-max");
        const bar = document.querySelector(".legend-gradient");

        minEl.textContent = min.toExponential(3);
        maxEl.textContent = max.toExponential(3);

        // Build CSS gradient string
        const stops = colors.map((c, i) => {
            const pct = (i / (colors.length - 1)) * 100;
            return `${c} ${pct}%`;
        }).join(", ");

        bar.style.background = `linear-gradient(to right, ${stops})`;
    }


    
}

/**
 * Maps a numeric value to a color along a gradient.
 */
function getColorFromGradient(colors, value, min, max) {
    if (min === max) return colors[Math.floor(colors.length / 2)];

    const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const n = colors.length - 1;
    const scaled = t * n;

    const i = Math.floor(scaled);
    const frac = scaled - i;

    if (i >= n) return colors[n];
    return interpolateColor(colors[i], colors[i + 1], frac);
}

/**
 * Returns the color array for a named gradient.
 */
function getGradientColors(name) {
    const gradients = {
        "Rainbow": ["#00008b", "#0000ff", "#00ff00", "#ffff00", "#ff0000", "#ffffff"],
        "Blue-Red": ["#0000ff", "#ff0000"],
        "Black-White": ["#000000", "#ffffff"],
        "Green-Yellow": ["#00ff00", "#ffff00"],
        "Purple-Orange": ["#800080", "#ffa500"],
        "Ironbow": ["#000000", "#8b008b", "#ffa500", "#ffffff"],
        "Viridis": ["#440154",  "#482777", "#3E4989", "#31688E", "#26828E", "#1F9E89", "#35B779", "#6CCE59", "#B4DE2C", "#FDE725"]
    };
    return gradients[name] || ["#808080"];
}

/**
 * Linearly interpolates between two hex colors.
 */
function interpolateColor(c1, c2, t) {
    const a = hexToRgb(c1);
    const b = hexToRgb(c2);

    return `rgb(
        ${Math.round(a.r + (b.r - a.r) * t)},
        ${Math.round(a.g + (b.g - a.g) * t)},
        ${Math.round(a.b + (b.b - a.b) * t)}
    )`;
}

/**
 * Converts a hex color string to an RGB object.
 */
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}
