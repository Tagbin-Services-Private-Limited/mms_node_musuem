const net = require("net");
const { exec } = require("child_process");
const path = require("path");
const comHandler = require("./communicator");
const heartbeat = require("../requests/heatbeat");
const mac_interface = require("getmac");
const fs = require("fs");
const util = require("util");

const { video_commands } = require("./communicator");
const sendToCloudFunction = require("./messages");
const nodeCrypto2 = require("crypto-browserify");
const execAsync = util.promisify(exec);

global.SockList = [];
// Creating a function to decrypt string
let appPath = path.join(process.cwd());
console.log("appPath :>> ", appPath);
// async function decryptString(ciphertext, privateKeyFile) {
//   try {
//     // let fileName = "C:Users\\tagbi\\Desktop\\TAGBIN_CODE\\decrypt.js";
//     //  let fileName = appPath.replace("mms_node", "decrypt.js");
//     let fileName = "C:\\Users\\tagbi\\Desktop\\TAGBIN_CODE\\decrypt.js";
//     const encryptedBufferJson = JSON.stringify(ciphertext)
//       .replace(/'/g, "\\'")
//       .replace(/"/g, '\\"');

//     // console.log('ciphertext :>> ', JSON.stringify(ciphertext));
//     const commandToDecrypt = `node ${fileName} ${encryptedBufferJson}`;
//     let commandFromMMS = "";
//     // console.log(
//     //   "commandToDecrypt :=================================================>> ",
//     //   commandToDecrypt
//     // );
//     // Execute the commandToDecrypt
//     exec(commandToDecrypt, (error, stdout, stderr) => {

//       console.log("error, stdout, stderr :>> ", error, stdout, stderr);
//       if (error) {
//         console.error(`Error: ${error.message}`);
//         return;
//       }
//       if (stderr) {
//         console.error(`stderr: ${stderr}`);
//         return;
//       }
//       commandFromMMS = stdout;
//       console.log(`Decrypted Data: --------------${stdout}`);
//       sendToCloudFunction(
//         "RECIEVED THIS COMMAND VIA TCP:DECRYOTED",
//         commandFromMMS
//       );
//       return commandFromMMS;
//     });
//     // sendToCloudFunction(ciphertext);
//     // sendToCloudFunction(`privatekey ${privateKeyFile}`);
//     // const privateKey = fs.readFileSync(privateKeyFile, "utf8");

//     // // privateDecrypt() method with its parameters
//     // const decrypted = nodeCrypto2.privateDecrypt(
//     //   {
//     //     key: privateKey,
//     //     passphrase: "Trilok Panwar TriP " + mac_interface.default(),
//     //   },
//     //   Buffer.from(ciphertext, "base64")
//     // );

//     // return decrypted.toString("utf8");
//   } catch (error) {
//     sendToCloudFunction(
//       `error in decrypting string   line 27:>>${JSON.stringify(error)}}`
//     );
//     console.log("error in decrypting string   1 :>> ", error);
//   }
// }
async function decryptString(ciphertext, privateKeyFile) {
  try {
    let fileName = "C:\\Users\\tagbi\\Desktop\\TAGBIN_CODE\\decrypt.js";
    const encryptedBufferJson = JSON.stringify(ciphertext)
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');

    const commandToDecrypt = `node ${fileName} ${encryptedBufferJson}`;

    const { stdout, stderr } = await execAsync(commandToDecrypt);

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      throw new Error(stderr);
    }

    console.log(`Decrypted Data: ${stdout}`);
    sendToCloudFunction("RECIEVED THIS COMMAND VIA TCP:DECRYPTED", stdout);
    return stdout;
  } catch (error) {
    sendToCloudFunction(`error in decrypting string: ${JSON.stringify(error)}`);
    console.error("Error in decrypting string:", error);
    throw error;
  }
}

// Creating a function to encrypt string
function encryptString(plaintext, publicKeyFile) {
  const publicKey = fs.readFileSync(publicKeyFile, "utf8");

  console.log(fs.readFileSync(publicKeyFile));

  // console.log(plaintext, publicKey);

  // publicEncrypt() method with its parameters
  const encrypted = nodeCrypto2.publicEncrypt(
    publicKey,
    Buffer.from(plaintext)
  );

  return encrypted.toString("base64");
}

