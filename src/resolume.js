const axios = require("axios");
const tcp = require("./tcp");

const executeWSResolumeCommand = (action, parameter, value) => {
  let commandObj = {};
  if (action != undefined) {
    commandObj.action = action;
  }
  if (parameter != undefined) {
    commandObj.parameter = parameter;
  }
  if (value != undefined) {
    commandObj.value = value;
  }
  let commandString = JSON.stringify(commandObj);
  console.log("commandString :>> ", commandString);
  global.websocket.send(commandString);
  return;
};

async function executeHTTPResolumeCommand(apiType, url, data) {
  if (!data) {
    data = "";
  }
  let config = {
    method: apiType,
    maxBodyLength: Infinity,
    url: `${global.APP_DATA.resolumeAdd}${url}`,
    headers: {},
    data: data,
  };
  try {
    const response = await axios.request(config);
  } catch (error) {
    console.log(error);
  }
}

function createTimestampCommandString(infoObj) {
  // let video_index = infoObj.videoIndex != undefined
  //   ? infoObj.videoIndex
  //   : global.RESOLUME_DATA.index - 1 ;
  // let video_status = infoObj.videoStatus
  //   ? infoObj.videoStatus
  //   : global.RESOLUME_DATA.status;
  // let video_duration = infoObj.videoDuration
  //   ? infoObj.videoDuration
  //   : global.RESOLUME_DATA.current_duration;
  // let stringToSend =
  //   video_index + " " + video_status + " " + video_duration;
  let stringToSend = infoObj.videoStatus
    ? infoObj.videoStatus
    : global.RESOLUME_DATA.status;
  tcp.TCPHandler.sendMessage(stringToSend);
  return;
}
function mapVolumeValue(value) {
  let oldMin = 0;
  let oldMax = 100;
  let newMin = -192;
  let newMax = 0;
  const percentage = (value - oldMin) / (oldMax - oldMin);
  const newValue = percentage * (newMax - newMin) + newMin;
  return newValue;
}

