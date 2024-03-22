// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  screen,
} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const loudness = require("loudness");
const WebSocket = require("ws");
const https = require("https");
const mac_interface = require("getmac");
const osInfo = require("@felipebutcher/node-os-info");
const axios = require("axios");
const isDev = require("electron-is-dev");
const io = require("socket.io-client"); // Ensure socket.io-client is installed
const tcp = require("./src/tcp");
const heartbeat = require("./requests/heatbeat");
var pjson = require("./package.json");
const nodeCrypto2 = require("crypto");
const {
  setData,
  findImageData,
  findAudioData,
  findTokenData,
  insertToken,
  dbFilename,
  addOrUpdateConfigData,
  findConfigData,
} = require("./src/appDatabase");
let {
  setPastConfigsOnLoad,
  current_video_number,
  current_video_name,
  current_timestamp,
  current_video_status,
  current_volume,
  totalVideos,
  vduration,
  video_list,
  setIpAddress,
  setMacAddress,
  setVolumne,
  setBackendConfigs,
} = require("./src/constants");

async function setOldData() {
  await setPastConfigsOnLoad();
  await setData();
  await setBackendConfigs();
}
setOldData();
const electronDl = require("electron-dl");
const sendToCloudFunction = require("./src/messages");
electronDl();
// let win;
// (async () => {
//   await app.whenReady();
//   win = new BrowserWindow();
// })();
setIpAddress();
setMacAddress();
setVolumne();
const startServer = require("./src/tactionTable");
const startTactionWallServer = require("./src/tactionToWallEventReciever");
const sendDataFromTableToWall = require("./src/tactionToWallEventSender");
const prepareConfigData = require("./src/sendConfig");
const saveDataInNeDB = require("./src/dataSaverInNeDB");
if (global.APP_DATA.is_taction_table) {
  // const tactionTableServer = startServer();
  // tactionTableServer.on("close", () => {
  //   console.log("Server closed");
  // });
}
console.log(
  "global.APP_DATA.is_taction_table_wall :>> ",
  global.APP_DATA.is_taction_table_wall
);
if (global.APP_DATA.is_taction_table_wall) {
  const tactionWallServer = startTactionWallServer();
  tactionWallServer.on("close", () => {
    console.log("Server closed");
  });
}
ipcMain.handle("getAppPath", async (event, arg) => {
  // global.docs;
  // let data = await setAudioData();
  // global.docs = data;
  // return global.docs;
  if (arg === "GETPATH") {
    global.APP_DATA.content_dir = app.getPath("videos");
    return app.getAppPath();
  }
  return null;
});

ipcMain.handle("AUDIO", async (event, arg) => {
  global.docs;
  let data = await findAudioData();
  global.docs = data;
  return global.docs;
});

ipcMain.handle("IMAGE", async (event, arg) => {
  global.docs_image;
  let data = await findImageData();
  global.docs_image = data;
  return global.docs_image;
});

