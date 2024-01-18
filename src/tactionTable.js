const net = require("net");
const HOST = global.APP_DATA.taction_table_host;
const PORT = global.APP_DATA.taction_table_port;
const { ipcMain } = require("electron");

function startServer() {
  try {
    const server = net.createServer((socket) => {
      console.log(`Connected by ${socket.remoteAddress}:${socket.remotePort}`);
      socket.on("data", (data) => {
        let receivedData = data;
        console.log('receivedData :>> ', receivedData);
        let finalData = {};
        if (receivedData && receivedData.length > 0) {
          console.log('finalData :>> ', finalData);
          finalData = JSON.parse(receivedData);
        }
        // console.log(`Received data: `, finalData);
        ipcMain.emit("socket-data", finalData);
      });

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
    console.log("err :>> ", err);
  }
}

module.exports = startServer;
