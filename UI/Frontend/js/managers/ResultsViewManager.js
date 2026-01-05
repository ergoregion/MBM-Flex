import { State } from "../core/state.js";
import { ResultsViewInterface } from "../interfaces/ResultsViewInterface.js";

export class ResultsViewManager {
    
    constructor() {
        this.resultsViewInterface= new ResultsViewInterface()
        this.validTimes = null;
    }

    

    start(fileObject) {
        if (State.resultsViewMode) return;
        State.resultsViewMode = true;
        const loadPromise = this.resultsViewInterface.load(fileObject)
        loadPromise.then((loadResults) => {
            this.validTimes = loadResults.intersecting_times;
            
            State.results.timeSlider.min = 0;
            State.results.timeSlider.max = this.validTimes.length - 1;
            State.results.timeSlider.step = 1;
            State.results.timeSlider.value = 0;

            timeLabel.textContent = `Time: ${this.validTimes[0]}`;
            State.ui.resultsView.style.display = "flex";
        
        });
    }

    
    end(){
        if (!State.resultsViewMode) return;
        this.resetNodeColors();
        State.resultsViewMode = false;
        State.ui.resultsView.style.display = "none";

    }

    select_species(){

        const value = State.results.speciesInput.value.trim();

        if (!value) return;
        

        const exists = [...State.results.speciesList.options].some(opt => opt.value === value);
        if (!exists) {
            const speciesPassesTest=true;
            if (!speciesPassesTest) return;
            const option = document.createElement(value+"-species");
            option.value = value;
            State.results.speciesList.options.appendChild(option);
        }

        this.updateNodeColors();
    }
    
    select_time(){
        const index = Number(timeSlider.value);
        const time = this.validTimes[index];

        timeLabel.textContent = `Time: ${time}`;
        this.updateNodeColors();
    }
    
    select_gradient(){
        this.updateNodeColors();
    }
    
    async updateNodeColors() {
        const gradientName = State.results.gradientSelect.value;
        const species = State.results.speciesInput.value;
        const time = this.validTimes[Number(timeSlider.value)];
        const colors = getGradientColors(gradientName);

        const ranges = await this.resultsViewInterface.range(species);  
        let min = Infinity;
        let max = 0;      
        State.rooms.forEach(room => {
            const label = room.label
            if (ranges[label]) {
                const [low, high] = ranges[label];
                min = Math.min(min, low);
                max = Math.max(max, high);
            }
        });

        const values = await this.resultsViewInterface.values(species, time)    
        console.log(values)  

        document.querySelectorAll(".room").forEach(room_dom => {
            const room = State.rooms.get(room_dom.dataset.id)
            if (!room) {
            room_dom.style.backgroundColor = "#808080";
            return;
            }
            const value = values[room.label];
            if (value === undefined || value === null) {
            room_dom.style.backgroundColor = "#808080";
            return;
            }
            const color = getColorFromGradient(colors, value, min, max);
            room_dom.style.backgroundColor = color;
        });
    }

    async resetNodeColors() {
        document.querySelectorAll(".room").forEach(room_dom => {
            room_dom.style.backgroundColor = "";
        });
    }
    

}

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

function getGradientColors(name) {
  const gradients = {
    "Rainbow": ["#00008b", "#0000ff", "#00ff00", "#ffff00", "#ff0000", "#ffffff"],
    "Blue-Red": ["#0000ff", "#ff0000"],
    "Black-White": ["#000000", "#ffffff"],
    "Green-Yellow": ["#00ff00", "#ffff00"],
    "Purple-Orange": ["#800080", "#ffa500"],
    "Ironbow": ["#000000", "#8b008b", "#ffa500", "#ffffff"]
  };
  return gradients[name] || ["#808080"];
}


function interpolateColor(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);

  return `rgb(
    ${Math.round(a.r + (b.r - a.r) * t)},
    ${Math.round(a.g + (b.g - a.g) * t)},
    ${Math.round(a.b + (b.b - a.b) * t)}
  )`;
}


function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}