async function createWindow() {
  console.log(
    "==================================================================================90 line number"
  );
  // Create the browser window.
  let fileToPreload = path.join(__dirname, "src/preload.js");
  // console.log("fileToPreload :>> ", fileToPreload);

  mainWindow = new BrowserWindow({
    resizable: false,
    closable: false,
    width: 5760,
    height: 1080,
    alwaysOnTop: true,
    show: true,
    autoHideMenuBar: false,
    fullscreen: false,
    frame: false, // Remove title bar
    webPreferences: {
      // preload: fileToPreload,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  // mainWindow = new BrowserWindow({
  //   resizable: true,
  //   closable: false,
  //   width: 1560,
  //   height: 860,
  //   alwaysOnTop: true,
  //   show: true,
  //   autoHideMenuBar: false,
  //   fullscreen: false,
  //   frame: false, // Remove title bar
  //   webPreferences: {
  //     preload: fileToPreload,
  //     nodeIntegration: true,
  //     contextIsolation: false,
  //     enableRemoteModule: true,
  //   },
  // });
  // win = mainWindow;
  // mainWindow.setFullScreen(isDev || APP_DATA.watchout ? false : true);
  // mainWindow.setFullScreen(false);
  mainWindow.loadFile("index.html");
  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.show();
    console.log("--------------------inside google-------------------------");
    mainWindow.webContents.send("webContents2Renderer", "Browser ready to use");
    // mainWindow.loadURL("https://www.google.com/");
  });
  mainWindow.webContents.send(
    "webContents2Renderer",
    JSON.stringify({ action: "System IP", data: APP_DATA.system_ip })
  );
  const handleDatabaseResults = (doc) => {
    if (doc.length === 1) {
      APP_DATA.device_token = doc[0].success.device_token;
      APP_DATA.enable_heartbeat = true;
      APP_DATA.auth_token = doc[0].success.auth_token;
      console.log("Device Token found, starting Heartbeat");
    } else if (doc.length === 0) {
      console.log("Device not registered yet!");
      startRegistration();
    } else if (doc.length > 1) {
      console.log("Multiple tokens saved!");
      fs.unlinkSync(dbFilename);
      startRegistration();
    } else {
      console.log("Unable to Read Database file");
      mainWindow.webContents.send(
        "webContents2Renderer",
        JSON.stringify({
          action: "Critical Error",
          data: "More than one entry in Database",
        })
      );
    }
  };
  try {
    findTokenData()
      .then(handleDatabaseResults)
      .catch((error) => {
        console.error("Error reading database:", error);
        mainWindow.webContents.send(
          "webContents2Renderer",
          JSON.stringify({
            action: "Critical Error",
            data: "Error reading database",
          })
        );
      });
  } catch (error) {
    console.error("Error reading database:", error);
    mainWindow.webContents.send(
      "webContents2Renderer",
      JSON.stringify({
        action: "Critical Error",
        data: "Error reading database",
      })
    );
  }

  function generateKeyPair() {
    const keyPair = nodeCrypto2.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: "Trilok Panwar TriP " + mac_interface.default(),
      },
    });

    // Creating public and private key file
    fs.writeFileSync("public_key", keyPair.publicKey);
    fs.writeFileSync("private_key", keyPair.privateKey);
    startRegistration();
  }

  //Check for exiting public/private key in the app
  try {
    if (fs.existsSync("./public_key") && fs.existsSync("./private_key")) {
      console.log("Device already have public and private key.");
      startRegistration();
    } else {
      console.log("Unable to find PUBLIC or PRIVATE key. Generating both");
      generateKeyPair();
    }
  } catch (err) {
    console.error(err);
    generateKeyPair();
  }

  global.mainWindow = mainWindow;
  global.tcp = tcp;
  global.APP_DATA = APP_DATA;

  process.on("uncaughtException", function (err) {
    console.log(err);
    console.log("Something terrible happened inside main.js");

    mainWindow.webContents.send("webContents2Renderer", {
      type: "ERROR",
      data: err,
    });
  });

  //const win = mainWindow.getFocusedWindow();

  mainWindow.webContents.on("before-input-event", (event, input) => {
    console.log(input);
    // if (input.key == "d" || input.key == "D") {
    //   mainWindow.loadFile("heartbeat.html");
    // }
    if (input.key == "X") {
      mainWindow.loadFile("index.html");
    }
  });
  try {
    // START TCP SERVER
    tcp.TCPHandler.startTCPServer("0.0.0.0", APP_DATA.tcp_port);
    tcp.TCPHandler.startTCPServer("0.0.0.0", APP_DATA.tcp_port_encrypt);
  } catch (e) {
    sendToCloudFunction(`error from main.js  236 :>>  ${JSON.stringify(e)}`);
    console.log(e);
  }
}
ipcMain.on("log-message", (event, message) => {
  console.log(message);
});
ipcMain.on("renderer2main", (event, arg) => {
  // console.log("event, arg :>> ", event, arg);
  console.log(arg); // prints "ping"
  event.reply("main2renderer", "main2renderer");
  // tcp.TCPHandler.sendMessage(arg);
  //console.log(tcp.TCPHandler.sendMessage(arg));
});
// Listen for the event from the renderer process

