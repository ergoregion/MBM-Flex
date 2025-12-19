import { State } from "../core/state.js";

export class ResultsViewInterface {

    async load(fileObject) {
        const formData = new FormData();
        formData.append("file", fileObject);

        const response = await fetch("/results/load", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        console.log(result);
        return result;
    }

    async check_species(species) {
        const res = await fetch(`/results/check_species?species=${species}`);
        const data = await res.json();
        return data
    }
    
    async check_time(time) {
        const res = await fetch(`/results/check_time?time=${time}`);
        const data = await res.json();
        return data
    }

    async view(species, time) {
        const res = await fetch(`/results/view?species=${species}&&time=${time}`);
        const data = await res.json();
        return data
    }

}