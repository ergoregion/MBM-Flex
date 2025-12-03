from fastapi import APIRouter
import pyjson5
from pydantic import BaseModel
from multiroom_model.json_parser import RoomChemistryJSONBuilder, WindJsonBuilder

router = APIRouter()

class InputModel(BaseModel):
    input_string: str


def pretty_json_error(input_string: str, error: Exception):
    msg = str(error)

    # Extract position from the error message
    import re
    match = re.search(r"near (\d+)", msg)
    if not match:
        return msg
    
    pos = int(match.group(1))  # character index

    # Compute line/column
    lines = input_string.splitlines()
    running = 0
    for i, line in enumerate(lines, start=1):
        if running + len(line) + 1 > pos:
            col = pos - running
            line_text = line
            pointer = " " * col + "^"
            break
        running += len(line) + 1
    else:
        return msg

    # Short human-friendly descriptor
    if "comma" in msg:
        expectation = "Expected a comma `,` or closing brace `}`."
    else:
        expectation = msg

    return (
        f"{expectation}\n"
        f"Line {i}, column {col}:\n"
        f"    {line_text}\n"
        f"    {pointer}"
    )



@router.post("/room")
def room(payload: InputModel):
    input_string = payload.input_string
    try:
        data = pyjson5.loads(input_string)
    except Exception as e:
        return {"success": False, "message": pretty_json_error(input_string, e)}
    try:
        room = RoomChemistryJSONBuilder.from_dict(data)
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}
    

@router.post("/wind")
def wind(payload: InputModel):
    input_string = payload.input_string
    try:
        data = pyjson5.loads(input_string)
    except Exception as e:
        return {"success": False, "message": pretty_json_error(input_string, e)}
    try:
        room = WindJsonBuilder.from_dict(data)
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}

