const exec = require("child_process").exec;
const executeCommand = (
  cmd,
  successCallback = () => {},
  errorCallback = () => {}
) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      errorCallback(error.message);
      return;
    }
    if (stderr) {
      errorCallback(stderr);
      return;
    }
    successCallback(stdout);
  });
};

module.exports = {
  executeCommand,
};