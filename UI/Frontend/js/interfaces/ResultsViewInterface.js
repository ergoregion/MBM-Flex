import { State } from "../core/state.js";

/**
 * Provides a thin wrapper around the backend results API.
 *
 * This interface is used by ResultsViewManager to:
 *   - upload simulation result files
 *   - query available species
 *   - query valid time points
 *   - fetch min/max ranges for a species
 *   - fetch actual values for a species at a given time
 *
 * All methods return parsed JSON responses from the backend.
 */
export class ResultsViewInterface {

    /**
     * Uploads a results file to the backend and returns metadata
     * such as available time points and species.
     *
     * @param {File} fileObject - The uploaded results file.
     * @returns {Promise<Object>} Parsed JSON response.
     */
    async load(fileObject) {
        const formData = new FormData();
        formData.append("file", fileObject);

        const response = await fetch("/results/load", {
            method: "POST",
            body: formData,
        });

        return await response.json();
    }

    /**
     * Checks whether a species exists in the loaded results.
     *
     * @param {string} species
     * @returns {Promise<Object>} { exists: boolean, ... }
     */
    async check_species(species) {
        const res = await fetch(`/results/check_species?species=${species}`);
        return await res.json();
    }
    
    /**
     * Retrieves the global min/max range for a species across all rooms.
     *
     * @param {string} species
     * @returns {Promise<Object>} { roomName: [min, max], ... }
     */
    async range(species) {
        const res = await fetch(`/results/range?species=${species}`);
        return await res.json();
    }
    
    /**
     * Checks whether a given time index is valid for the loaded dataset.
     *
     * @param {number|string} time
     * @returns {Promise<Object>} { valid: boolean }
     */
    async check_time(time) {
        const res = await fetch(`/results/check_time?time=${time}`);
        return await res.json();
    }

    /**
     * Retrieves the value of a species at a specific time for all rooms.
     *
     * @param {string} species
     * @param {number|string} time
     * @returns {Promise<Object>} { roomName: value, ... }
     */
    async values(species, time) {
        const res = await fetch(`/results/values?species=${species}&&time=${time}`);
        return await res.json();
    }
}
