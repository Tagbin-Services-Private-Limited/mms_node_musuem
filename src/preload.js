// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");
const io = require("socket.io-client"); // Ensure socket.io-client is installed

window.addEventListener('DOMContentLoaded', () => {
  console.log("working hereeee inside");
  // Log message to the main process
  // Log message to the main process
  const logMessageToMainProcess = (message) => {
    ipcRenderer.send("log-message", message);
  };

  // Log message to the renderer process console
  const logMessageToRendererProcess = (message) => {
    console.log(message);
  };

  // Replace text function (similar to your existing code)
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
  // Expose logMessageToMainProcess and logMessageToRendererProcess to the renderer process
  contextBridge.exposeInMainWorld("electronLogs", {
    logMessageToMainProcess: logMessageToMainProcess,
    logMessageToRendererProcess: logMessageToRendererProcess,
  });
})

// document.addEventListener("DOMContentLoaded", () => {
//   // Hide the mouse cursor
//   document.body.style.cursor = "none";
// });



// Connect to the Socket.io server