ipcMain.on("socket-data", (event, data) => {
  // Send the data to the renderer process
  // console.log(
  //   "data and event in socket data for taction table---------------------------------------------------:>> ",
  //   data,
  //   event
  // );
  mainWindow.webContents.send("socket-data", event);
});
ipcMain.on("event-received", (event, data) => {
  // Send the data to the renderer process
  console.log(
    "data and event that are clicked on table and now received on wall, now send to wall main to renderer----------------------:>> ",
    data,
    event
  );
  mainWindow.webContents.send("event-received", event);
});
ipcMain.on("event-clicked", (event, data) => {
  sendDataFromTableToWall(data);
});
ipcMain.on("getConfig", async (event, data) => {
  let configDataForBuild = await prepareConfigData(data);
  event.reply("recievedConfig", configDataForBuild);
});
ipcMain.on("form-data", (event, data) => {
  if (global.APP_DATA.isCustomerFeedbackApp) {
    saveDataInNeDB(data);
  }
});
ipcMain.on("timestamp", (event, arg) => {
  event.reply("main2renderer", "main2renderer");
  console.log("arg--------------------", event, arg); // prints "ping"
  const message = arg.split("@")[2];
  const ip = arg.split("@")[1];
  const port = arg.split("@")[0];
  console.log("command args", message, ip);
  tcp.TCPHandler.sendMessageOnce(message, ip, port);
  //console.log(tcp.TCPHandler.sendMessage(arg));
});

