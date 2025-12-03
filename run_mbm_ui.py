from UI.backend.main import app, is_port_free

import threading
import webbrowser
import uvicorn

if __name__ == "__main__":
    port = 8000
    while not is_port_free(port):
        port += 1
    threading.Timer(1, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    uvicorn.run(app, host="127.0.0.1", port=port)