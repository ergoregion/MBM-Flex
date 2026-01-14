from fastapi import APIRouter, UploadFile, File
import pickle
import pandas as pd

router = APIRouter()

# Global in‑memory store for loaded simulation results.
results = {}


def intersect(*d):
    """
    Compute the intersection of multiple iterables.

    Parameters
    ----------
    *d : iterable
        Any number of iterables whose intersection is desired.

    Returns
    -------
    set
        The set of elements common to all iterables.
    """
    sets = iter(map(set, d))
    result = next(sets)
    for s in sets:
        result = result.intersection(s)
    return result


@router.post("/load")
async def load(file: UploadFile = File(...)):
    """
    Load a pickled results file uploaded from the frontend.

    The file is expected to contain a dictionary:
        { roomName: pandas.DataFrame }

    Each DataFrame:
        - is indexed by time
        - has columns representing species
        - contains numeric values

    Returns
    -------
    dict
        {
            "status": "success",
            "rooms": { roomName: [list of time indices] },
            "intersecting_times": [sorted list of times present in all rooms]
        }
    """
    global results

    # Read raw bytes from uploaded file
    contents = await file.read()

    # Unpickle into Python objects
    results = pickle.loads(contents)

    # Extract time indices for each room
    times = [data.index for _, data in results.items()]

    # Compute times that exist in *all* rooms
    intersecting_times = list(set(times[0]).intersection(*times))
    intersecting_times.sort()

    return {
        "status": "success",
        "rooms": list(results.keys()),
        "intersecting_times": intersecting_times
    }


@router.get("/check_species")
async def check_species(species: str):
    """
    Check whether each room contains the requested species.

    Returns
    -------
    dict
        { roomName: True/False }
    """
    global results
    return {
        room: (species in data.keys())
        for room, data in results.items()
    }


@router.get("/check_time")
async def check_time(time: float):
    """
    Check whether each room contains data for the given time index.

    Returns
    -------
    dict
        { roomName: True/False }
    """
    global results
    return {
        room: (time in data.index)
        for room, data in results.items()
    }


@router.get("/range")
async def range(species: str):
    """
    Compute the (min, max) range of a species for each room.

    Returns
    -------
    dict
        { roomName: (minValue, maxValue) }
    """
    global results

    def result(data):
        if species not in data.keys():
            return (None, None)
        return (data[species].min(), data[species].max())

    return {
        room: result(data)
        for room, data in results.items()
    }


@router.get("/values")
async def values(
    species: str,
    time: float,
    last_value: bool = True
):
    """
    Retrieve the value of a species at a given time for each room.

    If the value at that time is a pandas.Series (e.g., multiple
    values recorded at the same timestamp), then:
        - last_value=True → return the last entry
        - last_value=False → return the first entry

    Returns
    -------
    dict
        { roomName: numericValue }
    """
    global results

    # Choose which element to extract if a Series is returned
    location = -1 if last_value else 0

    def result(data):
        if species not in data.keys():
            return None
        s = data[species]
        if time not in s:
            return None
        val = s[time]
        return val.iloc[location] if isinstance(val, pd.Series) else val

    result_dict = {
        room: result(data)
        for room, data in results.items()
    }

    return result_dict
