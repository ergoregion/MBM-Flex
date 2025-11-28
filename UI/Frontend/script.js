const canvas = document.getElementById("canvas");
const connectionLines = document.getElementById("connection-lines");

let selected = null;
let offsetX, offsetY;
let resizing = false;
let linkMode = false;
let selectedRooms = [];

const apertures = new Map(); // apertureId -> { element, connectedRooms: [room1, room2] }

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

let roomCounter = 1;
// Store square JSON data in a Map keyed by square ID
const squareDataMap = new Map();

// Default JSON string (can be customized)
const defaultJson = JSON.stringify({ type: "unknown", customData: {} }, null, 2);

// Reference editor elements
const jsonEditorContainer = document.getElementById("json-editor-container");
jsonEditorContainer.addEventListener("click", (e) => e.stopPropagation());
jsonEditorContainer.addEventListener("keydown", (e) => e.stopPropagation());

const jsonEditor = document.getElementById("json-editor");
const jsonError = document.getElementById("json-error");

// Update addSquare to initialize JSON data
function addSquare(type) {
  const id = generateId();
  const square = document.createElement("div");
  square.classList.add("square", type);
  square.dataset.id = id;

  square.style.left = "50px";
  square.style.top = "50px";

  if (type === "room") {
    const label = document.createElement("div");
    label.className = "label";
    label.innerText = `Room ${roomCounter++}`;
    label.setAttribute("contentEditable", false); // Not editable by default
    label.addEventListener("mousedown", (e) => e.stopPropagation());
    label.addEventListener("click", (e) => e.stopPropagation());

    // Enable editing on double click
    label.addEventListener("dblclick", () => {
      label.setAttribute("contentEditable", true);
      label.focus();
      // Optionally select all text
      document.execCommand("selectAll", false, null);
    });

    // Disable editing and save label on blur
    label.addEventListener("blur", () => {
      label.setAttribute("contentEditable", false);
      const id = square.dataset.id;
      const data = squareDataMap.get(id) || "{}";
      squareDataMap.set(id, data);

      // Update JSON editor if this square is selected
      if (selected === square) {
        jsonEditor.value = data;
      }
    });

    // Optionally save label on Enter key
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Avoid inserting newline
        label.blur();
      }
    });

    square.appendChild(label);

    const resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    square.appendChild(resizeHandle);
    resizeHandle.addEventListener("mousedown", onResizeStart);
  }

  square.addEventListener("mousedown", onDragStart);

  square.addEventListener("click", (e) => {
    e.stopPropagation();

    if (linkMode && type === "room") {
      toggleRoomSelection(square);
      return;
    }

    if (linkMode && type === "aperture") {
      linkRoomsToAperture(square);
      return;
    }

    selectSquare(square);
  });

  canvas.appendChild(square);


  if (type === "aperture") {
    initialData= '{ "area" : 1.0 }'
    apertures.set(id, {
      element: square,
      connectedRooms: [],
    });
  }
  else{
    initialData ="{}"
  }

  squareDataMap.set(id, initialData);

  selectSquare(square);
  attachHoverEvents(square);
  updateConnections();
}

// Update selectSquare to show JSON editor
function selectSquare(square) {
  if (selected) selected.classList.remove("selected");
  selected = square;
  selected.classList.add("selected");

  if (!square) {
    jsonEditorContainer.style.display = "none";
    return;
  }

  // Show JSON editor
  jsonEditorContainer.style.display = "block";

  // Load JSON from map
  const data = squareDataMap.get(square.dataset.id);
  if (data) {
    jsonEditor.value = data;
    jsonError.style.display = "none";
  } else {
    jsonEditor.value = defaultJson;
  }
}

// Listen for JSON editor changes
jsonEditor.addEventListener("input", () => {
  if (!selected) return;

  try {
    jsonError.style.display = "none";
    squareDataMap.set(selected.dataset.id, jsonEditor.value);
  } catch (err) {
    jsonError.style.display = "block";
  }
});

function toggleRoomSelection(square) {
  if (!square.classList.contains("room")) return;
  if (selectedRooms.includes(square)) {
    selectedRooms = selectedRooms.filter((r) => r !== square);
    square.classList.remove("selected");
  } else {
    if (selectedRooms.length < 2) {
      selectedRooms.push(square);
      square.classList.add("selected");
    }
  }
}

function enterLinkMode() {
  linkMode = true;
  selectedRooms = [];
  alert("Select up to 2 rooms, then click an aperture to link.");
}

function linkRoomsToAperture(aperture) {
  const id = aperture.dataset.id;
  if (!apertures.has(id)) return;

  const apertureData = apertures.get(id);
  apertureData.connectedRooms = selectedRooms.map((r) => r.dataset.id);

  aperture.classList.add("linked");

  // Clear selection
  selectedRooms.forEach((r) => r.classList.remove("selected"));
  selectedRooms = [];
  linkMode = false;

  updateConnections();
}

