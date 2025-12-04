from fastapi import APIRouter
from pydantic import BaseModel
from multiroom_model.transport_paths import paths_through_building, Side
from typing import Union, List
from dataclasses import dataclass

router = APIRouter()


class InputAperture(BaseModel):
    origin: str
    destination: str
    id: str


class InputModel(BaseModel):
    apertures: List[InputAperture]


class MockRoom:
    def __init__(self, name):
        self.name = name


class MockAperture:
    def __init__(self, origin, destination, id):
        self.origin = origin
        self.destination = destination
        self.id = id


outsides = {"Front": Side.Front, "Left": Side.Left, "Back": Side.Back, "Right": Side.Right}


@router.post("/paths")
def paths(payload: InputModel):
    rooms = {}
    apertures = {}
    for a in payload.apertures:
        if a.origin in rooms:
            origin = rooms[a.origin]
        else:
            origin = MockRoom(name=a.origin)
            rooms[a.origin] = origin

        if a.destination in outsides:
            destination = outsides[a.destination]
        elif a.destination in rooms:
            destination = rooms[a.destination]
        else:
            destination = MockRoom(name=a.destination)
            rooms[a.destination] = destination

        apertures[a.id] = MockAperture(origin=origin, destination=destination, id=a.id)

    transport_paths = paths_through_building(rooms.values(), apertures.values())

    routes = [t.route for t in transport_paths]
    result = [[p.aperture.id for p in route] for route in routes]
    return result
