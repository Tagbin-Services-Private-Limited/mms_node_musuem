const net = require("net");
const heartbeat = require("./../requests/heatbeat");

WOHandler = {
  server: null,
  sockets: [],

  startWoConnect: function (command, commandLogId) {
    console.log("command recieved inside watchout connect : ", command);
    var client = new net.Socket();
    client.connect(APP_DATA.wo_dis_tcp_port, "192.168.10.100", function () {
      commandLogId
        ? heartbeat.sendHeartbeat(
            commandLogId,
            "SUCCESS",
            `${command} : Command recived for Watchout Display:`
          )
        : null;

      console.log("Client Connected for Watchout ");

      switch (command) {
        case "load":
          client.write("authenticate 1" + "\r " + "load Show" + "\r ");
          break;

        case "run":
          client.write("authenticate 1" + "\r " + "run" + "\r ");
          break;

        case "halt":
          client.write("authenticate 1" + "\r " + "halt" + "\r ");
          break;

        case "reset":
          client.write("authenticate 1" + "\r " + "reset" + "\r ");
          break;

        case "restart":
          client.write(
            "authenticate 1" + "\r " + "reset" + "\r " + "run" + "\r "
          );
          break;

        default:
          client.write("authenticate 1" + "\r " + "run" + "\r ");
          break;
      }
    });

    client.on("data", function (data) {
      var WoStatus = data.toString().split(" ")[0];
      console.log("WO: Data Received :" + data);
      client.destroy(); // kill client after server's response

      if (WoStatus == "Ready") {
        commandLogId
          ? heartbeat.sendHeartbeat(
              commandLogId,
              "SUCCESS",
              `${command} : Command ran successfully for Watchout Display`
            )
          : null;
      }
    });

    client.on("close", function () {
      console.log("Watchout Display Connection closed");
    });
  },
};

exports.WOHandler = WOHandler;
