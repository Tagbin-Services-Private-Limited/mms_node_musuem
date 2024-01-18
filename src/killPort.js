// Kill the process that has occupied the TCP PORT
// try {
//   const batchFileName = "killPort.bat";
//   const batchFilePath = path.join(__dirname, batchFileName);
//   let completeScriptName = `${batchFilePath} ${port}`;
//   // this script is commented because it is killing current running mms node server
//   exec(completeScriptName, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error executing command: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.error(`Command stderr: ${stderr}`);
//       return;
//     }
//     console.log(`Command output: ${stdout}`);
//   });
//    console.log('result of statting tcp sserver:>> ', result);
// } catch (e) {
//   console.log(
//     "startTCPServer Kill Already running TCP: AN ERROR HAS OCCURED!"
//   );
//   console.log("startTCPServer kill Already running TCP:" + e);
// }
