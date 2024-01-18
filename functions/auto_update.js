const { app } = require("electron");
const https = require("https");
const isDev = require("electron-is-dev");

const {
  NsisUpdater,
  MacUpdater,
  AppImageUpdater,
} = require("electron-updater");
const log = require("electron-log");
const heartbeat = require("../requests/heatbeat");

function appUpdate(
  api_root_protocol,
  api_root,
  software_uri,
  mac_address,
  commandLogId
) {
  function replaceColonsWithUnderscores(inputString) {
    return inputString.replace(/:/g, "_");
  }

  let modifiedMacAddr = replaceColonsWithUnderscores(mac_address);
    const url = `${api_root_protocol}://${api_root}${software_uri}${modifiedMacAddr}/ssss.png`;
console.log('url,isDev :>> ', url,isDev);
  var newVersion;

  if (isDev) {
    const options = {
      requestHeaders: {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      },
      provider: "generic",
      url: url,
    };
// console.log('options :>> ', options,process.platform);
    if (process.platform === "win32") {
      autoUpdater = new NsisUpdater(options);
    } else if (process.platform === "darwin") {
      autoUpdater = new MacUpdater(options);
    } else {
      autoUpdater = new AppImageUpdater(options);
    }

    autoUpdater.checkForUpdates();

    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = "info";
    log.info("App starting...");

    autoUpdater.on("checking-for-update", () => {
      console.log("Checking for updates...");
    });

    autoUpdater.on("update-available", (info) => {
      console.log("Update available");
      console.log("Version", info.version);
      console.log("Release date", info.releaseDate);
      newVersion = info.version;
    });

    autoUpdater.on("update-not-available", () => {
      console.log("Update not available");
      commandLogId
        ? heartbeat.sendHeartbeat(
            commandLogId,
            "SUCCESS",
            `No update available, current version: ${app.getVersion()}`
          )
        : null;
    });

    autoUpdater.on("download-progress", (progress) => {
      console.log(`Progress ${Math.floor(progress.percent)}`);
      commandLogId
        ? heartbeat.sendHeartbeat(
            commandLogId,
            "SUCCESS",
            `Software download status : ${Math.floor(progress.percent)} %`
          )
        : null;
    });

    autoUpdater.on("update-downloaded", () => {
      console.log("Update downloaded");
      commandLogId
        ? heartbeat.sendHeartbeat(
            commandLogId,
            "SUCCESS",
            `Software Updated to new version: ${newVersion}`
          )
        : null;

      setTimeout(function () {
        autoUpdater.quitAndInstall();
      }, 5000);
    });

    autoUpdater.on("error", (error) => {
      console.error(error);
      // commandLogId
      //   ? heartbeat.sendHeartbeat(
      //       commandLogId,
      //       "FAILED",
      //       `Software Update failed: ${error}`
      //     )
      //   : null;
    });
  } else {
    console.log("No update since running in Development Mode");
    commandLogId
      ? heartbeat.sendHeartbeat(
          commandLogId,
          "SUCCESS",
          "No update since running in Development Mode"
        )
      : null;
  }
}

exports.appUpdate = appUpdate;
