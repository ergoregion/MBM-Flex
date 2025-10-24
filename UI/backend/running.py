from fastapi import FastAPI, HTTPException
import asyncio
import uuid
from io import StringIO
import sys
import contextlib
from fastapi import APIRouter

router = APIRouter()

tasks = {}       # task_id -> asyncio.Task
task_logs = {}   # task_id -> StringIO buffer

# Example long-running task that prints logs
async def long_running_task(n: int, task_id: str):
    log_buffer = task_logs[task_id]
    # Redirect stdout to the buffer
    with contextlib.redirect_stdout(log_buffer):
        for i in range(n):
            print(f"Step {i+1}/{n}")
            await asyncio.sleep(1)
        print("Task completed!")

# --- Start task ---
@router.post("/start")
async def start_task(n: int = 5):
    task_id = str(uuid.uuid4())
    task_logs[task_id] = StringIO()
    task = asyncio.create_task(long_running_task(n, task_id))
    tasks[task_id] = task
    return {"task_id": task_id}

# --- Check status ---
@router.get("/status/{task_id}")
async def get_status(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    status = "finished" if task.done() else "running"
    result = None
    if task.done():
        try:
            result = task.result()
        except Exception as e:
            result = str(e)
    return {"status": status, "result": result}

# --- Cancel task ---
@router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    canceled = task.cancel()
    return {"task_id": task_id, "canceled": canceled}

# --- Get logs ---
@router.get("/logs/{task_id}")
async def get_logs(task_id: str):
    log_buffer = task_logs.get(task_id)
    if not log_buffer:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"logs": log_buffer.getvalue()}