function onDragStart(e) {
  if (e.target.classList.contains("resize-handle")) return;

  e.preventDefault();
  selectSquare(e.currentTarget);
  offsetX = e.clientX - selected.offsetLeft;
  offsetY = e.clientY - selected.offsetTop;

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", onDragEnd);
}

function onDrag(e) {
  if (!selected || resizing) return;
  selected.style.left = e.clientX - offsetX + "px";
  selected.style.top = e.clientY - offsetY + "px";
  updateConnections();
}

function onDragEnd() {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", onDragEnd);
}

function onResizeStart(e) {
  e.preventDefault();
  e.stopPropagation();
  resizing = true;

  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", onResizeEnd);
}

function onResize(e) {
  if (!selected) return;
  const rect = selected.getBoundingClientRect();
  const newWidth = e.clientX - rect.left;
  const newHeight = e.clientY - rect.top;
  selected.style.width = Math.max(30, newWidth) + "px";
  selected.style.height = Math.max(30, newHeight) + "px";
  updateConnections();
}

function onResizeEnd() {
  resizing = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", onResizeEnd);
}

function getCenter(el) {
  const rect = el.getBoundingClientRect();
  const containerRect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}
function updateConnections() {
  connectionLines.innerHTML = "";

  for (const [id, apertureData] of apertures.entries()) {
    const apertureEl = apertureData.element;
    const aCenter = getCenter(apertureEl);

    apertureData.connectedRooms.forEach((roomId) => {
      const roomEl = [...canvas.children].find((el) => el.dataset.id === roomId);
      if (!roomEl) return;

      const rCenter = getCenter(roomEl);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", aCenter.x);
      line.setAttribute("y1", aCenter.y);
      line.setAttribute("x2", rCenter.x);
      line.setAttribute("y2", rCenter.y);
      line.setAttribute("stroke", "green");
      line.setAttribute("stroke-width", "2");
      line.classList.add("connection-line");

      // Tag line with data for hover behavior
      line.dataset.apertureId = id;
      line.dataset.roomId = roomId;

      connectionLines.appendChild(line);
    });
  }
}

document.body.addEventListener("click", (e) => {
  const editorContainer = document.getElementById("json-editor-container");
  console.log(e.target);
  console.log(editorContainer.contains(e.target));
  if (editorContainer.contains(e.target)) {
    return; // Click happened inside the editor; don't hide it
  }

  const isSquare = e.target.closest(".square");

  if (!isSquare) {
    if (selected) selected.classList.remove("selected");
    selected = null;
    jsonEditorContainer.style.display = "none";
  }
});

// On window resize, update lines
window.addEventListener("resize", updateConnections);

function highlightLinesForElement(el, highlight) {
  const id = el.dataset.id;
  const lines = document.querySelectorAll(".connection-line");

  lines.forEach((line) => {
    if (line.dataset.apertureId === id || line.dataset.roomId === id) {
      if (highlight) {
        line.classList.add("highlight");
      } else {
        line.classList.remove("highlight");
      }
    }
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && selected) {
    const id = selected.dataset.id;

    // If it's an aperture, remove from Map
    if (selected.classList.contains("aperture")) {
      apertures.delete(id);
    } else {
      // If it's a room, remove references from all apertures
      for (const a of apertures.values()) {
        a.connectedRooms = a.connectedRooms.filter((rid) => rid !== id);
      }
    }

    selected.remove();
    selected = null;
    updateConnections();
  }
});

// Add hover event listeners to every square as it's created
function attachHoverEvents(square) {
  square.addEventListener("mouseenter", () => highlightLinesForElement(square, true));
  square.addEventListener("mouseleave", () => highlightLinesForElement(square, false));
}
function saveLayout() {
  const roomFiles = {};
  const aperturesList = [];
  const ui_data = {};

  const squares = document.querySelectorAll(".square");

  squares.forEach((square) => {
    const id = square.dataset.id;
    const type = square.classList.contains("room") ? "room" : "aperture";
    const label = square.querySelector(".label")?.innerText || "";
    const data = squareDataMap.get(id);

    if (type === "room") {
      // Save room JSON file
      const filename = `room_${label}.json`;

      const roomUIJson =
        {
          id,
          label,
          position: {
            left: square.offsetLeft,
            top: square.offsetTop,
          },
          size: {
            width: square.offsetWidth,
            height: square.offsetHeight,
          },
        };

      downloadFile(data, filename);
      roomFiles[label] = filename;
      ui_data[label] = roomUIJson
    }

    if (type === "aperture" && apertures.has(id)) {
      const ap = apertures.get(id);
      const connected = ap.connectedRooms;

      if (connected.length === 2) {
        const originRoom = getRoomLabel(connected[0]);
        const destRoom = getRoomLabel(connected[1]);

        aperturesList.push({
          origin: originRoom,
          destination: destRoom,
          area: JSON.parse(data).area ?? 0, // custom area stored in JSON editor
        });
      }
    }
  });

  // Master file
  const masterJson = JSON.stringify(
    {
      rooms: roomFiles,
      apertures: aperturesList,
      ui_data: ui_data
    },
    null,
    2
  );

  downloadFile(masterJson, "layout_master.json");
}

