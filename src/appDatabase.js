const Datastore = require("nedb");
let APP_DATA = global.APP_DATA;
//DB Const declare
const dbFilename = "applicationStorage.db";
const dblocal = "local.db";
const dbAudio = "audioDB.db";
const dbImage = "imageDB.db";
const configDb = "configDB.db";
const customerReviewDb = "customerReviewDB.db";
// Initialise Persistent Database
const db = new Datastore({ filename: dbFilename, autoload: true });
const audioDB = new Datastore({ filename: dbAudio, autoload: true });
const imageDB = new Datastore({ filename: dbImage, autoload: true });
const dbloc = new Datastore({ filename: dblocal, autoload: true });
const configDB = new Datastore({ filename: configDb, autoload: true });
const customerReviewDB = new Datastore({ filename: customerReviewDb, autoload: true });

global.mainDB = db;
global.audioDB = audioDB;
global.imageDB = imageDB;
global.dblocal = dblocal;
global.configDB = configDB;
global.customerReviewDB = customerReviewDB;
let uniqueKey = "unique1234";
const findData = () => {
  return new Promise((resolve, reject) => {
    dbloc.find({}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const setData = async () => {
  try {
    const data = await findData();
    if (data.length >= 1) {
      global.APP_DATA.shutdown_2626 = data[0].onlyEncrypted;
      console.log(data[0].onlyEncrypted);
    } else {
      global.APP_DATA.shutdown_2626 = false;
    }
  } catch (error) {
    console.error("error in setting data",error);
  }
};
const findImageData = () => {
  return new Promise((resolve, reject) => {
    imageDB.find({}, (err, data) => {
      resolve(data);
    });
  });
};

const findAudioData = () => {
  return new Promise((resolve, reject) => {
    audioDB.find({}, (err, data) => {
      resolve(data);
    });
  });
};

//Check for exiting Token in the app
const findTokenData = () => {
  return new Promise((resolve, reject) => {
    db.find({}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

//Function to add Token inside db
const insertToken = (dataToInsert) => {
  return new Promise((resolve, reject) => {
    db.insert(dataToInsert, (err, data) => {
      if (err) {
        console.log("Error while inserting token:", err);
        reject(err);
      } else {
        // console.log("Token inserted successfully:", data);
        resolve(data);
      }
    });
  });
};

//Function to add config data inside db
const insertConfigData = (dataToInsert) => {
  console.log("inside inserting dataToInsert :>> ", dataToInsert);
  dataToInsert = { uniqueKey, ...dataToInsert };
  return new Promise((resolve, reject) => {
    configDB.insert(dataToInsert, (err, data) => {
      if (err) {
        console.log("Error while inserting config data:", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
//Function to update config data inside db
const updateConfigData = (dataToUpdate) => {
  console.log(" updateConfigData dataToUpdate :>> ", dataToUpdate);
  return new Promise((resolve, reject) => {
    configDB.update({ uniqueKey }, dataToUpdate, {}, (err, data) => {
      if (err) {
        console.log("Error while updating config data:", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
//Function to add or update config data
const addOrUpdateConfigData = async (dataToInsert) => {
  try {
    let currentData = await findConfigData();
    console.log("----------currentData :>> ", currentData);
    let updatedOrInsertedData;
    if (currentData && currentData.success) {
      if (currentData.data && currentData.data[0]) {
        let previousData = currentData.data[0] ? currentData.data[0] : {};
        let finalDataToInsert = { ...previousData, ...dataToInsert };
        updatedOrInsertedData = await updateConfigData(finalDataToInsert);
      } else {
        updatedOrInsertedData = await insertConfigData(dataToInsert);
      }
      console.log("updatedOrInsertedData :>> ", updatedOrInsertedData);
      return { success: true, data: updatedOrInsertedData };
    }
    return { success: false, data: {} };
  } catch (error) {
    console.log("Error while inserting config data:", err);
    return { success: false, data: error };
  }
};

//Check for fetch config data in the app
const findConfigData = () => {
  return new Promise((resolve, reject) => {
    configDB.find({}, (err, data) => {
      if (err) {
        resolve({ success: false, data: err });
      } else {
        resolve({ success: true, data });
      }
    });
  });
};

//Function to add config data inside db
const insertCustomerReviewData = (dataToInsert) => {
  return new Promise((resolve, reject) => {
    customerReviewDB.insert(dataToInsert, (err, data) => {
      if (err) {
        console.log("Error while inserting config data:", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
global.dbloc = dbloc;
module.exports = {
  setData,
  findImageData,
  findAudioData,
  findTokenData,
  insertToken,
  dbFilename,
  addOrUpdateConfigData,
  findConfigData,
  insertCustomerReviewData,
};
