 const canvas = document.getElementById('canvas');
  const connectionLines = document.getElementById('connection-lines');

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
const jsonEditorContainer = document.getElementById('json-editor-container');
jsonEditorContainer.addEventListener('click', e => e.stopPropagation());
jsonEditorContainer.addEventListener('keydown', e => e.stopPropagation());

const jsonEditor = document.getElementById('json-editor');
const jsonError = document.getElementById('json-error');

// Update addSquare to initialize JSON data
function addSquare(type) {
  const id = generateId();
  const square = document.createElement('div');
  square.classList.add('square', type);
  square.dataset.id = id;

  square.style.left = '50px';
  square.style.top = '50px';

  if (type === 'room') {
    const label = document.createElement('div');
    label.className = 'label';
    label.contentEditable = true;
    label.innerText = `Room ${roomCounter++}`;
    label.addEventListener('mousedown', e => e.stopPropagation());
    label.addEventListener('click', e => e.stopPropagation());
    square.appendChild(label);
  }

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  square.appendChild(resizeHandle);

  square.addEventListener('mousedown', onDragStart);
  resizeHandle.addEventListener('mousedown', onResizeStart);

  square.addEventListener('click', (e) => {
    e.stopPropagation();

    if (linkMode && type === 'room') {
      toggleRoomSelection(square);
      return;
    }

    if (linkMode && type === 'aperture') {
      linkRoomsToAperture(square);
      return;
    }

    selectSquare(square);
  });

  canvas.appendChild(square);

  if (type === 'aperture') {
    apertures.set(id, {
      element: square,
      connectedRooms: [],
    });
  }

  var customData  = {"volume_in_m3": null};

  // Initialize JSON data for this square
  const initialData = {
    label: type === 'room' ? `Room ${roomCounter - 1}` : 'Aperture',
    customData
  };
  squareDataMap.set(id, initialData);

  selectSquare(square);
  attachHoverEvents(square);
  updateConnections();
}

// Update selectSquare to show JSON editor
function selectSquare(square) {
  if (selected) selected.classList.remove('selected');
  selected = square;
  selected.classList.add('selected');

  if (!square) {
    jsonEditorContainer.style.display = 'none';
    return;
  }

  // Show JSON editor
  jsonEditorContainer.style.display = 'block';

  // Load JSON from map
  const data = squareDataMap.get(square.dataset.id);
  if (data) {
    jsonEditor.value = JSON.stringify(data, null, 2);
    jsonError.style.display = 'none';
  } else {
    jsonEditor.value = defaultJson;
  }
}

// Listen for JSON editor changes
jsonEditor.addEventListener('input', () => {
  if (!selected) return;

  try {
    const parsed = JSON.parse(jsonEditor.value);
    jsonError.style.display = 'none';
    squareDataMap.set(selected.dataset.id, parsed);

    // Optionally update the label text if it's a room and label changed in JSON
    if (selected.classList.contains('room') && parsed.label) {
      const labelDiv = selected.querySelector('.label');
      if (labelDiv && labelDiv.innerText !== parsed.label) {
        labelDiv.innerText = parsed.label;
      }
    }
  } catch (err) {
    jsonError.style.display = 'block';
  }
});


  function toggleRoomSelection(square) {
    if (!square.classList.contains('room')) return;
    if (selectedRooms.includes(square)) {
      selectedRooms = selectedRooms.filter(r => r !== square);
      square.classList.remove('selected');
    } else {
      if (selectedRooms.length < 2) {
        selectedRooms.push(square);
        square.classList.add('selected');
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
    apertureData.connectedRooms = selectedRooms.map(r => r.dataset.id);

    aperture.classList.add('linked');

    // Clear selection
    selectedRooms.forEach(r => r.classList.remove('selected'));
    selectedRooms = [];
    linkMode = false;

    updateConnections();
  }

  function onDragStart(e) {
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    selectSquare(e.currentTarget);
    offsetX = e.clientX - selected.offsetLeft;
    offsetY = e.clientY - selected.offsetTop;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onDragEnd);
  }

  function onDrag(e) {
    if (!selected || resizing) return;
    selected.style.left = e.clientX - offsetX + 'px';
    selected.style.top = e.clientY - offsetY + 'px';
    updateConnections();
  }

  function onDragEnd() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onDragEnd);
  }

  function onResizeStart(e) {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;

    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeEnd);
  }

  function onResize(e) {
    if (!selected) return;
    const rect = selected.getBoundingClientRect();
    const newWidth = e.clientX - rect.left;
    const newHeight = e.clientY - rect.top;
    selected.style.width = Math.max(30, newWidth) + 'px';
    selected.style.height = Math.max(30, newHeight) + 'px';
    updateConnections();
  }

  function onResizeEnd() {
    resizing = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onResizeEnd);
  }

  function getCenter(el) {
    const rect = el.getBoundingClientRect();
    const containerRect = canvas.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top
    };
  }
