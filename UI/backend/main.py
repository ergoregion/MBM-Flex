from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import socket
from .result import router as result_router
from .json_validators import router as json_validators_router
from .transport_paths_plotting import router as transport_path_router

app = FastAPI()

# Include routers
app.include_router(result_router, prefix="/results")
app.include_router(json_validators_router, prefix="/jsonvalidators")
app.include_router(transport_path_router, prefix="/transport")

# Serve the frontend (HTML/JS)
frontend_path = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")


def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) != 0
