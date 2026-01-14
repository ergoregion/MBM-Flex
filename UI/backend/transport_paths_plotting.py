from fastapi import APIRouter
from pydantic import BaseModel
from collections import namedtuple
from multiroom_model.transport_paths import paths_through_building, Side
from typing import List

router = APIRouter()


# Pydantic models to act as FastAPI request payloads
class InputAperture(BaseModel):
    origin: str
    destination: str
    id: str
class InputModel(BaseModel):
    apertures: List[InputAperture]


# Mock rooms and apertures
# Importing the full Room/Aperture classes are surplus if we only generate transport paths
MockRoom = namedtuple("MockRoom", ["name"])
MockAperture = namedtuple("MockAperture", ["origin", "destination", "id"])


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