function updateConnections() {
  connectionLines.innerHTML = '';

  for (const [id, apertureData] of apertures.entries()) {
    const apertureEl = apertureData.element;
    const aCenter = getCenter(apertureEl);

    apertureData.connectedRooms.forEach(roomId => {
      const roomEl = [...canvas.children].find(el => el.dataset.id === roomId);
      if (!roomEl) return;

      const rCenter = getCenter(roomEl);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", aCenter.x);
      line.setAttribute("y1", aCenter.y);
      line.setAttribute("x2", rCenter.x);
      line.setAttribute("y2", rCenter.y);
      line.setAttribute("stroke", "green");
      line.setAttribute("stroke-width", "2");
      line.classList.add('connection-line');

      // Tag line with data for hover behavior
      line.dataset.apertureId = id;
      line.dataset.roomId = roomId;

      connectionLines.appendChild(line);
    });
  }
}

document.body.addEventListener('click', (e) => {
  const editorContainer = document.getElementById('json-editor-container');
  console.log(e.target)
  console.log (editorContainer.contains(e.target))
  if (editorContainer.contains(e.target)) {
    return; // Click happened inside the editor; don't hide it
  }

  const isSquare = e.target.closest('.square');

  if (!isSquare) {
    if (selected) selected.classList.remove('selected');
    selected = null;
    jsonEditorContainer.style.display = 'none';
  }
});

  // On window resize, update lines
  window.addEventListener('resize', updateConnections);

function highlightLinesForElement(el, highlight) {
  const id = el.dataset.id;
  const lines = document.querySelectorAll('.connection-line');

  lines.forEach(line => {
    if (line.dataset.apertureId === id || line.dataset.roomId === id) {
      if (highlight) {
        line.classList.add('highlight');
      } else {
        line.classList.remove('highlight');
      }
    }
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && selected) {
    const id = selected.dataset.id;

    // If it's an aperture, remove from Map
    if (selected.classList.contains('aperture')) {
      apertures.delete(id);
    } else {
      // If it's a room, remove references from all apertures
      for (const a of apertures.values()) {
        a.connectedRooms = a.connectedRooms.filter(rid => rid !== id);
      }
    }

    selected.remove();
    selected = null;
    updateConnections();
  }
});

// Add hover event listeners to every square as it's created
function attachHoverEvents(square) {
  square.addEventListener('mouseenter', () => highlightLinesForElement(square, true));
  square.addEventListener('mouseleave', () => highlightLinesForElement(square, false));
}

function saveLayout() {
  const data = [];

  // Collect all squares
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    const rect = square.getBoundingClientRect();
    const containerRect = canvas.getBoundingClientRect();

    const id = square.dataset.id;
    const type = square.classList.contains('room') ? 'room' : 'aperture';
    const width = square.offsetWidth;
    const height = square.offsetHeight;
    const left = square.offsetLeft;
    const top = square.offsetTop;

    const baseData = squareDataMap.get(id) || { id, type, label: '', customData: {} };

    const squareData = {
      id,
      type,
      position: { left, top },
      size: { width, height },
      data: baseData
    };

    if (type === 'aperture' && apertures.has(id)) {
      squareData.connectedRooms = apertures.get(id).connectedRooms;
    }

    data.push(squareData);
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'canvas-layout.json';
  link.click();

  URL.revokeObjectURL(url);
}

document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const layout = JSON.parse(e.target.result);
      loadLayout(layout);
    } catch (err) {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
});

function loadLayout(layout) {
  // Clear canvas
  canvas.innerHTML = '';
  apertures.clear();
  squareDataMap.clear();
  selected = null;
  jsonEditorContainer.style.display = 'none';

  layout.forEach(item => {
    const { id, type, position, size, data, connectedRooms } = item;

    const square = document.createElement('div');
    square.classList.add('square', type);
    square.dataset.id = id;
    square.style.left = position.left + 'px';
    square.style.top = position.top + 'px';
    square.style.width = size.width + 'px';
    square.style.height = size.height + 'px';

    if (type === 'room') {
      const label = document.createElement('div');
      label.className = 'label';
      label.contentEditable = true;
      label.innerText = data.label || '';
      label.addEventListener('mousedown', e => e.stopPropagation());
      label.addEventListener('click', e => e.stopPropagation());
      square.appendChild(label);
    }

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    square.appendChild(resizeHandle);

    square.addEventListener('mousedown', onDragStart);
    resizeHandle.addEventListener('mousedown', onResizeStart);

    square.addEventListener('click', (e) => {
      e.stopPropagation();

      if (linkMode && type === 'room') {
        toggleRoomSelection(square);
        return;
      }

      if (linkMode && type === 'aperture') {
        linkRoomsToAperture(square);
        return;
      }

      selectSquare(square);
    });

    canvas.appendChild(square);
    attachHoverEvents(square);

    squareDataMap.set(id, data);

    if (type === 'aperture') {
      apertures.set(id, {
        element: square,
        connectedRooms: connectedRooms || [],
      });
    }
  });

  updateConnections();
}