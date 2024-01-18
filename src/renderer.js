// In renderer process (web page).
const { exec } = require("child_process");
const { ipcRenderer, app } = require("electron");
const videojs = require("video.js");
const playlist = require("videojs-playlist");
console.log("===============================inside src");
ipcRenderer.invoke("getAppPath", "GETPATH").then((result) => {
  this.appPath = result;
});
var VIDEO_INFO = {
  video_files: ["/01.mp4"],
  current_video: 0,
};

var APP_DATA = {
  enable_artnet: false,
  artnet_ip: "192.168.1.56",
  artnet_channel: "103",
  enable_serial: false,
  enable_show_on_ui: false,
};

// ARTNET Related imports
let audio_width, audio_height;
var options = {
  host: APP_DATA.artnet_ip,
};

var artnet = require("artnet")(options);
var player;

function loadInit() {
  ipcRenderer.invoke("com_sync_image_path", "path").then((res) => {
    console.log(res);
    var timestamp = new Date().getTime();
    document.getElementById("no_audio").src = res + "?t=" + timestamp;
  });
  document.getElementById("my-player");

  player = videojs(
    "my-player",
    {
      autoplay: true,
      controls: false,
      plugins: {
        playlist: playlist,
      },
    },
    () => {
      player.on("ended", () => {
        updatePlayingIndex();
      });
    }
  );

  if (!player.controls()) {
    player.controlBar.el().className =
      player.controlBar.el().className + " vjs-controls-disabled";
  }

  //console.log(player);

  if (APP_DATA.enable_show_on_ui) {
    document.getElementById("my-player").style.display = "none";
    document.getElementById("show_on_ui").style.display = "block";
    player.pause();
  } else {
    document.getElementById("my-player").style.display = "block";
    player.play();
    document.getElementById("show_on_ui").style.display = "none";
  }

  //

  ipcRenderer.invoke("VideoCom", "GETAPPPATH").then((result) => {
    // ...
    console.log("VideoCom app path", result);
    this.appPath = result;
  });

  ipcRenderer.invoke("VideoCom", "GET_PLAY_LIST").then((res) => {
    let pList = [];
    res.forEach((element) => {
      let item = {
        type: "video/mp4",
        src: "file://" + this.appPath + "/" + element,
        codec: "h265",
      };

      pList.push({
        sources: [item],
      });
    });

    //console.log(pList);
    player.playlist(pList);
    player.playlist.repeat(true);
    player.playlist.autoadvance(0);
    if (pList.length == 1) {
      //console.log("check");
      player.on("ended", () => {
        //console.log("ended");
        player.play();
      });
    }

    setInterval(() => {
      sync_heartbeat(player);
    }, 2000);
    setInterval(() => {
      sync_has_audio();
      sync_has_image();
    }, 1000);
    player.on("playlistitem", () => {
      const playlist = player.playlist;

      //console.log("Playlist item change");
      if (playlist.currentIndex() === playlist.lastIndex()) {
        playlist.autoadvance(); // autoadvance off on last item
        player.one("ended", () => {
          // after playback ended (playlist finished)

          // after new play start (replay)
          playlist.currentItem(0); // without this, the last item would be played again and then the playlist restarted
          playlist.autoadvance(0);
          player.play();
          //console.log("Playlist item ended");
        });
      }
    });
    player.play();
  });
  //// BASIC FUNCTIONS ////

  // Video Player

  /* vid1.addEventListener("ended", function () {
    updatePlayingIndex();
    vid1.src =
      "file://" +
      user_info.homedir +
      VIDEO_INFO.video_files[VIDEO_INFO.current_video];

    vid1.load();
    vid1.play();
  }); */
}

