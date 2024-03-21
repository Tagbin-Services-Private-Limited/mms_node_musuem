const axios = require("axios");

function sendToRenderer(message) {
  global.mainWindow.webContents.send("webContents2Renderer", message);
}
const sendToCloudFunction = async (message) => {
  try {
    // console.log('log :- ', message);
    const data = JSON.stringify({
      message: `message:${message}- ${new Date().toISOString()}`,
    });
    sendToRenderer(message);
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://asia-south1-vbsy-stagging.cloudfunctions.net/storeLog",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    
    // const response = await axios.request(config);
    // console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = sendToCloudFunction;
