const net = require("net");
const TABLE_HOST = global.APP_DATA.taction_table_host;
const TABLE_PORT = global.APP_DATA.taction_table_port;
const WALL_HOST = global.APP_DATA.taction_table_wall_host;
const WALL_PORT = global.APP_DATA.taction_table_wall_port;

function sendDataFromTableToWall(data) {
  try {
        const wallSocket = net.createConnection(WALL_PORT, WALL_HOST, () => {
          console.log('data,typeof data :>> ', data,typeof data);
          wallSocket.write(JSON.stringify(data));
          wallSocket.end();
        });
  } catch (err) {
    console.log("err :>> ", err);
  }
}

module.exports = sendDataFromTableToWall;
