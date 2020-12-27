(function () {
    const express = require('express')
    const port = 1337;
    const host = '192.168.0.123';//your local ip (cmd ipconfig) note: your local ip could change if the device or network is restarted
    const WebSocket = require('ws');
    const http = require('http')
    var https = require('https');    //A self-signed certificate is used. Browsers will not accept this certificate because the certificate is not provided by a certified authority that the browser knows.
    //The certificate has to be manually added to the browser(go to manage certificates in browser settings and import the certificate, .cert, to the trusted root CA.
    //Also if your machine's ip is not 192.168.0.103 then the webiste will still not be trusted because the certicate is issued to only to 192.168.0.103
    //STEPS:
    //First,in SSL folder, delete .key .csr .crt .pfx but DON'T delete the two .cnf and .sh files 
    //Second go to crt.cnf and change subjectAltName to your ip
    //Third, To create the ssl files, run .sh files in the order: make-key, make-csr, make-crt, make-pfx. If you have a virtual linux OS (like Ubuntu), it is preferred to run them there and then send the files to Windows
    const fs = require("fs").promises;
    var fss = require("fs");
    var admin = require("firebase-admin");
    const path = require('path');
    const app = express()

   // importScripts('https://www.gstatic.com/firebasejs/4.13.0/firebase-app.js')//not needed for fbadmin
    //importScripts('https://www.gstatic.com/firebasejs/4.13.0/firebase-messaging.js')//same
    var serviceAccount = require("./serviceAccountKey.json");//might be wrong path
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount), //was admin.credential.applicationDefault()
        databaseURL: 'https://auth-c0cb3.firebaseio.com'
    });

    options = {

        pfx: fss.readFileSync("ssl/crt.pfx"),//pfx is one of the accepted certificate formats in Android 
        passphrase: "password"

    };


    http.createServer(app).listen(5000)
    https.createServer(options, app).listen(5010)
    /*const httpsServer = http.createServer(options, function (req, res) {
        fs.readFile(__dirname + "/page1.html")
            .then(contents => {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                res.end(contents);
            })
            .catch(err => {
                res.writeHead(500);
                res.end(err);
                return;
            });
    });*/

    /*const wss = new WebSocket.Server({ server:httpsServer })

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(data) {
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            })
        })
    })*/

    var registrationToken = 'c5drwFsHxv9tJ7NqXQxftW:APA91bFp2Um2eW-dnOktxxKtcI8wEv1Ml5ud3NKeMhaAkD826B--Ipf44OVpFWJNCC5SCWg3GjjT_lI6ZGzShKHzkns7V-QtdoMH1BLDvDjX-sUxJXKKe6Oxh_iEDa6OY2y41ykFkBzK';


    app.get('/', function (req, res) {
        fs.readFile(__dirname + "/page1.html")
            .then(contents => {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                res.end(contents);
                

                /*var payload = {
                    data: {
                        score: '850',
                        time: '2:45'
                    }
                };*/


                //database
                var db = admin.database();
                var ref = db.ref("users/FQsBShZbfFY873vuIUCAAWQbd6k2/");

                // Attach an asynchronous callback to read the data at our posts reference
                ref.on("value", function (snapshot) {
                    console.log(snapshot.val());
                }, function (errorObject) {
                    console.log("The read failed: " + errorObject.code);
                });

                var payload = {
                    notification: {
                        title: 'status',
                        body: 'TEST'
                    }
                };

                admin.messaging().sendToDevice(registrationToken, payload)
                    .then(function (response) {
                        console.log("Successfully sent message:", response);
                    })
                    .catch(function (error) {
                        console.log("Error sending message:", error);
                    });

                
            })
            .catch(err => {
                res.writeHead(500);
                res.end(err);
                return;
            });
    })


    
    app.get('/firebase-messaging-sw.js', function (req, res) {
        fs.readFile(__dirname + "/firebase-messaging-sw.js")
            .then(contents => {
                res.setHeader("Content-Type", "application/javascript");
                res.writeHead(200);
                res.end(contents);
            })
            .catch(err => {
                res.writeHead(500);
                res.end(err);
                return;
            });
    })


    

    // Send a message to the device corresponding to the provided
    // registration token.
    /*admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });*/
    

    /*httpsServer.listen(port, host, () => {
        console.log(`Server is running on https://${host}:${port}`)
    })*/
})();