// This method will be called when Electron has finished loading
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  APP_DATA.app_version = app.getVersion();
  createWindow();
  app.on("activate", function () {
    //   // On macOS it's common to re-create a window in the app when the
    //   // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
const getPlayList = () => {
  const directoryPath = APP_DATA.content_dir;
  let files = fs.readdirSync(directoryPath);
  video_list = files;
  return files;
};

app.on("ready", () => {
  try {
    console.log(
      process.cwd(),
      "here inside when app is ready and ipc main handling is going on"
    );
    ipcMain.handle("VideoCom", async (event, someArgument) => {
      let res;
      console.log(someArgument);
      switch (someArgument) {
        case "GETAPPPATH":
          res = app.getPath("videos");
          break;
        case "GET_PLAY_LIST":
          res = getPlayList();
          break;
      }
      return res;
    });
    ipcMain.handle("com_advertise", async (event, message) => {
      tcp.TCPHandler.sendMessage(message);
      return "ok";
    });
    ipcMain.handle("com_heartbeat", async (event, message) => {
      let msgArray = message.split(":");
      heartbeat.sendHeartbeat(msgArray[0], msgArray[1], msgArray[2]);
      return "ok";
    });
    ipcMain.handle("com_sync_heartbeat", async (event, message) => {
      message = JSON.parse(message);
      let vol = await loudness.getVolume();
      current_video_number = message.current_video_number;
      current_timestamp = message.current_timestamp;
      current_video_name = message.current_video_name;
      current_video_status = message.current_video_status;
      current_volume = vol;
      totalVideos = message.totalVideos;
      vduration = message.vduration;
      return "ok";
    });
    ipcMain.handle("com_sync_image_path", async (event, message) => {
      fs.exists(path.resolve(process.cwd(), "assets", "imgs"), (res) => {
        if (!res) {
          fs.mkdir(path.resolve(process.cwd(), "assets", "imgs"), (err) => {
            console.log(err);
          });
        }
      });
      return path.resolve(process.cwd(), "assets", "imgs", "1.png");
    });
  } catch (e) {
    console.log("Error: IP Address Not found" + e);
  }
});

app.on("window-all-closed", function () {
  tcp.TCPHandler.closeTCPServer(APP_DATA.tcp_port);
  tcp.TCPHandler.closeTCPServer(APP_DATA.tcp_port_encrypt);
  if (process.platform !== "darwin") app.quit();
});

/////////////////////////SEND HEARTBEAT//////////////////////////
// setInterval(async () => {
//   if (APP_DATA.enable_heartbeat) {
//     // console.log("Sending Heartbeat from main.js 617");
//     try {
//       osInfo.mem((memory) => {
//         // console.log('memory :>> ', memory);
//         APP_DATA.system_vitals.ram_usage = Math.round(memory * 100);
//       });
//       osInfo.cpu((cpu) => {
//         // console.log('cpu :>> ', cpu);
//         APP_DATA.system_vitals.cpu_usage = Math.round(cpu * 100);
//       });
//       // osInfo.disk((disk) => {
//       //   // console.log('disk :>> ', disk);
//       //   APP_DATA.system_vitals.disk_usage = Math.round(disk * 100);
//       // });
//       APP_DATA.system_vitals.uptime = os.uptime();
//       console.log(current_volume * 100);
//       let heartbeatPayload = {
//         disc_space_usage: APP_DATA.system_vitals.disk_usage,
//         cpu_usage: APP_DATA.system_vitals.cpu_usage,
//         ram_usage: APP_DATA.system_vitals.ram_usage,
//         temparature: APP_DATA.system_vitals.temprature,
//         uptime: APP_DATA.system_vitals.uptime,
//         version: APP_DATA.app_version,
//         current_video_number: current_video_number,
//         current_video_name: current_video_name,
//         current_timestamp: current_timestamp,
//         current_video_status: current_video_status,
//         current_volume: current_volume,
//         totalVideos: totalVideos,
//         vduration: vduration,
//         video_list: video_list,
//         mac_addr: APP_DATA.mac_address,
//       };
//       // console.log("heartbeatPayload 435:>> ", heartbeatPayload);
//       axios
//         .post(
//           APP_DATA.api_root_protocol +
//             "://" +
//             APP_DATA.api_root +
//             "" +
//             APP_DATA.heartbeat_api_endpoint,
//           heartbeatPayload,
//           {
//             headers: {
//               Authorization: `Token ${APP_DATA.auth_token}`,
//             },
//             httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//           }
//         )
//         .then(function (response) {
//           // console.log("response :>> ", response.data);
//           APP_DATA.heartbeat_response = response.data;
//           // console.log("heartbeat endpoint response---->>>", response.data);
//           mainWindow.webContents.send("webContents2Renderer", {
//             type: "DATA",
//             data: response.data,
//           });
//         })
//         .catch(function (error) {
//           APP_DATA.heartbeat_response = error;
//           console.log("error sending heartbeat//", error);
//           mainWindow.webContents.send("webContents2Renderer", {
//             action: "ERROR",
//             data: error,
//           });
//           //           if (error.response.status == 401) {
//           //             try {
//           //               fs.unlinkSync(dbFilename);
//           //               try{

//           //                 fs.unlink(dbFilename, function (err) {
//           //                   if (err) console.log(err);
//           //                   console.log("File deleted!");
//           //                 });
//           //               }catch(error){
//           // console.log('file already deleted no worries :>> ');
//           //               }
//           //               APP_DATA.enable_heartbeat = false;
//           //               APP_DATA.enable_registration = true;
//           //               mainWindow.webContents.send("webContents2Renderer", {
//           //                 action: "DATA",
//           //                 data: "Uanuthorised, resetting the application.",
//           //               });
//           //               startRegistration();
//           //             } catch (err) {
//           //               console.error(err);
//           //               mainWindow.webContents.send("webContents2Renderer", {
//           //                 action: "ERROR",
//           //                 data: "Unable to delete Database file",
//           //               });
//           //             }
//           //           }
//         });
//     } catch (e) {
//       console.log("main Error While sending Heartbeat" + e);
//     }
//   }
// }, 1500000);
let isRegisterationInitialised = false;
/////////////////////////SEND REGISTRATION///////////////////////
function startRegistration() {
  try {
    console.log("startRegistration called --------->>>>>>>>");
    // mainWindow.loanitidFile("heartbeat.html");
    UNIQUE_REG_CODE = Math.floor(Math.random() * 90000) + 10000;
    // DEVICE token  to be used for encrypting messages over TCP
    DEVICE_TOKEN = Math.floor(Math.random() * 90000) + 10000;
    async function initializeRegistration() {
      // Send Registration Signal if enabled
      if (APP_DATA.enable_registration) {
        try {
          mainWindow.webContents.send(
            "webContents2Renderer",
            "system ip is" + APP_DATA.system_ip
          );
          mainWindow.webContents.send(
            "webContents2Renderer",
            "Sending data of Resolume to 192.168.0.180"
          );
          mainWindow.webContents.send(
            "webContents2Renderer",
            "sending REGISTARTION request to:" +
              APP_DATA.api_root_protocol +
              "://" +
              APP_DATA.api_root +
              // ":8000" +
              APP_DATA.registration_api_endpoint
          );
          mainWindow.webContents.send("webContents2Renderer", {
            action: "REG_INIT",
            data: {
              unique_reg_code: UNIQUE_REG_CODE,
              message: "In registration process",
            },
          });
          try {
            if (fs.existsSync("./public_key")) {
              console.log("Public key is available.");
              let file = fs.readFileSync("./public_key", "utf8");
              var data = {
                name: UNIQUE_REG_CODE,
                node_name: "Node Name: " + UNIQUE_REG_CODE,
                description: pjson.description,
                mac_addr: APP_DATA.mac_address,
                ip: APP_DATA.system_ip,
                port: APP_DATA.tcp_port,
                encrypted_port: APP_DATA.tcp_port_encrypt,
                unique_reg_code: UNIQUE_REG_CODE,
                os_type: os.type(),
                os_name: os.platform(),
                os_arch: os.arch(),
                // total_disc_space: "12GB",
                // total_cpu: "2CPV",
                // total_ram: "14GB",
                // temprature: "24",
                version: app.getVersion(),
                // content_metadata: "test",
                pem_file: file,
              };
              sendToCloudFunction(
                `data in registration :>>  ${JSON.stringify(data)}`
              );
              axios({
                method: "post",
                url:
                  APP_DATA.api_root_protocol +
                  "://" +
                  APP_DATA.api_root +
                  // ":8000" +
                  APP_DATA.registration_api_endpoint,
                data: data,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
              })
                .then(function (response) {
                  sendToCloudFunction(
                    `response from registration :>>  ${JSON.stringify(
                      response.data
                    )}`
                  );
                  APP_DATA.heartbeat_response = response.data;
                  mainWindow.webContents.send("webContents2Renderer", {
                    type: "DATA",
                    data: response.data,
                  });
                  if (!response.data.error) {
                    if (response.data.success.status == "REG_APPROVED") {
                      // Insert Token in Database
                      insertToken(response.data)
                        .then((result) => {
                          APP_DATA.enable_heartbeat = true;
                          APP_DATA.enable_registration = false;
                          APP_DATA.auth_token =
                            response.data.success.auth_token;
                          APP_DATA.device_token =
                            response.data.success.device_token;
                          // mainWindow.loadFile("index.html");
                          clearInterval(registrationInterval);
                        })
                        .catch((error) => {
                          // Handle the error
                          console.log(
                            "Error occured while saving TOKEN",
                            error
                          );
                        });
                    } else if (response.data.success.status == "REG_COMPLETE") {
                      console.log(
                        "Registration is completed, response from mms is : ",
                        response.data.message
                      );
                      mainWindow.webContents.send("webContents2Renderer", {
                        action: "REG_COMPLETE",
                        data: {
                          unique_reg_code: UNIQUE_REG_CODE,
                          message: response.data.message,
                        },
                      });
                    } else if (response.data.success.status == "REG_INIT") {
                      console.log(
                        "Registration is initialized, response from mms is : ",
                        response.data.message
                      );
                      mainWindow.webContents.send("webContents2Renderer", {
                        type: "DATA",
                        action: "REG_INIT",
                        data: {
                          unique_reg_code: UNIQUE_REG_CODE,
                          message: response.data.message,
                        },
                      });
                    }
                  }
                })
                .catch(function (error) {
                  // TODO Handle the error properly,
                  //  - MMS  unreachable
                  // - Reponse from API
                  // console.log("====================insid catch", error);
                  APP_DATA.heartbeat_response = error;
                  mainWindow.webContents.send("webContents2Renderer", {
                    type: "ERROR",
                    data: error,
                  });
                });
            } else {
              console.log("Public Key not exists, please create first first");
              clearInterval(registrationInterval);
            }
          } catch (err) {
            sendToCloudFunction(
              `error from registration 579 :>>  ${JSON.stringify(err)}`
            );
            console.error(err);
          }
        } catch (e) {
          sendToCloudFunction(
            `error from registrationn 584:>>  ${JSON.stringify(e)}`
          );
          console.log("main Error While sending REGISTARTION" + e);
        }
      }
    }
    // initializeRegistration();
    if (!isRegisterationInitialised) {
      // var registrationInterval = setInterval(initializeRegistration, 1200000);
      isRegisterationInitialised = true;
    }
  } catch (e) {
    sendToCloudFunction(
      `error from registration 596 :>>  ${JSON.stringify(e)}`
    );
    console.log("error in starting 609", e);
  }
}

let RESOLUME_DATA = {
  index: 0,
  duration: 0,
  status: "halt",
  current_duration: 0,
};
///////////////////
global.RESOLUME_DATA = RESOLUME_DATA;
if (global.APP_DATA.isResolume) {
  const ws = new WebSocket("ws://192.168.0.190:8080/api/v1");
  let isDOne = false;
  global.websocket = ws;
  ws.on("open", function open() {
    console.log(
      "COngratulationSSSSSSSSSSSSSSSS)))))))))))))))))))))))))))))))))))))))))))))))))))))))))0"
    );
  });
  ws.on("close", function open() {
    console.log("closed");
  });
  ws.on("message", function message(data) {
    try {
      // console.log('received: %s', data);
      if (!isDOne || JSON.parse(data).id == undefined) {
        data = JSON.parse(data);
        if (data.error) {
          console.log("data error is:>> ", data);
        }
        // console.log(data);
        if (
          data != undefined &&
          data["layers"] != undefined &&
          data["layers"][0] != undefined &&
          data["layers"][0]["clips"][0]
        ) {
          // console.log("data545454", JSON.stringify(data));
          let id = data["layers"][0]["clips"][0]["transport"]["position"]["id"];
          let sid = data["layers"][0]["clips"][0]["selected"]["id"];
          let bid =
            data["layers"][0]["clips"][0]["transport"]["controls"][
              "playdirection"
            ]["id"];
          let videoId = data["layers"][0]["clips"][0]["id"];
          let volumeId = data["layers"][0]["audio"]["volume"]["id"];

          console.log("id sid bid", id, sid, bid);
          global.RESOLUME_DATA.volumeId = volumeId;
          global.RESOLUME_DATA.bid = bid;
          global.RESOLUME_DATA.id = id;
          global.RESOLUME_DATA.videoId = videoId;
          ws.send(
            JSON.stringify({
              action: "subscribe",
              parameter: "/parameter/by-id/" + id,
            })
          );
          ws.send(
            JSON.stringify({
              action: "subscribe",
              parameter: "/parameter/by-id/" + bid,
            })
          );
          ws.send(
            JSON.stringify({
              action: "subscribe",
              parameter: "/parameter/by-id/" + sid,
            })
          );
        }
        if (
          data != undefined &&
          data["layers"] != undefined &&
          data["layers"][0] != undefined &&
          data["layers"][0]["clips"][1] &&
          data["layers"][0]["clips"][1]["transport"]
        ) {
          let id2 =
            data["layers"][0]["clips"][1]["transport"]["position"]["id"];
          let sid2 = data["layers"][0]["clips"][1]["selected"]["id"];
          let bid2 =
            data["layers"][0]["clips"][1]["transport"]["controls"][
              "playdirection"
            ]["id"];
          let videoId2 = data["layers"][0]["clips"][1]["id"];
          console.log("id2 sid2 bid2", id2, sid2, bid2);
          global.RESOLUME_DATA.bid2 = bid2;
          global.RESOLUME_DATA.id2 = id2;
          global.RESOLUME_DATA.videoId2 = videoId2;
          ws.send(
            JSON.stringify({
              action: "subscribe",
              parameter: "/parameter/by-id/" + id2,
            })
          );
          ws.send(
            JSON.stringify({
              action: "subscribe",
              parameter: "/parameter/by-id/" + sid2,
            })
          );
          ws.send(
            JSON.stringify({
              action: "subscribe",
              parameter: "/parameter/by-id/" + bid2,
            })
          );
        }
        isDOne = true;
      } else {
        data = JSON.parse(data);
        //  console.log(data.path);
        if (data.path && data.path.endsWith("select")) {
          let arr = data.path.split("/");
          // console.log(arr[5]);
          if (data.value) {
            console.log("arr[5] setting here :>> ", arr[5]);
            global.RESOLUME_DATA.index = arr[5];
          }
        } else if (data.path && data.path.endsWith("playdirection")) {
          if ((global.RESOLUME_DATA.index = data.path.split("/")[5])) {
            global.RESOLUME_DATA.status = data.value == "||" ? "halt" : "run";
          }
        } else if (data.path && data.path.endsWith("position")) {
          // console.log('global.RESOLUME_DATA :>> ', global.RESOLUME_DATA.index);
          if ((global.RESOLUME_DATA.index = data.path.split("/")[5])) {
            global.RESOLUME_DATA.current_duration = parseInt(data.value);
            global.RESOLUME_DATA.duration = data.max;
          }
        }
      }
      // console.log('RESOLUME_DATA :>> ', RESOLUME_DATA);
    } catch (err) {
      console.log("e", err);
    }
  });
  ws.on("error", (err) => {
    console.log("error: %s", err);
  });
}
global.RESOLUME_DATA = RESOLUME_DATA;

electronLog = {
  electronLogInConsole: function (dataToShow) {
    try {
      mainWindow.webContents.send(
        "webContents2Renderer",
        `electronLogInConsole ${JSON.stringify(dataToShow)}`
      );
    } catch (e) {
      sendToCloudFunction(
        `error from registration 596 :>>  ${JSON.stringify(e)}`
      );
      console.log("error in starting 609", e);
    }
  },
};
setTimeout(() => {
  const socket = io(global.APP_DATA.SOCKET_CONNECTION_URL); // Adjust the server address as needed
  socket.on("connect", () => {
    console.log(
      "Successfully connected to the Socket.io server+++++++++++++++++++++++++++++++++++++++++"
    );
  });
  socket.on("open-url", (url) => {
    if (global.APP_DATA.DISPLAY_SCREEN === "WIDGET_BAR") {
      createNewWindow(url);
    } // This will now open the URL in a new window
  });
  socket.on("close-window", () => {
    if (global.APP_DATA.DISPLAY_SCREEN === "WIDGET_BAR") {
      newWindows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.close();
        }
      });
      // Clear the array after closing the windows
      newWindows = [];
    }
  });
}, 2000);

let newWindows = []; // Array to keep track of new windows

function createNewWindow(url) {
  let newWindow = new BrowserWindow({
    fullscreen: true, // Open the new window in full screen
    width: 5760, // Set the window width to 500
    height: 1080, // Set the window height to 500
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  newWindow.loadURL(url);
  newWindows.push(newWindow);
  newWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      newWindow.webContents.executeJavaScript(`
      // Locate the element using XPath
      const xpath = '//*[@id="yDmH0d"]/c-wiz/div/div/div[24]/div[3]/div/div[2]/div[4]/div/div/div[2]/div[1]/div[2]/div[1]/div[1]/button';
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      // Check if the element exists before trying to click it
      if (element) {
        // Trigger a click event on the element
        element.click();
      } else {
        console.error('Element not found');
      }
    `);
    }, 5000); // 5000 milliseconds = 5 seconds
  });
  newWindow.on("closed", () => {
    newWindows = newWindows.filter((win) => win !== newWindow);
  });
}
ipcMain.on("open-url", (event, url) => {
  if (global.APP_DATA.DISPLAY_SCREEN === "WIDGET_BAR") {
    createNewWindow(url); // This will now open the URL in a new window
  }
});

exports.electronLog = electronLog;
