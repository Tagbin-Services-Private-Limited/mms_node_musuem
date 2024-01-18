// const cluster = require('cluster');
// const dgram = require('dgram'); 
// var shell = require('shelljs');
// const server = dgram.createSocket('udp4');

// server.on('error', (err) => {
//   console.log(`server error:\n${err.stack}`);
//   server.close();
// });

// server.on('message', (msg, senderInfo) => {
//   console.log('Messages received '+ msg)
//   server.send(msg,senderInfo.port,senderInfo.address,()=>{
//   console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`)
//   })
// });

// server.on('listening', () => {
//   const address = server.address();
//   console.log(`startUDPServer: UDP Server listening on ${address.address}:${address.port}`);
// });

// // Kill the process that has occupied the PORT 2626
// try{
//   shell.exec("kill -9 $(lsof -i tcp:2625 | awk 'NR==2 {print $2}') ")

// }catch(e){
//   console.log("startUDPServer Kill Already running TCP: AN ERROR HAS OCCURED!");
//   console.log("startUDPServer kill Already running TCP:"+ e)
// }

// try{
//   server.bind(2625);
// }catch(e){
//   console.log("startUDPServer: AN ERROR HAS OCCURED!");
//   console.log("startUDPServer:"+ e)
// }
























































// var news = [
//    "Borussia Dortmund wins German championship",
//    "Tornado warning for the Bay Area",
//    "More rain for the weekend",
//    "Android tablets take over the world",
//    "iPad2 sold out",
//    "Nation's rappers down to last two samples"
// ];


// // var server = dgram.createSocket("udp4"); 

// IP = "224.0.0.251"
// PORT = 1234
// // HOST = "192.168.1.13"
// // try{

// //   server.bind();
// //   server.setBroadcast(true)
// //   server.setMulticastTTL(128);
// //   server.addMembership(IP, HOST); 
// //   setInterval(broadcastNew, 5000);
// // }catch(e){
// //   console.log("startUDPServer: AN ERROR HAS OCCURED!");
// //   console.log("startUDPServer:"+ e)
// // }


// // function broadcastNew() {
// //     var message = new Buffer(news[Math.floor(Math.random()*news.length)]);
// //     server.send(message, 0, message.length, PORT, IP);
// //     console.log("Sent " + message + " to the wire...");
// //     //server.close();
// // }


// // try{

// //   const s = dgram.createSocket('udp4');
// // if (cluster.isPrimary) {
// //   cluster.fork(); // Works ok.
// //   cluster.fork(); // Fails with EADDRINUSE.
// // } else {

// //   s.bind(12347, () => {
// //     s.addMembership('224.0.0.251');
// //     s.setBroadcast(true)

// //   });
// // }

// // const message = Buffer.from('Some bytes');

// // setInterval(function  (argument) {
// //  s.send(message, 1234, (err) => {
// //   s.close();
// // });
// // },5000)
// // }catch(e){
// //   console.log("startUDPServer: AN ERROR HAS OCCURED!");
// //   console.log("startUDPServer:"+ e)
// // }