function sync_has_image() {
  ipcRenderer.invoke("IMAGE", 1).then((res) => {
    if (res.length > 0) {
      var audio_pref = res[0];
      console.log(res[0]);
      if (audio_pref.is_image == 0) {
        document.getElementById("image").style.opacity = 0;
        // document.getElementById("has_audio").style.opacity = 0;
      } else {
        document.getElementById("image").style.opacity = 1;
        // document.getElementById("has_audio").style.opacity = 1;
      }
      if (true) {
        document.getElementById("image").style.height = audio_pref.height + "%";
        document.getElementById("image").style.width = audio_pref.width + "%";
        document.getElementById("image").style.paddingTop =
          audio_pref.height / 4 + "%";
        document.getElementById("image").style.paddingLeft =
          audio_pref.width / 2 + "%";
      }
    }
  });
}
function sync_has_audio() {
  ipcRenderer.invoke("AUDIO", 1).then((res) => {
    if (res.length > 0) {
      document.getElementById("labels").style.opacity = 1;
      var audio_pref = res[0];
      console.log(res[0]);
      if (audio_pref.is_audio == 0) {
        document.getElementById("no_audio").style.opacity = 0;
        // document.getElementById("has_audio").style.opacity = 0;
      } else if (audio_pref.is_audio == 1) {
        document.getElementById("no_audio").style.opacity = 1;
        // document.getElementById("has_audio").style.opacity = 0;
      } else {
        document.getElementById("no_audio").style.opacity = 0;
        // document.getElementById("has_audio").style.opacity = 1;
      }
      if (
        audio_width != audio_pref.width ||
        audio_height != audio_pref.height
      ) {
        document.getElementById("no_audio").style.height =
          audio_pref.height + "px";
        document.getElementById("no_audio").style.width =
          audio_pref.width + "px";
        document.getElementById("has_audio").style.height =
          audio_pref.height + "px";
        document.getElementById("has_audio").style.width =
          audio_pref.width + "px";
      }
    } else {
      document.getElementById("labels").style.opacity = 0;
    }
  });
}
function hide_image() {
  document.getElementById("image").style.opacity = 0;
}
function sync_heartbeat(player) {
  var name = player.cache_.src.split("/");
  // //console.log(player);
  // //console.log(player.audioTracks())
  var obj = {
    current_video_number: player.playlist.currentItem(),
    current_video_name: name[name.length - 1],
    current_timestamp: player.cache_.currentTime,
    current_video_status: player.paused() ? "halt" : "run",
    current_volume: player.cache_.volume,
    totalVideos: player.playlist.lastIndex() + 1,
    vduration: player.cache_.duration,
  };

  ipcRenderer.invoke("com_sync_heartbeat", JSON.stringify(obj));
}

function sendHeartbeat(cmdId, type, message) {
  let heartbeat_message = cmdId + ":" + type + ":" + message;
  ipcRenderer.invoke("com_heartbeat", heartbeat_message).then((result) => {
    // ...
    //console.log(result);
  });
}
// function sendMessageToRenderer( message) {
//   ipcRenderer.invoke("message-from-renderer", message).then((result) => {

//     console.log("message sent to renderer",result);
//   });
// }

function advertiseOnTCP(message) {
  ipcRenderer.invoke("com_advertise", message).then((result) => {
    // ...
    //console.log(result);
  });
}

function updatePlayingIndex() {
  VIDEO_INFO.current_video =
    (VIDEO_INFO.current_video + 1) % VIDEO_INFO.video_files.length;
  //console.log("update:" + VIDEO_INFO.current_video);
}

// Listenerfor NODE: Node is connected to Network interface or not
function updateOnlineStatus() {
  document.getElementById("network").innerHTML = navigator.onLine
    ? "online"
    : "offline";
  document.getElementById("network").style.backgroundColor = navigator.onLine
    ? "green"
    : "red";
}

// Add Network listener
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

ipcRenderer.send("renderer2main", "RENDERER INITIALISED");
// ipcRenderer.send("message-from-renderer", "*****************sending message to renderer");

var video = document.getElementsByTagName("video")[0];

