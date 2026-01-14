from fastapi import APIRouter
import pyjson5
from pydantic import BaseModel
from multiroom_model.json_parser import RoomChemistryJSONBuilder, WindJsonBuilder
from .json_error_to_english import pretty_json_error

router = APIRouter()


class InputModel(BaseModel):
    """
    Request model for JSON validation endpoints.

    Attributes
    ----------
    input_string : str
        Raw JSON text provided by the frontend editor.
    """
    input_string: str


@router.post("/room")
def room(payload: InputModel):
    """
    Validate room JSON submitted by the frontend.

    This endpoint performs two layers of validation:
      1. Parse the input using pyjson5 (allows comments, trailing commas, etc.)
      2. Validate the resulting dict using RoomChemistryJSONBuilder

    Returns
    -------
    dict
        { "success": True } if valid,
        { "success": False, "message": <error> } if invalid.
    """
    input_string = payload.input_string

    # Step 1: JSON parsing (with helpful error messages)
    try:
        data = pyjson5.loads(input_string)
    except Exception as e:
        return {
            "success": False,
            "message": pretty_json_error(input_string, e)
        }

    # Step 2: Domain‑specific validation
    try:
        RoomChemistryJSONBuilder.from_dict(data)
        return {"success": True}
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


@router.post("/wind")
def wind(payload: InputModel):
    """
    Validate wind JSON submitted by the frontend.

    Follows the same two‑stage validation process as /room:
      1. Parse JSON using pyjson5
      2. Validate using WindJsonBuilder

    Returns
    -------
    dict
        { "success": True } if valid,
        { "success": False, "message": <error> } if invalid.
    """
    input_string = payload.input_string

    # Step 1: JSON parsing
    try:
        data = pyjson5.loads(input_string)
    except Exception as e:
        return {
            "success": False,
            "message": pretty_json_error(input_string, e)
        }

    # Step 2: Domain‑specific validation
    try:
        WindJsonBuilder.from_dict(data)
        return {"success": True}
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }
