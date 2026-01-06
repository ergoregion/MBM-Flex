# Layout Editor – Architecture Overview

This project is a browser‑based layout editor for creating rooms, apertures, and transport paths.
It combines a simple data model with a set of modular managers that coordinate UI behavior, state updates, and backend communication.

The system is intentionally lightweight: no frameworks, no build step — just clean JavaScript modules and a shared global state.

## Core Concepts

### Rooms

- Represent physical spaces.

- Have editable JSON data.

- Have UI metadata (position + size).

- Can be dragged, resized, renamed.

### Apertures

- Represent openings between rooms or between a room and the outside.

- Can be created by linking two rooms or linking a room to a side (Front/Back/Left/Right).

- Have an editable `area` property.

### Transport Paths

- Computed by the backend from the aperture graph.

- Visualized as highlightable paths through the layout.

## Architecture Summary

The system is built around a central `State` object that stores:

- All rooms and apertures

- UI mode flags (selection, link mode, transport mode)

- References to key DOM elements

Everything else is a manager that reads/writes to this shared state.

## Module Overview

### Core State

`State`
A global container holding:

- `rooms`, `apertures`

- selection state

- link mode state

- transport path mode

- UI references (canvas, layers, editor, etc.)

This is the backbone of the entire application.

### Data Model

`Room`
Stores label, JSON data, and UI metadata.

Provides setPosition, setSize, and serialize.

`Aperture`
Stores area, connected rooms, grounded flag, and UI metadata.

Provides serialize.

### Managers (Behavior Controllers)

#### `RoomManager`

Creates and removes rooms.

Assigns default UI and JSON data.

#### `ApertureManager`

Creates apertures between rooms or between a room and a side.

Computes default UI positions.

#### `SelectionManager`

Handles selecting/deselecting elements.

Integrates with the JSON editor.

#### `DragResizeManager`

Handles dragging and resizing of rooms/apertures.

Updates UI metadata and triggers connection re-rendering.

#### `ConnectionRenderer`

Draws SVG lines between apertures and rooms.

Handles highlight layers.

#### `LinkModeManager`

Manages the workflow for creating apertures via clicking.

Tracks selected rooms.

Creates apertures when enough selections are made.

#### `TransportPathManager`

Requests transport paths from the backend.

Displays path tiles.

Highlights apertures and lines on hover.

#### `LoadSaveManager`

Saves:

- individual room files

- a master layout file

Loads:

- room files

- apertures

- UI metadata

#### `JsonEditor`

Shows and validates JSON for rooms and apertures.

Updates underlying objects as the user types.

#### `Toolbar`

Shows/hides the link mode banner.

## Application Flow (High-Level)

#### User adds a room

- RoomManager creates it
- DOM element created
- DragResizeManager attaches behavior
- Renderer updates connections

#### User links two rooms

- LinkModeManager tracks selections
- ApertureManager creates aperture
- DOM element created
- Renderer draws connection line

#### User edits JSON

- JsonEditor validates
- Updates Room/Aperture data
- Renderer updates if needed

#### User requests transport paths

- TransportPathManager sends aperture graph
- Backend returns paths
- UI shows path tiles
- Hovering highlights apertures + lines

#### User saves layout

- LoadSaveManager exports room files + master file

#### User loads layout

- LoadSaveManager reconstructs rooms + apertures
- DOM recreated
- Renderer updates
