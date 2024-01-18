const { insertCustomerReviewData } = require("./appDatabase");
function saveDataInNeDB(data) {
  try {
    if (data && typeof data === "string") {
      data = JSON.parse(data);
    }
    insertCustomerReviewData(data);
  } catch (err) {
    console.log("err :>> ", err);
  }
}

module.exports = saveDataInNeDB;
