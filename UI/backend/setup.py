from fastapi import APIRouter

router = APIRouter()

@router.get("/add")
def add(a: float, b: float):
    return {"result": a + b}

@router.get("/multiply")
def multiply(a: float, b: float):
    return {"result": a * b}