// Coomand sent to Renderer from main
ipcRenderer.on("webContents2Renderer", (event, message) => {
  //console.log("///////////////////// IPC MESSAGE STARTS /////////////////////");
  //console.log(message);
  //console.log("////////////////////// IPC MESSAGE ENDS //////////////////////");
  // console.log(
  //   "this is the command=============================",
  //   message,
  //   typeof message,
  //   typeof message != "Object"
  // );
  const cmdArray =
    message && typeof message != "object" ? message.split(" ") : "other";
  console.log("message :>> ", message);
  // sendMessageToRenderer(message);
  if (typeof message == "string" || typeof message == "String") {
    if (message.startsWith("reload")) {
      window.location.reload();
    } else if (message.startsWith("VOLUME")) {
      advertiseOnTCP(cmdArray[0]);
      let cmdArray = message.split(" ");
      let volume = cmdArray[2];
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for volume change"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        volume = parseInt(volume);
        if (!isNaN(volume)) {
          this.player.volume(volume / 100);
        }
        try {
          cmdArray[1]
            ? sendHeartbeat(cmdArray[1], "INFO", "Volume change SUCCESSFUL")
            : null;
        } catch (e) {}
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERROR while Changing volume"
              )
            : null;
        } catch (e) {}
      }
    } else if (message.startsWith("playByName")) {
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for playByName"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        let name = cmdArray[2];
        //console.log("video name", this.player.playlist());
        let play_list = this.player.playlist();
        let video_index;
        play_list.find((val, index) => {
          //console.log(name);
          if (
            val.sources[0].src.split("/")[
              val.sources[0].src.split("/").length - 1
            ] == name.trim()
          ) {
            video_index = index;
            //console.log("found");
            return true;
          } else {
            return false;
          }
        });

        if (video_index != -1) {
          this.player.playlist.currentItem(video_index);
          this.player.playlist.autoadvance(video_index);
          this.player.play();
        }
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "tcp request to playByName is Successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERROR tcp request for playByName"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
    } else if (message.startsWith("gotoTime")) {
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for gotoTime"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        let position = cmdArray[2];
        position = parseInt(position);
        if (!isNaN(position)) {
          this.player.currentTime(position);
          const playlist = this.player.playlist;
          if (
            this.player.duration() < position &&
            playlist.currentIndex() === playlist.lastIndex()
          ) {
            // after new play start (replay)
            playlist.currentItem(0); // without this, the last item would be played again and then the playlist restarted
            playlist.autoadvance(0);
            this.player.play();
          } else {
            this.player.play();
          }

          advertiseOnTCP(cmdArray[0]);
        }
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "tcp request to gotoTime is Successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERROR tcp request for gotoTime"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
    } else if (message.startsWith("timestamp")) {
      //console.log(message,cmdArray);

      ipcRenderer.send(
        "timestamp",
        cmdArray[1] +
          "@" +
          cmdArray[2] +
          "@" +
          this.player.playlist.currentIndex() +
          " " +
          this.player.currentTime() +
          " " +
          (this.player.paused() ? "halt" : "run")
      );
    } else if (message.startsWith("TEST")) {
      advertiseOnTCP(cmdArray[0]);

      let position = cmdArray[2];
      //console.log(JSON.parse(position));
    } else if (message.startsWith("SHOW_ON_UI")) {
      try {
        //console.log("SHOW_ON_UI RECEIVED");
        let cmdArray2 = message.split("@@--@@");
        // SAMPLE JSON & Base Concoded data
        // {'broadcast': false,'message':'This is the message body','name': 'Ankit Sinha','person_image':'https://i.pravatar.cc/150?img=1','title':'This is title'}
        //SHOW_ON_UI 1 eydicm9hZGNhc3QnOiBmYWxzZSwnbWVzc2FnZSc6J1RoaXMgaXMgdGhlIG1lc3NhZ2UgYm9keScsJ25hbWUnOiAnQW5raXQgU2luaGEnLCdwZXJzb25faW1hZ2UnOidodHRwczovL2kucHJhdmF0YXIuY2MvMTUwP2ltZz0xJywndGl0bGUnOidUaGlzIGlzIHRpdGxlJ30=
        // SHOW_ON_UI 1 eydicm9hZGNhc3QnOiB0cnVlLCdtZXNzYWdlJzonVGhpcyBpcyB0aGUgbWVzc2FnZSBib2R5JywnbmFtZSc6ICdBbmtpdCBTaW5oYScsJ3BlcnNvbl9pbWFnZSc6J2h0dHBzOi8vaS5wcmF2YXRhci5jYy8xNTA/aW1nPTEnLCd0aXRsZSc6J1RoaXMgaXMgdGl0bGUnfQ==
        let userMessage = JSON.parse(cmdArray2[1].replace(/'/g, '"'));
        //console.log(userMessage);
        show_on_ui(
          userMessage["name"],
          userMessage["message"],
          userMessage["title"],
          userMessage["person_image"],
          userMessage["broadcast"]
        );
      } catch (e) {}
    } else if (message.startsWith("resetE")) {
      try {
        advertiseOnTCP(cmdArray[0]);
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for resetE"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        if (player.playlist.currentItem() != 0) {
          //console.log('current item',this.player.playlist.currentItem())
          player.playlist.currentItem(0);
        } else {
          player.currentTime(0);
        }
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for resetE is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for resetE"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
      player.play();
      setTimeout(() => {
        player.currentTime(1);
        player.pause();
        player.on("ended", () => {
          console.log("changed", "ended");
          setTimeout(() => {
            player.playlist.currentItem(0);
            setTimeout(() => {
              player.pause();
              if (APP_DATA.enable_artnet) {
                try {
                  // set channel 1 to 255 and disconnect afterwards.
                  artnet.set(APP_DATA.artnet_channel, 0, function (err, res) {
                    artnet.close();
                  });
                } catch (error) {
                  console.log("EXCEPTION ARTNET " + error);
                }
              }
            }, 100);
          }, 100);
        });
      }, 1000);

      player.playlist.on("beforeplaylistitem", () => {
        console.log("changed", "changes");
        player.pause();
      });
    } else if (message.startsWith("resetH")) {
      try {
        advertiseOnTCP(cmdArray[0]);
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for resetH"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        if (player.playlist.currentItem() != 1) {
          player.playlist.currentItem(1);
        } else {
          player.currentTime(0);
        }

        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for resetH is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for resetH"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
      player.play();
      setTimeout(() => {
        player.currentTime(1);
        player.pause();
        player.on("ended", () => {
          console.log("changed", "ended");
          setTimeout(() => {
            player.playlist.currentItem(1);
            setTimeout(() => {
              player.pause();
              if (APP_DATA.enable_artnet) {
                try {
                  // set channel 1 to 255 and disconnect afterwards.
                  artnet.set(APP_DATA.artnet_channel, 0, function (err, res) {
                    artnet.close();
                  });
                } catch (error) {
                  console.log("EXCEPTION ARTNET " + error);
                }
              }
            }, 100);
          }, 100);
        });
      }, 1000);

      player.playlist.on("beforeplaylistitem", () => {
        console.log("changed", "changes");
        player.pause();
      });
    }
  }
  switch (cmdArray[0]) {
    case "run":
      console.log("this=>" + cmdArray);
      try {
        advertiseOnTCP(cmdArray[0]);
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for volume change"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        this.player.play();
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for run is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for run"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }

      break;
    case "nextVideo":
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for nextVideo"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        const playlist = this.player.playlist;
        if (playlist.currentIndex() === playlist.lastIndex()) {
          // after new play start (replay)
          playlist.currentItem(0); // without this, the last item would be played again and then the playlist restarted
          playlist.autoadvance(0);
          this.player.play();
        } else {
          this.player.playlist.next();
        }

        advertiseOnTCP(cmdArray[0]);
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for nextVideo is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for nextVideo"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }

      break;

    case "previousVideo":
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for previousVideo"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        this.player.playlist.previous();

        advertiseOnTCP(cmdArray[0]);
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for PreviousVideo is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for previousVideo"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }

      break;
    case "halt":
      try {
        console.log("this is the commsand", message);
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for halt"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        this.player.pause();
        advertiseOnTCP(cmdArray[0]);
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for halt is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for halt"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
      break;
    case "reset":
      try {
        console.log("-------------------------------------reset");
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for reset"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        this.player.currentTime(0);
        advertiseOnTCP(cmdArray[0]);
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for reset is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for reset"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
      break;
    case "resetShow":
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for resetShow"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        this.player.currentTime(0);
        this.player.pause();
        advertiseOnTCP(cmdArray[0]);
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for resetSHow is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for resetShow"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }
      if (APP_DATA.enable_artnet) {
        try {
          // set channel 1 to 255 and disconnect afterwards.
          artnet.set(APP_DATA.artnet_channel, 0, function (err, res) {
            artnet.close();
          });
        } catch (error) {
          //console.log("EXCEPTION ARTNET " + error);
        }
      }
      break;
    case "restart":
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for restart"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        this.player.currentTime(0);
        advertiseOnTCP(cmdArray[0]);
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for restart is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for restart"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }

      break;
    case "load":
      try {
        cmdArray[1]
          ? sendHeartbeat(
              cmdArray[1],
              "ACKNOWLEDGED",
              "Recived tcp request for load"
            )
          : null;
      } catch (e) {
        //console.log(e);
      }
      try {
        advertiseOnTCP(cmdArray[0]);
        document.location.reload();
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "INFO",
                "Recived tcp request for load is successful"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      } catch (e) {
        try {
          cmdArray[1]
            ? sendHeartbeat(
                cmdArray[1],
                "ERRORED",
                "ERRORED tcp request for load"
              )
            : null;
        } catch (e) {
          //console.log(e);
        }
      }

      break;
    case "runShow":
      advertiseOnTCP(cmdArray[0]);
      // video.currentTime = 0;
      this.player.play();
      // video.loop = false;
      // this.player.addEventListener("ended", function () {
      //   this.player.pause();

      //   // Switch off ll the light before starting the show
      //   if (APP_DATA.enable_artnet) {
      //     try {
      //       // set channel 1 to 255 and disconnect afterwards.
      //       artnet.set(APP_DATA.artnet_channel, 0, function (err, res) {
      //         artnet.close();
      //       });
      //     } catch (error) {
      //       //console.log("EXCEPTION ARTNET " + error);
      //     }
      //   }
      // });

      // If Artnet is enable switch on the DMX Light
      if (APP_DATA.enable_artnet) {
        try {
          // set channel 1 to 255 and disconnect afterwards.
          //console.log("Sending ARTNET PACKET " + APP_DATA.artnet_channel);
          artnet.set(APP_DATA.artnet_channel, 255, function (err, res) {
            artnet.close();
            //console.log("Closing ARTNET");
          });
        } catch (error) {
          //console.log("EXCEPTION ARTNET " + error);
        }
      }

      // If Artnet is enable switch on the DMX Light
      if (APP_DATA.enable_serial) {
        try {
          // set channel 1 to 255 and disconnect afterwards.
          exec("python3 s.py", (error, stdout, stderr) => {
            if (error) {
              //console.log(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              //console.log(`stderr: ${stderr}`);
              return;
            }
            //console.log(`stdout: ${stdout}`);
          });
        } catch (error) {
          console.log("EXCEPTION SERIAL " + error);
        }
      }

      break;
    case "timestamp":
      // advertiseOnTCP(
      //   "timestamp " +
      //     this.player.playlist.currentIndex() +
      //     " " +
      //     this.player.currentTime() +
      //     " " +
      //     (this.player.paused() ? "halt" : "run")
      // );

      break;
    default:
      handleOtherCommands(event, message);
      break;
  }
});

ipcRenderer.on("socket-data", (event, data) => {
  console.log("Data received in socketttttttttttrenderer process:",event, data);
  // Handle the received data as needed in the renderer process
});
ipcRenderer.on("event-clicked", (event, data) => {
  console.log(
    "Data received in taction table renderer process:",
    event,
    data
  );
  // Handle the received data as needed in the renderer process
});
ipcRenderer.on("socket-data", (event, data) => {
  console.log(
    "Data received in socketttttttttttrenderer process:",
    event,
    data
  );
  // Handle the received data as needed in the renderer process
});
function handleOtherCommands(event, command) {
  REG_INIT = "REG_INIT";
  REG_COMPLETE = "REG_COMPLETE";
  MESSAGE = "message";
  ERROR = "error";
  INFORMATION = "information";

  if (command.action == REG_INIT || command.action == REG_COMPLETE) {
    document.getElementById(REG_INIT).innerHTML =
      "Uniquie Registraction Code: " + command.data.unique_reg_code;
    document.getElementById(MESSAGE).innerHTML = command.data.message;
  }

  if (command.type == "ERROR") {
    try {
      document.getElementById(ERROR).innerHTML =
        document.getElementById(ERROR).innerHTML + "<br>" + command.data;
    } catch (error) {}
  }

  if (command.type == "DATA") {
    try {
      document.getElementById(INFORMATION).innerHTML =
        document.getElementById(INFORMATION).innerHTML +
        "<br>" +
        JSON.stringify(command.data);
    } catch (error) {}
  } else {
    //console.log("MAIN TO RENDERER", event, command);
    try {
      document.getElementById(INFORMATION).innerHTML =
        document.getElementById(INFORMATION).innerHTML +
        "<br>" +
        JSON.stringify(command);
    } catch (error) {}
  }
}

function show_on_ui(name, message, title, image, broadcast) {
  if (broadcast) {
    warning_up = `
      <div class="card card_warning" >
    <img class="card-img-top" src="${image}" alt="Card image cap">
    <div class="card-body">
      <h5 class="card-title">${name}</h5>
      <p class="card-text">${message}</p>
    </div>
  </div>`;

    document.getElementById("warning").innerHTML = warning_up;
  } else {
    try {
      var random = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
      var divsize = (Math.random() * 100 + 300).toFixed();
      var posx = (Math.random() * (1920 - divsize)).toFixed();
      var posy = (Math.random() * (1080 - divsize)).toFixed();

      pop_up = `
      <div class="card" style="position: absolute; left: ${posx}px; top: ${posy}px;">
    <img class="card-img-top" src="${image}" alt="Card image cap">
    <div class="card-body">
      <h5 class="card-title">${name}</h5>
      <p class="card-text">${message}</p>
    </div>
  </div>`;

      // document.write("HELLO HELLO" + name);
      // pop_up ="<div style='left:" +posx +"px; top:" +posy +"px;' class='t_container' ><div class='t_image_container'><img src='" +image +"'  class='t_image'>div><div><p class='t_title'>" +title +"</p><p class='t_message'>" +message +"</p><p class='t_name'>" +name +"</p></div></div>";
    } catch (e) {
      //console.log(e);
    }
    //console.log("POPUP:", pop_up);
    document.getElementsByClassName("show_on_ui")[0].innerHTML += pop_up;
  }
}
