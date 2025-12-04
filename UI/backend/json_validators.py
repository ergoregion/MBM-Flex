from fastapi import APIRouter
import pyjson5
from pydantic import BaseModel
from multiroom_model.json_parser import RoomChemistryJSONBuilder, WindJsonBuilder
from .json_error_to_english import pretty_json_error

router = APIRouter()

class InputModel(BaseModel):
    input_string: str




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
        wind = WindJsonBuilder.from_dict(data)
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}

