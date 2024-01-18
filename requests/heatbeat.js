const axios = require("axios");
const https = require("https");
const sendToCloudFunction = require("./../src/messages");

//// SEND HEARTBEAT ////
function sendHeartbeat(commandLogId, commandStatus, commandMessage) {
  console.log(
    `Data to send in heartbeat from requests/heartbeat: ${commandLogId}, ${commandStatus}, ${commandMessage}`
  );
  if (APP_DATA.enable_heartbeat) {
    console.log("Heartbeat is enabled so sending heartbeat");
    try {
      sendToCloudFunction(
        `Data to send in heartbeat from requests/heartbeat: ${commandLogId}, ${commandStatus}, ${commandMessage}`
      );
      axios
        .post(
          APP_DATA.api_root_protocol +
            "://" +
            APP_DATA.api_root +
            "" +
            APP_DATA.heartbeat_api_endpoint,
          {
            disc_space_usage: APP_DATA.system_vitals.disk_usage,
            cpu_usage: APP_DATA.system_vitals.cpu_usage,
            ram_usage: APP_DATA.system_vitals.ram_usage,
            temparature: APP_DATA.system_vitals.temprature,
            uptime: APP_DATA.system_vitals.uptime,
            version: APP_DATA.app_version,
            command_log_id: commandLogId ? commandLogId : null,
            command_status: commandStatus ? commandStatus : null,
            command_message: commandMessage ? commandMessage : null,
          },
          {
            headers: {
              Authorization: `Token ${APP_DATA.auth_token}`,
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          }
        )
        .then(function (response) {
          // console.log(response);
          APP_DATA.heartbeat_response = response.data;
          console.log(`HEARTBEAT RESPONSE ${JSON.stringify(response.data)}`);
          console.log(`HEARTBEAT RESPONSE MESSAGE ${response.data?.message}`);
          global.mainWindow.webContents.send("webContents2Renderer", {
            type: "DATA",
            data: response.data,
          });
        })
        .catch(function (error) {
          sendToCloudFunction(`error Heartbeat 52 ${JSON.stringify(error)}`);
          APP_DATA.heartbeat_response = error;
          console.log(error.response.status);
          global.mainWindow.webContents.send("webContents2Renderer", {
            action: "EROR",
            data: error,
          });
        });
    } catch (e) {
      sendToCloudFunction(
        `Main Error While sending Heartbeat ${JSON.stringify(e)}`
      );
      console.log("Main Error While sending Heartbeat" + e);
    }
  }
}

exports.sendHeartbeat = sendHeartbeat;
