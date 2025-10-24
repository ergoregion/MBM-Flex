document.getElementById("add").onclick = async () => {
  const a = document.getElementById("a").value;
  const b = document.getElementById("b").value;
  const res = await fetch(`/setup/add?a=${a}&b=${b}`);
  const data = await res.json();
  const res2 = await fetch(`/setup/multiply?a=${a}&b=${b}`);
  const data2 = await res2.json();
  document.getElementById("result").textContent = `Result: ${data.result}, ${data2.result}`;
};
let taskId = null;
let interval = null;
document.getElementById("startBtn").onclick = async () => {
    const response = await fetch(`/run/start`, { method: "POST" });
    const data = await response.json();
    taskId = data.task_id;
    document.getElementById("status").innerText = "Running";
    document.getElementById("cancelBtn").disabled = false;
    
    // Start polling logs/status
    interval = setInterval(updateTask, 1000);
};

document.getElementById("cancelBtn").onclick = async () => {
    if (!taskId) return;
    await fetch(`/run/cancel/${taskId}`, { method: "POST" });
    document.getElementById("status").innerText = "Cancelled";
    clearInterval(interval);
    document.getElementById("cancelBtn").disabled = true;
};

async function updateTask() {
    if (!taskId) return;
    
    // Update status
    const statusResp = await fetch(`/run/status/${taskId}`);
    const statusData = await statusResp.json();
    document.getElementById("status").innerText = statusData.status;

    // Update logs
    const logsResp = await fetch(`/run/logs/${taskId}`);
    const logsData = await logsResp.json();
    console.log("Logs data:", logsData);
    const logBox = document.getElementById("logBox");
    logBox.innerText = logsData.logs;

    if (statusData.status === "finished") {
        clearInterval(interval);
        document.getElementById("cancelBtn").disabled = true;
    }
}