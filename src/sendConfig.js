const fs = require("fs");
const path = require("path");
const { app, ipcMain } = require("electron");

async function prepareConfigData() {
  try {
    const desktopPath = app.getPath("desktop");
    const settingsFilePath = path.join(desktopPath, "settings.json");
    if (fs.existsSync(settingsFilePath)) {
      return new Promise((resolve, reject) => {
        fs.readFile(settingsFilePath, "utf-8", (readErr, data) => {
          if (readErr) {
            resolve("Error in reading settings json");
          } else {
            resolve(data);
          }
        });
      });
    } else {
      return "Settings file not found";
    }
  } catch (err) {
    console.log("err prepareConfigData_________________________:>> ", err);
    return "Error in reading settings.json function";
  }
}

module.exports = prepareConfigData;
