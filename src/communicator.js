const http_service = require("./httpService");
var exec = require("child_process").exec;
const heartbeat = require("../requests/heatbeat");
const fs = require("fs");
const path = require("path");
const wo = require("./wo");
const { resolumeHandler } = require("./resolume");
const axios = require("axios");
const { app, BrowserWindow } = require("electron");
const AdmZip = require("adm-zip");
const { addOrUpdateConfigData } = require("./appDatabase");
const DownloadManager = require("../requests/electon_download_manager");
const { spawn } = require("child_process");
const sendToCloudFunction = require("./messages");
const sendLogViaHeartBeat = require("./logInHeartbeat");

DownloadManager.register({
  downloadFolder: "\\",
});
const video_commands = [
  "load",
  "run",
  "halt",
  "kill",
  "reset",
  "restart",
  "resetShow",
  "resetE",
  "resetH",
  "runShow",
  "nextVideo",
  "previousVideo",
];
system_commands = ["sleep", "shutdown", "new_asset"];
function sendToRenderer(message) {
  global.mainWindow.webContents.send("webContents2Renderer", message);
}

async function sendToApp(command, commandLogId, commandFiles, mode, ip, port) {
  console.log('(command, commandLogId, commandFiles, mode, ip, port :>> ', command, commandLogId, commandFiles, mode, ip, port);
  sendToCloudFunction(
    `Recieved command, commandLogId, commandFiles, mode , line 41
    ${command},
    ${commandLogId},
    ${commandFiles},
    ${mode}`
  );
  sendLogViaHeartBeat(
    commandLogId,
    `Recived tcp request for ${command}${
      commandFiles ? ":" + commandFiles : ""
    }.`,
    "ACKNOWLEDGED"
  );
  if (video_commands.includes(command)) {
    APP_DATA.watchout
      ? wo.WOHandler.startWoConnect(command, commandLogId, ip, port)
      : sendToRenderer(command + " " + commandLogId + " " + commandFiles);
    APP_DATA.isResolume
      ? resolumeHandler.applyResolumeCommand(
          command,
          commandLogId,
          commandFiles
        )
      : sendToRenderer(command + " " + commandLogId + " " + commandFiles);
  }
  if (command.startsWith("new_asset")) {
    if (command.split(" ").length < 2) {
      sendToCloudFunction("URL missing");
      sendToNetwork("Asset URL Missing", mode);
    } else {
      http_service.download_asset(command.split(" ")[1], ".");
    }
  } else if (command.startsWith("VOLUME")) {
    // if (commandFiles === 0) {
    //   await loudness.setMuted(true);
    // } else {
    //   await loudness.setVolume(commandFiles).then((res) => {});
    // }
    let vol = "amixer -D pulse sset Master " + commandFiles + "%";
    exec(vol, function (error, stdout, stderr) {
      console.log(stdout);
    });
    APP_DATA.isResolume
      ? resolumeHandler.applyResolumeCommand(
          command,
          commandLogId,
          commandFiles
        )
      : sendToRenderer(command + " " + commandLogId + " " + commandFiles);
  } else if (command.startsWith("AUDIO_CHECK")) {
    try {
      global.audioDB.find({}, (err, doc) => {
        console.log(err);
        if (doc.length > 0) {
          global.audioDB.remove(
            {},
            { multi: true },
            function (err, numRemoved) {}
          );
        }
        var audio_args = commandFiles.split("_");
        console.log(audio_args);
        var audio_obj = parseInt(audio_args[0]);
        var obj = {
          is_audio: audio_obj,
          height: parseInt(audio_args[1]),
          width: parseInt(audio_args[2]),
        };
        global.audioDB.insert(obj, function (err, newDoc) {});
      });
    } catch (e) {
      sendToCloudFunction("error in audio check" + e);
    }
  } else if (command.startsWith("replace_logo")) {
    // console.log(path.resolve(process.cwd(), "assets", "imgs", "1.png"));
    DownloadManager.download(
      {
        url: commandFiles,
        path: path.resolve(process.cwd(), "assets", "imgs"),
      },
      function (error, info) {
        if (error) {
          console.log(error);
          return;
        }
        console.log("DONE: " + info.url);
        let farray = info.filePath.split("/");
        console.log(farray[farray.length - 1]);
        try {
          fs.unlinkSync(path.resolve(process.cwd(), "assets", "imgs", "1.png"));
        } catch (e) {}
        fs.rename(
          path.resolve(
            process.cwd(),
            "assets",
            "imgs",
            farray[farray.length - 1]
          ),
          path.resolve(process.cwd(), "assets", "imgs", "1.png"),
          function (err) {
            if (err) throw err;
            console.log("File Renamed.");
          }
        );
      }
    );
  } else if (command.startsWith("add_image")) {
    DownloadManager.download(
      {
        url: commandFiles,
        path: path.resolve(process.cwd(), "assets", "imgs"),
      },
      function (error, info) {
        if (error) {
          console.log(error);
          return;
        }
        console.log("DONE: " + info.url);
        let farray = info.filePath.split("/");
        console.log(farray[farray.length - 1]);
        try {
          fs.unlinkSync(
            path.resolve(process.cwd(), "assets", "imgs", "image.png")
          );
        } catch (e) {}
        fs.rename(
          path.resolve(
            process.cwd(),
            "assets",
            "imgs",
            farray[farray.length - 1]
          ),
          path.resolve(process.cwd(), "assets", "imgs", "image.png"),
          function (err) {
            if (err) throw err;
            console.log("File Renamed.");
            sendToRenderer("reload");
          }
        );
      }
    );
  } else if (command.startsWith("size_image")) {
    global.imageDB.find({}, (err, doc) => {
      console.log(err);
      if (doc.length > 0) {
        global.imageDB.remove(
          {},
          { multi: true },
          function (err, numRemoved) {}
        );
      }
      var audio_args = commandFiles.split("_");
      console.log(audio_args);
      var audio_obj = parseInt(audio_args[0]);
      var obj = {
        is_image: audio_obj,
        height: parseInt(audio_args[1]),
        width: parseInt(audio_args[2]),
      };
      global.imageDB.insert(obj, function (err, newDoc) {});
    });
  } else if (command.startsWith("gotoTime")) {
    sendToRenderer(command + " " + commandLogId + " " + commandFiles);
  } else if (command.startsWith("TEST")) {
    sendToRenderer(command + " " + commandLogId + " " + commandFiles);
  }
  if (command.startsWith("timestamp")) {
    console.log('APP_DATA.watchout && command == "timestamp" :>> ', APP_DATA.watchout && command == "timestamp");
    if (APP_DATA.watchout && command == "timestamp") {
      wo.WOHandler.startWoConnect(command, commandLogId, ip, port);
    } else {
      sendToRenderer(command + " " + commandLogId + " " + commandFiles);
    }
  }
  if (command.startsWith("playByName")) {
    sendToRenderer(command + " " + commandLogId + " " + commandFiles);
  }
  if (system_commands.includes(command)) {
    sendToRenderer(command);
  }
  if (video_commands.includes(command)) {
    console.log("Received :" + command);
    sendToRenderer(command);
  }
  switch (command) {
    case "tcp_logging":
      // [TODO] Impletation not done
      APP_DATA.log_over_tcp = !APP_DATA.log_over_tcp;
      break;
    case "debug":
      // [TODO] Impletation not done
      APP_DATA.debug = !APP_DATA.debug;
      break;
    case "ip":
      tcp.TCPHandler.sendMessage(APP_DATA.system_ip);
      break;
    case "mac":
      tcp.TCPHandler.sendMessage(APP_DATA.mac_address);
      break;
    case "app_data":
      tcp.TCPHandler.sendMessage(JSON.stringify(APP_DATA));
      break;
    case "shutdown":
      exec("shutdown /s /t 0", function (error, stdout, stderr) {
        tcp.TCPHandler.sendMessage(stdout);
      });
      break;
    // case "update_content":
    //   // [TODO] Impelment for windows & linux
    //   // var spawn = require("child_process").spawn,
    //   //   ls = spawn(
    //   //     "wget " +
    //   //       APP_DATA.api_root_protocol +
    //   //       "://" +
    //   //       APP_DATA.api_root +
    //   //       "" +
    //   //       APP_DATA.video_uri +
    //   //       " -O " +
    //   //       APP_DATA.home_dir +
    //   //       "/01.mp4",
    //   //     []
    //   //   );

    //   // ls.stdout.on("data", function (data) {
    //   //   console.log("stdout: " + data.toString());
    //   // });

    //   // ls.stderr.on("data", function (data) {
    //   //   console.log("stderr: " + data.toString());
    //   // });

    //   // ls.on("exit", function (code) {
    //   //   console.log("child process exited with code " + code.toString());
    //   // });
    //   // let commandToDownload =
    //   //   "wget " +
    //   //   APP_DATA.api_root_protocol +
    //   //   "://" +
    //   //   APP_DATA.api_root +
    //   //   "" +
    //   //   APP_DATA.video_uri +
    //   //   " -O " +
    //   //   APP_DATA.home_dir +
    //   //   "/01.mp4";
    //   function replaceColonWithUnderscore(inputString) {
    //     return inputString.replace(/:/g, "_");
    //   }
    //   let mac_address = replaceColonWithUnderscore(APP_DATA.mac_address);

    //   let commandToDownload = "curl " + " -o " + APP_DATA.home_dir + "/01.mp4";
    //   APP_DATA.api_root_protocol +
    //     "://" +
    //     APP_DATA.api_root +
    //     "/" +
    //     mac_address +
    //     "" +
    //     APP_DATA.video_name +
    //     console.log(commandToDownload);
    //   let proc = exec(commandToDownload, function (error, stdout, stderr) {
    //     console.log(stdout, stderr);
    //     tcp.TCPHandler.sendMessage(stdout);
    //   });
    //   // console.log("proc :>> ", proc);
    //   proc.stdout.on("data", function (data) {
    //     console.log(data);
    //   });
    //   break;
    case "reboot":
      exec("shutdown /r /t 0", function (error, stdout, stderr) {
        tcp.TCPHandler.sendMessage(stdout);
      });
      break;
    case "shutdownForce":
      exec("shutdown /s /f /t 0", function (error, stdout, stderr) {
        tcp.TCPHandler.sendMessage(stdout);
      });
      break;
    case "SOFTWARE_UPDATE":
      try {
        function createOrUpdateBatchFile(filePath, content) {
          fs.writeFileSync(filePath, content, "utf8");
          sendToCloudFunction(`Batch file created/updated at: ${filePath}`);
          sendToCloudFunction(`Batch file content: ${content}`);
        }
        let appBasePath = path.join(process.cwd());
        const batchFilePath = `${appBasePath}\\softwareUpdate.bat`;
        sendToCloudFunction(`batchFilePath :>> ${batchFilePath}`);
        const batchFileContent = `@echo off
echo Step 1: Closing MMS-Node application...
taskkill /F /IM "MMS-Node.exe" >nul
echo Step 2: Waiting for 1 seconds...
timeout /t 1 /nobreak >nul
echo Step 3: Copying contents from newsoftware2 to newsoftware...
xcopy /Y /E /I "${appBasePath}\\newsoftware2\\win-unpacked" "${appBasePath}\\"
echo Step 4: Starting the application...
start "" /B "${appBasePath}\\MMS-Node.exe"
`;

        createOrUpdateBatchFile(batchFilePath, batchFileContent);
        function replaceColonWithUnderscore(inputString) {
          return inputString.replace(/:/g, "_");
        }
        let mac_address = replaceColonWithUnderscore(APP_DATA.mac_address);
        let newSoftwarePath = `${appBasePath}\\newsoftware.zip`;
        let commandToDownload = `curl -o "${newSoftwarePath}" -f ${APP_DATA.api_root_protocol}://${APP_DATA.api_root}${APP_DATA.software_uri}${mac_address}/win-unpacked.zip`;
        sendToCloudFunction(
          `${appBasePath},line number 344 app base path and command to download, ${commandToDownload}`
        );
        function stoppingApplication() {
          console.log("Stopping application...");
          process.exit(0);
        }
        let proc = exec(commandToDownload, function (error, stdout, stderr) {
          if (error) {
            sendToCloudFunction(`${error},line number 352 `);
          } else {
            sendLogViaHeartBeat(
              commandLogId,
              "New Software downloaded successfully on node",
              "INFO"
            );
            const zip = new AdmZip(newSoftwarePath);
            let pathToExtract = `${appBasePath}\\newsoftware2\\`;
            sendToCloudFunction(`pathToExtract :>> ${pathToExtract}`);
            zip.extractAllTo(pathToExtract, true);
            sendLogViaHeartBeat(
              commandLogId,
              "File extracted successfully",
              "INFO"
            );
            sendToCloudFunction(`opening this batchfile  :>> ${batchFilePath}`);
            // const batProcess = spawn(
            //   "cmd.exe",
            //   ["/c", "start", '""', batchFilePath],
            //   {
            //     detached: true,
            //     stdio: "ignore",
            //   }
            // );
            const batProcess = spawn(batchFilePath, [], {
              detached: true,
              stdio: "ignore",
            });
            batProcess.unref(); // Allow the parent process to exit independently
            batProcess.on("exit", (code) => {
              if (code === 0) {
                sendToCloudFunction(
                  "Batch file execution completed successfully."
                );
                stoppingApplication();
              } else {
                sendToCloudFunction(`Batch file exited with code ${code}`);
                stoppingApplication();
              }
            });
          }
        });
        proc.stdout.on("data", function (data) {
          console.log(data);
        });
      } catch (e) {
        sendToCloudFunction("error inside software update" + JSON.stringify(e));
        sendLogViaHeartBeat(
          commandLogId,
          "Error in updating software" + JSON.stringify(e),
          "ERROR"
        );
      }
      break;
    case "ADD_CONTENT":
      try {
        function replaceColonWithUnderscore(inputString) {
          return inputString.replace(/:/g, "_");
        }
        if (commandFiles !== (null || undefined)) {
          let filesArray = JSON.parse(commandFiles);
          filesArray.forEach((item, index) => {
            let isDone = false;
            let url =
              APP_DATA.api_root_protocol +
              "://" +
              APP_DATA.api_root +
              APP_DATA.content_uri +
              "/" +
              replaceColonWithUnderscore(APP_DATA.mac_address) +
              "/" +
              item;
            // let url="http://localhost/media/content/"+item;
            // let res = http_service.download_asset(url, ".", (progress) => {
            // console.log("progress+__________________________________________________________________________",progress);
            // if (!isDone) {
            // heartbeat.sendHeartbeat(
            //           commandLogId,
            //           "INFO",
            //           "File " +
            //         item +
            //         " downloaded " +
            //             progress.progress.toFixed(2).toString() +
            //             "%"
            //         );
            //   }
            //   if (progress.progress == "100" && !isDone) {
            //   isDone = true;
            //     heartbeat.sendHeartbeat(
            //           commandLogId,
            //           "INFO",
            //           " tcp request to add content " + commandFiles + " SUCCESSFUL"
            //         );
            //   }
            // });
            http_service
              .download_asset(url, app.getPath("videos"), (progress) => {
                console.log(
                  "Progress------------: " + JSON.stringify(progress)
                );
              })
              .then((result) => {
                console.log("Download result: " + result);
              })
              .catch((error) => {
                console.error("Download error: " + error);
              });
          });
        }
        // commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;
      } catch (e) {
        sendLogViaHeartBeat(
          commandLogId,
          " Error ocuured in tcp request to add content " + commandFiles + " ",
          "ERROR"
        );
      }
      break;
    case "DELETE_CONTENT":
      try {
        if (commandFiles !== (null || undefined)) {
          let filesArray = JSON.parse(commandFiles);
          filesArray.forEach((item, index) => {
            let file = path.join(APP_DATA.content_dir, item);
            fs.unlink(file, (err) => {});
            http_service.reload();
          });
        }
        sendLogViaHeartBeat(
          commandLogId,
          " tcp request to delete content " + commandFiles + " SUCCESSFUL",
          "INFO"
        );
      } catch (e) {
        sendLogViaHeartBeat(
          commandLogId,
          " Error ocuured in tcp request to delete content " +
            commandFiles +
            " ",
          "ERROR"
        );
      }
      commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;
      break;
    case "LIST_CONTENT":
      let files = fs.readdirSync(APP_DATA.content_dir);
      commandLogId ? tcp.TCPHandler.sendMessage(files.toString()) : null;
      sendLogViaHeartBeat(
        commandLogId,
        "Recived tcp request to list content .",
        "INFO"
      );
      break;
    case "SORT_CONTENT":
      commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;
      break;
    case "TEST":
      break;
    case "SHOW_ON_UI":
      try {
        // The base64 encoded input string
        let base64string = commandFiles;
        // Create a buffer from the string
        let bufferObj = Buffer.from(base64string, "base64");
        // Encode the Buffer as a utf8 string
        let decodedString = bufferObj.toString("utf8");
        sendToRenderer("SHOW_ON_UI @@--@@" + decodedString);
      } catch (e) {}
      break;
    case "Disable_2626":
      try {
        global.dbloc.find({}, (err, doc) => {
          console.log(err);
          if (doc.length > 0) {
            global.dbloc.remove(
              {},
              { multi: true },
              function (err, numRemoved) {}
            );
          }
          global.dbloc.insert({ onlyEncrypted: true }, function (err, doc) {});
        });
        global.APP_DATA.shutdown_2626 = true;
        addOrUpdateConfigData({ shutdown_2626: true });
        sendLogViaHeartBeat(
          commandLogId,
          "2626 port is Closed for All commands",
          "Success"
        );
      } catch (e) {
        sendLogViaHeartBeat(
          commandLogId,
          "Issue while closing 2626" + e,
          "ERROR"
        );
      }
      break;
    case "Enable_2626":
      try {
        global.dbloc.find({}, (err, doc) => {
          console.log(err);
          if (doc.length > 0) {
            global.dbloc.remove(
              {},
              { multi: true },
              function (err, numRemoved) {}
            );
          }
          global.dbloc.insert({ onlyEncrypted: false }, function (err, doc) {
            console.log("this is DB===>>>", doc);
          });
        });
        global.APP_DATA.shutdown_2626 = false;
        addOrUpdateConfigData({ shutdown_2626: false });
        sendLogViaHeartBeat(
          commandLogId,
          "2626 port is Started for All commands",
          "Success"
        );
      } catch (e) {
        sendLogViaHeartBeat(
          commandLogId,
          "Issue while starting 2626" + e,
          "ERROR"
        );
      }
      break;
    default:
      console.log("Incorrect command or video command", command);
      break;
  }
}

async function downloadImage(url) {
  const img_url = "https://unsplash.com/photos/AaEQmoufHLk/download?force=true";
  const pathh = path.resolve(process.cwd(), "assets", "imgs", "logo.jpg");
  const writer = fs.createWriteStream(pathh);
  const response = await axios({
    img_url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function sendToNetwork(message, method) {
  if (method == "TCP") {
    console.log("Received :" + message);
    sendToRenderer(message);
  }
}

exports.video_commands = video_commands;
exports.sendToApp = sendToApp;
exports.sendToNetwork = sendToNetwork;