let TCPHandler = {
  server: null,
  enserver: null,
  sockets: [],
  ensockets: [],
  startTCPServer: function (host, port) {
    console.log("###########3tcp connection initiated port", port);
    sendToCloudFunction("###########3tcp connection initiated port," + port);

    try {
      TCPHandler.server = net.createServer();
      TCPHandler.server.listen(port, host, () => {
        console.log(
          "startTCPServer: TCP Server is listening on " +
            host +
            ":" +
            port +
            "."
        );
      });
    } catch (e) {
      sendToCloudFunction(`error line 83 ${JSON.stringify(e)}`);
      console.log("startTCPServer onCreateServer: AN ERROR HAS OCCURED!");
      console.log("startTCPServer onCreateServer:" + e);
    }
    try {
      TCPHandler.server.on("connection", function (sock) {
        const countOccurrences = (arr, val) =>
          arr.reduce(
            (a, v) => (v.remoteAddress === val.remoteAddress ? a + 1 : a),
            0
          );
        let occ = countOccurrences(TCPHandler.sockets, sock);
        console.log("occ----", occ);
        if (occ < 5) {
          TCPHandler.sockets.push(sock);
        } else {
          let index = TCPHandler.sockets.findIndex(function (o) {
            return o.remoteAddress === sock.remoteAddress;
          });
          let ckt = TCPHandler.sockets[index];
          ckt.end();
          TCPHandler.sockets.push(sock);
          try {
            if (index !== -1) TCPHandler.sockets.splice(index, 1);
            heartbeat.sendHeartbeat(
              123456,
              "ERRORED",
              "Rejected TCP connection because it exceeded max limit"
            );
          } catch (e) {
            console.log("error is ", err);
          }
        }
        sock.on("data", async function (data) {
          console.log("data 1477777777777:>> ", data);
          let APP_DATA = global.APP_DATA;
          sendToCloudFunction(`data line 117 ${JSON.stringify(data)} ${port}`);
          console.log("data :>> ", data, port);
          // console.log("APP_DATA :>> ", APP_DATA);
          // console.log(
          //   "startTCPServer: DATA " + sock.remoteAddress + ": " + data
          // );
          try {
            if (port == 2626) {
              const dataArr = data.toString().split(" ");
              console.log("dataArr :>> ", dataArr);
              sendToCloudFunction(`data line 128 ${JSON.stringify(dataArr)}`);
              const command = dataArr[0];
              if (global.APP_DATA.shutdown_2626 == false) {
                if (command == "timestamp") {
                  const commandLogId = sock.remotePort;
                  const commandFiles = sock.remoteAddress;
                  comHandler.sendToApp(
                    command,
                    commandLogId,
                    commandFiles,
                    "TCP"
                  );
                  // } else if (video_commands.includes(command)) {
                } else {
                  const commandLogId = dataArr[1];
                  const commandFiles = dataArr[2];
                  sendToCloudFunction(
                    `data line 144 ${command}, ${commandLogId}, ${commandFiles}`
                  );
                  comHandler.sendToApp(
                    command,
                    commandLogId,
                    commandFiles,
                    "TCP"
                  );
                }
              } else {
                if (command == "timestamp") {
                  const commandLogId = sock.remotePort;
                  const commandFiles = sock.remoteAddress;
                  console.log(
                    "command:" +
                      command +
                      ", commandLogId:" +
                      (commandLogId ? commandLogId : "") +
                      ", commandFiles:" +
                      (commandFiles ? commandFiles : "")
                  );
                  // Send data to communcator for parsing & execution
                  comHandler.sendToApp(
                    command,
                    commandLogId,
                    commandFiles,
                    "TCP"
                  );
                } else {
                  tcp.TCPHandler.sendMessageOnce(
                    "\rSorry, I have a boyfriend\r",
                    sock.remoteAddress,
                    sock.remotePort
                  );
                }
              }
            } else if (port == 2627) {
              sendToCloudFunction(`data line 182 `);
              // const encrypted TO BE DELETED added just for testing
              // const encrypted = encryptString("halt 15", "./public_key");
              // console.log("start=>" + encrypted + "<===end");
              const decrypted = await decryptString(data, "./private_key");
              console.log("decrypted :>> ", decrypted);
              // const dataArr = decrypted.toString().split(" ");
              let dataArr = decrypted.split(" ");
              const command = dataArr[0];
              if (command == "timestamp") {
                const commandLogId = sock.remotePort;
                const commandFiles = sock.remoteAddress;
                comHandler.sendToApp(
                  command,
                  commandLogId,
                  commandFiles,
                  "TCP"
                );
              } else {
                const commandLogId = dataArr[1];
                const commandFiles = dataArr[2];
                sendToCloudFunction(
                  `data line 203 ${command}, ${commandLogId}, ${commandFiles}`
                );
                comHandler.sendToApp(
                  command,
                  commandLogId,
                  commandFiles,
                  "TCP"
                );
              }
            } else {
              console.log("Someone trying to connect on unopened port: ", port);
            }
          } catch (e) {
            sendToCloudFunction(`exception 217 ${JSON.stringify(e)} ${e}`);
            console.log("Exception" + e);
            let index = TCPHandler.sockets.findIndex(function (o) {
              return (
                o.remoteAddress === sock.remoteAddress &&
                o.remotePort === sock.remotePort
              );
            });
            if (index !== -1) TCPHandler.sockets.splice(index, 1);
            console.log(
              "startTCPServer: CLOSEDD removing socket from scoket array: " +
                sock.remoteAddress +
                " " +
                sock.remotePort
            );
          }
        });

        TCPHandler.server.once("error", function (err) {
          sendToCloudFunction(`data line 238 ${JSON.stringify(err)}`);
          console.log("errrrr is", err);
          if (err.code === "EADDRINUSE") {
            console.log(
              "startTCPServer:  port is currently in use - EADDRINUSE"
            );
          }
        });

        // Add a 'close' event handler to this instance of socket
        sock.on("close", function (data) {
          console.log("data in tcp close:>> ", data);
          let index = TCPHandler.sockets.findIndex(function (o) {
            return (
              o.remoteAddress === sock.remoteAddress &&
              o.remotePort === sock.remotePort
            );
          });
          if (index !== -1) TCPHandler.sockets.splice(index, 1);
          console.log(
            "startTCPServer: CLOSEED removing socket from scoket array: " +
              sock.remoteAddress +
              " " +
              sock.remotePort
          );
        });
      });
    } catch (e) {
      sendToCloudFunction(`data line 264 ${JSON.stringify(e)}`);
      console.log(
        "startTCPServer onConnection listener: AN ERROR HAS OCCURED!"
      );
      console.log("startTCPServer onConnection listener:" + e);
    }
    sendToCloudFunction(`data line tcp.js 328 successfully connected tcp`);
  },
  closeTCPServer: function () {
    try {
      sendToCloudFunction(`data line 273 `);
      TCPHandler.server.close();
      console.log("closeTCPServer TCP Server Closed");
    } catch (e) {
      sendToCloudFunction(`data line 335 ${JSON.stringify(e)}`);
      console.log("closeTCPServer " + e);
    }
  },
  sendMessage: function (message) {
    try {
      TCPHandler.sockets.forEach(function (sock, index, array) {
        try {
          console.log(
            "Sending to " +
              sock.remoteAddress +
              ":" +
              sock.remotePort +
              " said " +
              message +
              "\n"
          );
          sock.write(message);
        } catch (e) {
          console.log(
            "tcp sendMessage: While sending reply to the client " + e
          );
          //  If the client dropped the socket connection non--gracefully, remove the scoket from the socket array
          let index = TCPHandler.sockets.findIndex(function (o) {
            return (
              o.remoteAddress === sock.remoteAddress &&
              o.remotePort === sock.remotePort
            );
          });
          if (index !== -1) TCPHandler.sockets.splice(index, 1);
          console.log(
            "sendMessage: Forefully Closing for : " +
              sock.remoteAddress +
              " " +
              sock.remotePort
          );
        }
      });
    } catch (e) {
      sendToCloudFunction(`data line 374 ${JSON.stringify(e)}`);
      console.log("e in send message:>> ", e);
    }
  },
  sendMessageOnce: function (message, ip, port) {
    let sock = TCPHandler.sockets.find(
      (sock, index) => sock.remoteAddress == ip && sock.remotePort == port
    );
    console.log("sending message to the sofket", sock);
    if (sock != undefined) {
      try {
        console.log(
          "Sending to " +
            sock.remoteAddress +
            ":" +
            sock.remotePort +
            " said " +
            message +
            "\n"
        );
        sock.write(message);
      } catch (e) {
        console.log("tcp sendMessage: While sending reply to the client " + e);
        //  If the client dropped the socket connection non--gracefully, remove the scoket from the socket array
        let index = TCPHandler.sockets.findIndex(function (o) {
          return (
            o.remoteAddress === sock.remoteAddress &&
            o.remotePort === sock.remotePort
          );
        });
        if (index !== -1) TCPHandler.sockets.splice(index, 1);
        console.log(
          "sendMessage: Forefully Closing for : " +
            sock.remoteAddress +
            " " +
            sock.remotePort
        );
      }
    }
  },
};

exports.TCPHandler = TCPHandler;
