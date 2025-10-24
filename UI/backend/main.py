from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import threading
import webbrowser
import uvicorn
import socket
from result import router as result_router
from setup import router as setup_router
from running import router as running_router

app = FastAPI()


# Example math API endpoint
@app.get("/add")
def add(a: float, b: float):
    print(a)
    print(b)
    return {"result": a + b}

# Include routers
app.include_router(result_router, prefix="/results")
app.include_router(setup_router, prefix="/setup")
app.include_router(running_router, prefix="/run")

# Serve the frontend (HTML/JS)
frontend_path = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")


def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) != 0

if __name__ == "__main__":
    port = 8000
    while not is_port_free(port):
        port += 1
    threading.Timer(1, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    uvicorn.run(app, host="127.0.0.1", port=port)