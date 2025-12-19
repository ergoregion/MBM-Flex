from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import pickle
import pandas as pd

router = APIRouter()

results = {}

class InputModel(BaseModel):
    filename: str


def intersect(*d):
    sets = iter(map(set, d))
    result = sets.next()
    for s in sets:
        result = result.intersection(s)
    return result

@router.post("/load")
async def load(file: UploadFile = File(...)):
    global results
    # Read file bytes
    contents = await file.read()

    results = pickle.loads(contents)

    times = list(data.index for _, data in results.items())
    intersecting_times = list(set(times[0]).intersection(*times))
    intersecting_times.sort()

    return {
        "status": "success",
        "rooms":  dict((room, list(data.index)) for room, data in results.items()),
        "intersecting_times": intersecting_times
    }

@router.get("/check_species")
async def check_species(species: str):
    global results
    return dict((room, (species in data.keys())) for room, data in results.items())


@router.get("/check_time")
async def check_time(time: float):
    global results
    return dict((room, (time in data.index)) for room, data in results.items())

@router.get("/view")
async def view(species: str = "H2O", time: float = 0.0):
    global results
    return dict((room, data[species][time]) for room, data in results.items())