let resolumeHandler = {
  applyResolumeCommand: function (command, commandLogId, commandFiles) {
    try {
      switch (command) {
        case "load":
          if (global.websocket) {
            executeWSResolumeCommand(
              "set",
              `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
              "||"
            );
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.bid2}`,
                "||"
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id2}`,
                0
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id}`,
                0
              );
              setTimeout(() => {
                executeHTTPResolumeCommand(
                  "post",
                  `/api/v1/composition/clips/by-id/${global.RESOLUME_DATA.videoId}/connect`
                );
              }, 500);
            }, 500);
            setTimeout(() => {
              global.RESOLUME_DATA.index = "1";
            }, 500);
            createTimestampCommandString({
              videoStatus: "run",
            });
          }
          break;

        case "run":
          console.log("global.websocket :>> ");
          if (global.websocket) {
            let iid =
              global.RESOLUME_DATA.index == 1
                ? global.RESOLUME_DATA.bid
                : global.RESOLUME_DATA.bid2;
            createTimestampCommandString({
              videoStatus: "run",
            });
            executeWSResolumeCommand("set", `/parameter/by-id/${iid}`, ">");
          }
          break;

        case "halt":
          if (global.websocket) {
            let iid =
              global.RESOLUME_DATA.index == 1
                ? global.RESOLUME_DATA.bid
                : global.RESOLUME_DATA.bid2;
            createTimestampCommandString({
              videoStatus: "halt",
            });
            executeWSResolumeCommand("set", `/parameter/by-id/${iid}`, "||");
          }
          break;

        case "reset":
          if (global.websocket) {
            executeWSResolumeCommand(
              "set",
              `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
              "||"
            );
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.bid2}`,
                "||"
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id2}`,
                0
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id}`,
                0
              );
              setTimeout(() => {
                executeHTTPResolumeCommand(
                  "post",
                  `/api/v1/composition/clips/by-id/${global.RESOLUME_DATA.videoId}/connect`
                );
              }, 500);
            }, 500);
            setTimeout(() => {
              global.RESOLUME_DATA.index = "1";
            }, 500);
            createTimestampCommandString({
              videoStatus: "reset",
              videoIndex: 0,
            });
          }
          break;

        case "nextVideo":
          if (global.websocket) {
            if (global.RESOLUME_DATA.index == 1) {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
                "||"
              );
              setTimeout(() => {
                executeWSResolumeCommand(
                  "set",
                  `/parameter/by-id/${global.RESOLUME_DATA.bid2}`,
                  "||"
                );
              }, 500);
              setTimeout(() => {
                executeWSResolumeCommand(
                  "set",
                  `/parameter/by-id/${global.RESOLUME_DATA.id2}`,
                  0
                );
              }, 500);
              setTimeout(() => {
                executeWSResolumeCommand(
                  "set",
                  `/parameter/by-id/${global.RESOLUME_DATA.id}`,
                  0
                );
              }, 500);
              setTimeout(() => {
                executeHTTPResolumeCommand(
                  "post",
                  `/api/v1/composition/clips/by-id/${global.RESOLUME_DATA.videoId2}/connect`
                );
                setTimeout(() => {
                  executeWSResolumeCommand(
                    "set",
                    `/parameter/by-id/${global.RESOLUME_DATA.bid2}`,
                    ">"
                  );
                });
              }, 500);
              setTimeout(() => {
                global.RESOLUME_DATA.index = "2";
              }, 500);
            }
            createTimestampCommandString({
              videoStatus: "nextVideo",
              videoIndex: 1,
            });
          }
          break;

        case "previousVideo":
          if (global.RESOLUME_DATA.index == 2) {
            executeWSResolumeCommand(
              "set",
              `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
              "||"
            );
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.bid2}`,
                "||"
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id2}`,
                0
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id}`,
                0
              );
            }, 500);
            setTimeout(() => {
              executeHTTPResolumeCommand(
                "post",
                `/api/v1/composition/clips/by-id/${global.RESOLUME_DATA.videoId}/connect`
              );
              setTimeout(() => {
                executeWSResolumeCommand(
                  "set",
                  `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
                  ">"
                );
              });
            }, 500);
            setTimeout(() => {
              global.RESOLUME_DATA.index = "1";
            }, 500);
            createTimestampCommandString({
              videoStatus: "previousVideo",
              videoIndex: 0,
            });
          }
          break;

        case "restart":
          if (global.websocket) {
            setTimeout(() => {
              createTimestampCommandString({
                videoStatus: "restart",
              });
            }, 1000);
            executeWSResolumeCommand(
              "set",
              `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
              "||"
            );
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.bid2}`,
                "||"
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id2}`,
                0
              );
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.id}`,
                0
              );
              setTimeout(() => {
                executeHTTPResolumeCommand(
                  "post",
                  `/api/v1/composition/clips/by-id/${global.RESOLUME_DATA.videoId}/connect`
                );
              }, 500);
            }, 500);
            setTimeout(() => {
              executeWSResolumeCommand(
                "set",
                `/parameter/by-id/${global.RESOLUME_DATA.bid}`,
                ">"
              );
            });
            setTimeout(() => {
              global.RESOLUME_DATA.index = "1";
            }, 500);
          }
          break;

        case "gotoTime":
          if (global.websocket) {
            let iid =
              global.RESOLUME_DATA.index == 1
                ? global.RESOLUME_DATA.id
                : global.RESOLUME_DATA.id2;
            let time = parseInt(commandFiles);
            executeWSResolumeCommand("set", `/parameter/by-id/${iid}`, time);
            createTimestampCommandString({
              videoStatus: "run",
              videoDuration: time,
            });
          }
          break;

        case "VOLUME":
          if (global.websocket) {
            let inputVol = parseInt(commandFiles.replace("%", ""));
            inputVol = mapVolumeValue(inputVol);
            let audio = {
              volume: {
                id: global.RESOLUME_DATA.volumeId,
                valuetype: "ParamRange",
                min: -192,
                max: 0,
                value: inputVol,
              },
            };
            setTimeout(() => {
              executeHTTPResolumeCommand(
                "put",
                `/api/v1/composition/layers/1`,
                { audio }
              );
            }, 500);
          }
        case "abort":
          break;

        default:
          break;
      }
    } catch (e) {
      console.log(
        "startTCPServer onConnection listener: AN ERROR HAS OCCURED!",
        e
      );
      console.log("startTCPServer onConnection listener:" + e);
    }
  },
};

exports.resolumeHandler = resolumeHandler;
