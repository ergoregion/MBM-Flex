import { State } from "../core/state.js";
import { ResultsViewInterface } from "../interfaces/ResultsViewInterface.js";

export class ResultsViewManager {
    
    constructor() {
        this.resultsViewInterface= new ResultsViewInterface()
    }

    

    start(fileObject) {
        if (State.resultsViewMode) return;
        State.resultsViewMode = true;
        State.ui.resultsView.style.display = "flex";
        const loadPromise = this.resultsViewInterface.load(fileObject)
        loadPromise.then((loadResults) => {
            this.resultsViewInterface.check_species('NO2').then((r) => {
                console.log(r)     
                });
            this.resultsViewInterface.check_species('NOa2').then((r) => {
                console.log(r)     
                });
            this.resultsViewInterface.check_time(10).then((r) => {
                console.log(r)     
                });
            this.resultsViewInterface.check_time(22).then((r) => {
                console.log(r)     
                });
            this.resultsViewInterface.view('NO2', 10).then((r) => {
                console.log(r)     
                });
        
        });
    }

    
    end(){
        if (!State.resultsViewMode) return;
        State.resultsViewMode = false;
        State.ui.resultsView.style.display = "none";

    }

}