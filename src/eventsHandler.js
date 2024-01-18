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

// File imports
const tcp = require("./tcp");
const udp = require("./udp");
const vitals = require("./hardare_interface");
const heartbeat = require("../requests/heatbeat");
var pjson = require("./package.json");
const auto_update = require("../functions/auto_update");
