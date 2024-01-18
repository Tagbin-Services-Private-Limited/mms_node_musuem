const { app, BrowserWindow } = require("electron");
const { download } = require("electron-dl");
const { system_vitals } = require("./hardare_interface");
const osInfo = require("@felipebutcher/node-os-info");

// Optional: Set the directory where you want to save downloaded files
const downloadDirectory = app.getPath("videos");

function reload() {
  BrowserWindow.getAllWindows()[0].send("webContents2Renderer", "load");
}

async function download_asset(url, sendProgress) {
  console.log(url);

  try {
    const mainWindow = BrowserWindow.getAllWindows()[0]; // Get the main window
    const { savePath } = await download(mainWindow, url, {
      directory: downloadDirectory,
      onProgress: (progress) => {
        // sendProgress(progress);
        console.log("Download progress:", progress);
      },
    });

    // Download completed successfully
    setTimeout(() => {
      BrowserWindow.getAllWindows()[0].send("webContents2Renderer", "load");
      console.log("Download completed. File saved at:", savePath);
    }, 1500);

    return "OK";
  } catch (error) {
    // Download error
    console.error("Download error:", error);
    return "ERROR";
  }
}

exports.download_asset = download_asset;
exports.reload = reload;
let filters = [{key:"event_id",operator:"=",value:123},{},{},{}]