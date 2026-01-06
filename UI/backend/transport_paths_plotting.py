from fastapi import APIRouter
from pydantic import BaseModel
from multiroom_model.transport_paths import paths_through_building, Side
from typing import List

router = APIRouter()


class InputAperture(BaseModel):
    """
    Represents a single aperture sent from the frontend.

    Attributes
    ----------
    origin : str
        Label of the room where the aperture begins.
    destination : str
        Label of the room or outside direction ("Front", "Back", etc.).
    id : str
        Unique aperture identifier (matches frontend aperture.id).
    """
    origin: str
    destination: str
    id: str


class InputModel(BaseModel):
    """
    Request body for the /paths endpoint.

    Attributes
    ----------
    apertures : List[InputAperture]
        List of all apertures in the current layout.
    """
    apertures: List[InputAperture]


class MockRoom:
    """
    Lightweight stand-in for the real Room model.

    The transport-path solver only needs a `.name` attribute,
    so we avoid importing the full room model and keep this endpoint
    decoupled from the rest of the backend.
    """
    def __init__(self, name: str):
        self.name = name


class MockAperture:
    """
    Lightweight stand-in for the real Aperture model.

    The solver only requires:
      - origin (Room or Side)
      - destination (Room or Side)
      - id (identifier used to return results)
    """
    def __init__(self, origin, destination, id: str):
        self.origin = origin
        self.destination = destination
        self.id = id


# Mapping of outside labels to the solver's Side enum
outsides = {
    "Front": Side.Front,
    "Left": Side.Left,
    "Back": Side.Back,
    "Right": Side.Right,
}


@router.post("/paths")
def paths(payload: InputModel):
    """
    Compute transport paths through the building.

    The frontend sends a list of apertures, each connecting:
      - room → room, or
      - room → outside (Front/Back/Left/Right)

    This endpoint reconstructs a minimal in-memory graph using
    MockRoom and MockAperture objects, then passes it to
    `paths_through_building`, which performs the actual pathfinding.

    Returns
    -------
    List[List[str]]
        A list of transport paths, where each path is represented
        as a list of aperture IDs in traversal order.
    """
    rooms = {}       # name → MockRoom
    apertures = {}   # id → MockAperture

    # Build graph nodes and edges
    for a in payload.apertures:

        # Ensure origin room exists
        if a.origin in rooms:
            origin = rooms[a.origin]
        else:
            origin = MockRoom(name=a.origin)
            rooms[a.origin] = origin

        # Destination may be a room or an outside direction
        if a.destination in outsides:
            destination = outsides[a.destination]
        elif a.destination in rooms:
            destination = rooms[a.destination]
        else:
            destination = MockRoom(name=a.destination)
            rooms[a.destination] = destination

        # Create aperture edge
        apertures[a.id] = MockAperture(
            origin=origin,
            destination=destination,
            id=a.id
        )

    # Compute transport paths using the solver
    transport_paths = paths_through_building(
        rooms.values(),
        apertures.values()
    )

    # Extract ordered aperture IDs from solver output
    routes = [t.route for t in transport_paths]
    result = [[p.aperture.id for p in route] for route in routes]

    return result
