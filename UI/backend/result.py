from fastapi import APIRouter

router = APIRouter()

@router.get("/uppercase")
def uppercase(text: str):
    return {"result": text.upper()}