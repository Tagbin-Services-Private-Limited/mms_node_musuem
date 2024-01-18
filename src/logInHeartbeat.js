const heartbeat = require("../requests/heatbeat");
const sendLogViaHeartBeat = async (commandLogId, logMessage, logType) => {
  try {
    commandLogId
      ? heartbeat.sendHeartbeat(commandLogId, logType, logMessage)
      : null;
  } catch (error) {
    console.log("Error while sending log via heartbeat", error.message);
  }
};

module.exports = sendLogViaHeartBeat;