// Helper: triggers download
function downloadFile(text, filename) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getRoomLabel(roomId) {
  const el = [...document.querySelectorAll(".square.room")].find((r) => r.dataset.id === roomId);
  return el?.querySelector(".label").innerText || "Unknown";
}

document.getElementById("fileInput").addEventListener("change", async function (event) {
  const data = await findJsonWithKey(event.target.files, "rooms");
  if (!data) return;
  loadLayout(data, Array.from(event.target.files));
});

async function findJsonWithKey(files, key) {
  for (const file of files) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data && Object.prototype.hasOwnProperty.call(data, key)) {
        return data;
      }
    } catch (err) {
      console.warn(`Skipping ${file.name}: invalid JSON`);
    }
  }
  return null; // No matching file found
}

async function loadLayout(masterJson, otherFiles) {
  // Clear canvas
  canvas.innerHTML = "";
  apertures.clear();
  squareDataMap.clear();
  selected = null;
  jsonEditorContainer.style.display = "none";

  // 2) Load rooms
  const roomElements = {};

  // Build an array of Promises for loading rooms
  const roomPromises = Object.entries(masterJson.rooms).map(async ([roomName, relPath]) => {
    const matchingFile = otherFiles.find((f) => f.name === relPath);
    if (!matchingFile) {
      console.log("File not found:", relPath);
      return;
    }

    const text = await matchingFile.text();
    const square = createRoomFromData(text, masterJson.ui_data[roomName]);
    roomElements[roomName] = square;
    console.log("ADDED ROOM:", roomName);
  });

  // Wait for all room files to finish loading
  await Promise.all(roomPromises);

  // 3) Create apertures
  masterJson.apertures.forEach((ap) => {
    const originRoom = roomElements[ap.origin];
    const destRoom = roomElements[ap.destination];

    if (!originRoom || !destRoom) return;

    addApertureBetween(originRoom, destRoom, ap.area);
  });

  updateConnections();
}

function createRoomFromData(room, ui_data) {
  const square = document.createElement("div");
  square.classList.add("square", "room");
  square.dataset.id = ui_data.id;

  square.style.left = ui_data.position.left + "px";
  square.style.top = ui_data.position.top + "px";
  square.style.width = ui_data.size.width + "px";
  square.style.height = ui_data.size.height + "px";

  const label = document.createElement("div");
  label.className = "label";
  label.contentEditable = false;
  label.innerText = ui_data.label;
  
    // Enable editing on double click
    label.addEventListener("dblclick", () => {
      label.setAttribute("contentEditable", true);
      label.focus();
      // Optionally select all text
      document.execCommand("selectAll", false, null);
    });

    // Disable editing and save label on blur
    label.addEventListener("blur", () => {
      label.setAttribute("contentEditable", false);
      const id = square.dataset.id;
      const data = squareDataMap.get(id) || "{}";
      squareDataMap.set(id, data);

      // Update JSON editor if this square is selected
      if (selected === square) {
        jsonEditor.value = JSON.stringify(data, null, 2);
      }
    });

    // Optionally save label on Enter key
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Avoid inserting newline
        label.blur();
      }
    });

  square.appendChild(label);

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";
  square.appendChild(resizeHandle);

  canvas.appendChild(square);

  square.addEventListener("mousedown", onDragStart);
  resizeHandle.addEventListener("mousedown", onResizeStart);
  attachHoverEvents(square);
  console.log("Data loaded: " +room.id +room)
  squareDataMap.set(square.dataset.id, room);

  return square;
}

function addApertureBetween(roomA, roomB, area) {
  const id = generateId();
  const square = document.createElement("div");
  square.classList.add("square", "aperture");
  square.dataset.id = id;

  // Auto-place aperture between rooms
  const A = getCenter(roomA);
  const B = getCenter(roomB);

  square.style.left = (A.x + B.x) / 2 + "px";
  square.style.top = (A.y + B.y) / 2 + "px";

  canvas.appendChild(square);

  square.addEventListener("mousedown", onDragStart);
  attachHoverEvents(square);

  apertures.set(id, {
    element: square,
    connectedRooms: [roomA.dataset.id, roomB.dataset.id],
  });

  squareDataMap.set(id, JSON.stringify({ area }));

  return square;
}
