const net = require("net");
const heartbeat = require("./../requests/heatbeat");
const tcp = require("./tcp");

function sendToRenderer(message) {
  global.mainWindow.webContents.send("webContents2Renderer", message);
}

function sendTimestampResponse(stringToSend, ip, port) {
  if (global.APP_DATA.watchout) {
    tcp.TCPHandler.sendMessageOnce(stringToSend, ip, port);
  }
}

function createBroadcastCommandString(infoObj) {
  let stringToSend = infoObj.videoStatus
    ? infoObj.videoStatus
    : global.RESOLUME_DATA.status;
  tcp.TCPHandler.sendMessage(stringToSend);
  return;
}

function extractTimestamp(inputString) {
  const words = inputString.split(" ");
  if (words.length === 12) {
    return [words[7], words[8]];
  } else if (words.length === 13) {
    return [words[8], words[9]];
  } else {
    return [null, "true"];
  }
}
WOHandler = {
  server: null,
  sockets: [],

  startWoConnect: function (command, commandLogId, ip, port) {
    console.log(
      "command, commandLogId, ip, port :>> ",
      command,
      commandLogId,
      ip,
      port
    );
    var client = new net.Socket();
    client.connect(APP_DATA.wo_dis_tcp_port, "192.168.10.99", function () {
      commandLogId
        ? heartbeat.sendHeartbeat(
            commandLogId,
            "SUCCESS",
            `${command} : Command recived for Watchout Display:`
          )
        : null;

      console.log("Client Connected for Watchout ");
      sendToRenderer("command recieved in watchout " + command);
      if (command.includes("timestamp")) {
        let command = "authenticate 1 \r getStatus \r ";
        console.log("command :>> ", command);
        let responseData = "";

        client.write(command);
        let counter = 0;
        sendToRenderer("counter outside 63 counter " + counter);

        client.on("data", function (data) {
          responseData += data.toString();
          sendToRenderer(`printing line 67 counter ${counter}`);
          sendToRenderer(`printing line 68 responseData ${responseData}`);
          // if (counter == 1) {
          sendToRenderer(`printing line 70 counter ${counter}`);
          let lines = responseData.split("\n");
          console.log(counter, "responseData :>> ", lines[1]);
          sendToRenderer(`printing line 73 ${lines.length}, ${lines}`);
          var statusArr = extractTimestamp(lines[1]);
          sendToRenderer(`printing line 75 status arr ${statusArr}`);
          timestamp = statusArr[0];
          timestamp = timestamp / 1000;
          videoPlaying = statusArr[1];
          videoPlaying === "true"
            ? (videoStatus = "run")
            : (videoStatus = "halt");

          responseMessage = "0 " + timestamp.toString() + " " + videoStatus;
          sendToRenderer("timestamp response" + responseMessage);
          console.log("responseMessage :>> ", responseMessage);
          sendTimestampResponse(responseMessage, ip, port);
          client.destroy();
          counter = counter + 1;
        });
      }
      switch (command) {
        case "load":
          createBroadcastCommandString({
            videoStatus: "load",
          });
          client.write("authenticate 1" + "\r " + "load test" + "\r ");
          break;

        case "run":
          createBroadcastCommandString({
            videoStatus: "run",
          });
          client.write("authenticate 1" + "\r " + "run" + "\r ");
          break;

        case "halt":
          createBroadcastCommandString({
            videoStatus: "halt",
          });
          client.write("authenticate 1" + "\r " + "halt" + "\r ");
          break;

        case "reset":
          createBroadcastCommandString({
            videoStatus: "reset",
          });
          client.write("authenticate 1" + "\r " + "reset" + "\r ");
          break;

        case "restart":
          createBroadcastCommandString({
            videoStatus: "restart",
          });
          client.write(
            "authenticate 1" + "\r " + "reset" + "\r " + "run" + "\r "
          );
          break;

        // case "timestamp":
        //   let command = "authenticate 1 \r getStatus \r ";
        //   console.log("command :>> ", command);
        //   let responseData = "";

        //   client.write(command);
        //   let counter = 0;
        //   sendToRenderer("counter outside 104 counter " + counter);

        //   client.on("data", function (data) {
        //     responseData += data.toString();
        //     sendToRenderer(`printing line 108 counter ${counter}`);
        //     sendToRenderer(`printing line 109 responseData ${responseData}`);
        //     // if (counter == 1) {
        //     sendToRenderer(`printing line 111 counter ${counter}`);
        //     let lines = responseData.split("\n");
        //     console.log(counter, "responseData :>> ", lines[1]);
        //     sendToRenderer(`printing line 114 ${lines.length}, ${lines[1]}`);
        //     var statusArr = extractTimestamp(lines[1]);
        //     sendToRenderer(`printing line 116 status arr ${statusArr}`);
        //     timestamp = statusArr[0];
        //     timestamp = timestamp / 1000;
        //     videoPlaying = statusArr[1];
        //     videoPlaying === "true"
        //       ? (videoStatus = "run")
        //       : (videoStatus = "halt");

        //     responseMessage = "0 " + timestamp.toString() + " " + videoStatus;
        //     sendToRenderer("timestamp response" + responseMessage);
        //     console.log("responseMessage :>> ", responseMessage);
        //     sendTimestampResponse(responseMessage, ip, port);
        //     client.destroy();
        //     // }
        //     counter = counter + 1;
        //   });
        //   break;

        default:
          client.write("authenticate 1" + "\r " + "run" + "\r ");
          break;
      }
    });

    client.on("close", function () {
      console.log("Watchout Display Connection closed");
    });
  },
};

exports.WOHandler = WOHandler;
