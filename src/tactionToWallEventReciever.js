const net = require("net");
const HOST = global.APP_DATA.taction_table_wall_host;
const PORT = global.APP_DATA.taction_table_wall_port;
const { ipcMain } = require("electron");

function startTactionWallServer() {
  try {
    const server = net.createServer((socket) => {
      console.log(`Connected by ${socket.remoteAddress}:${socket.remotePort}`);
      try {
        socket.on("data", (data) => {
          let receivedData = data.toString();
          let finalData = {};
          if (receivedData && receivedData.length > 0) {
            finalData = JSON.parse(receivedData);
          }
          // console.log(`Received data when taction table event clicked: `, finalData);
          ipcMain.emit("event-received", finalData);
        });
      } catch (error) {
        console.log("data received is in incorrect format ", error);
      }
      socket.on("end", () => {
        console.log("Connection closed by client");
      });

      socket.on("error", (err) => {
        console.error(`Error: ${err.message}`);
      });
    });

    server.listen(PORT, HOST, () => {
      console.log(`Server listening on ${HOST}:${PORT}`);
    });

    server.on("error", (err) => {
      console.error(`Server error: ${err.message}`);
    });

    return server;
  } catch (err) {
    console.log("err startTactionWallServer:>> ", err);
  }
}

module.exports = startTactionWallServer;
