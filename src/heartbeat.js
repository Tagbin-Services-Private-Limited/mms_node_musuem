// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
var ip = require("ip");
const fs = require("fs");
const loudness = require("loudness");
const https = require("https");
const mac_interface = require("getmac");
const osInfo = require("@felipebutcher/node-os-info");
const axios = require("axios");
const { Console } = require("console");
const isDev = require("electron-is-dev");
const { join } = require("path");
var exec = require("child_process").exec;
// var Datastore = require("newdb");
const heartbeat = require("./../requests/heatbeat");
var pjson = require("./../package.json");
const auto_update = require("./../functions/auto_update");
let {
  APP_DATA,
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
} = require("./constants");
