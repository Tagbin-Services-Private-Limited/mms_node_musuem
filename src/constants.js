const { app } = require("electron");
const ip = require("ip");
const mac_interface = require("getmac");
const os = require("os");
const user_info = os.userInfo();
const loudness = require("loudness");
const path = require("path");
const fs = require("fs");
const {
  setData,
  findImageData,
  findAudioData,
  findTokenData,
  insertToken,
  dbFilename,
  addOrUpdateConfigData,
  findConfigData,
} = require("./appDatabase");
let current_video_number = 0;
let current_video_name = "";
let current_timestamp = 0;
let current_video_status = "";
let current_volume = 0;
let totalVideos = 0;
let vduration = 0;
let video_list = [];
let APP_DATA = {
  app_version: "0.0",
  api_root_protocol: "http",
  api_root: "127.0.0.1:8000",
  content_dir: ".",
  heartbeat_api_endpoint: "/heartbeat/",
  registration_api_endpoint: "/node_register/",
  video_uri: "/static/exhibits/01.mp4",
  video_name: "/01.mp4",
  content_uri: "/media/content/",
  software_uri: "/media/software/",
  enable_heartbeat: false,
  enable_registration: true,
  tcp_port: 2626,
  tcp_port_encrypt: 2627,
  udp_port: 2625,
  isCustomerFeedbackApp: false,
  watchout: false,
  isResolume: false,
  is_taction_table: false,
  taction_table_host: "192.168.10.52",
  taction_table_port: 65431,
  is_taction_table_wall: false,
  taction_table_wall_host: "192.168.10.60",
  taction_table_wall_port: 65432,
  resolumeAdd: "http://192.168.0.190:8080",
  shutdown_2626: false,
  wo_dis_tcp_port: 3039,
  wo_pro_tcp_port: 3040,
  system_ip: "X.X.X.X",
  mac_address: "00:00:00:00:00:00",
  heartbeat_response: null,
  auth_token: "XXXX",
  system_vitals: {
    cpu_usage: 0,
    ram_usage: 0,
    disk_usage: 0,
    ip: "X.X.X.X",
    temprature: 0,
    uptime: 0,
  },
  log_over_tcp: false,
  home_dir: user_info.homedir,
  current_volume,
};
global.APP_DATA = APP_DATA;

// Initialise IP address
const setIpAddress = async () => {
  try {
    global.APP_DATA.content_dir = app.getPath("videos");
    let systemIp = await ip.address();
    // let ip = "127.0.0.1"
    global.APP_DATA.system_vitals.ip = systemIp;
    global.APP_DATA.system_ip = systemIp;
    // ip.address();
    console.log("IP Assigned: " + global.APP_DATA.system_ip, ip.address());
  } catch (e) {
    console.log("Error: IP Address Not found" + e);
  }
};

// Initialise MAC address
const setMacAddress = async () => {
  try {
    // function getMacAddress() {
    //   const interfaces = networkInterfaces();
    //   // Choose the network interface you're interested in
    //   const interfaceName = "your-interface-name"; // e.g., 'Ethernet' or 'Wi-Fi'

    //   if (interfaces[interfaceName]) {
    //     const interfaceInfo = interfaces[interfaceName].find(
    //       (info) => !info.internal
    //     );
    //     if (interfaceInfo) {
    //       return interfaceInfo.mac;
    //     }
    //   }

    //   return null; // MAC address not found
    // }

    global.APP_DATA.mac_address = mac_interface.default();
    console.log("Mac address:=-=-=-=-= " + mac_interface.default());
  } catch (error) {
    console.log("Error: MAC Not found" + error);
  }
};

const setVolumne = async () => {
  try {
    let vol = await loudness.getVolume();
    current_volume = vol;
    global.APP_DATA.current_volume = vol;
    console.log("vol :>> ", vol);
  } catch (error) {
    console.log("Error in setting volumne" + error);
  }
};

const setPastConfigsOnLoad = async () => {
  let fetchedData = await findConfigData();
  console.log("setPastConfigsOnLoad called :>> ", fetchedData);
  if (
    fetchedData &&
    fetchedData.success &&
    fetchedData.data &&
    fetchedData.data.length > 0
  ) {
    global.APP_DATA.shutdown_2626 = fetchedData.data[0].shutdown_2626;
  }
};

// for reading configs from settings.json and set in global variables
const setBackendConfigs = async () => {
  try {
    const desktopPath = app.getPath("desktop");
    const settingsFilePath = path.join(desktopPath, "settings.json");
    if (fs.existsSync(settingsFilePath)) {
      return new Promise((resolve, reject) => {
        fs.readFile(settingsFilePath, "utf-8", (readErr, data) => {
          if (readErr) {
            resolve("Error in reading settings json");
          } else {
            data = JSON.parse(data);
            global.APP_DATA.SOCKET_CONNECTION_URL = data.SOCKET_CONNECTION_URL;
            global.APP_DATA.BACKEND_CONNECTION_URL =
              data.BACKEND_CONNECTION_URL;
            global.APP_DATA.DISPLAY_SCREEN = data.DISPLAY_SCREEN;
            resolve(true);
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
};

process.env.ENVIRONMENT = "DEBUG";
mainWindow = null;

module.exports = {
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
  setPastConfigsOnLoad,
  setBackendConfigs,
};
