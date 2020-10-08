(function () {
    const port = 1337;
    const host = '192.168.0.103';//your local ip (cmd ipconfig) note: your local ip could change if the device or network is restarted
    const WebSocket = require('ws');
    var http = require('https');    //A self-signed certificate is used. Browsers will not accept this certificate because the certificate is not provided by a certified authority that the browser knows.
    //The certificate has to be manually added to the browser(go to manage certificates in browser settings and import the certificate, .cert, to the trusted root CA.
    //Also if your machine's ip is not 192.168.0.103 then the webiste will still not be trusted because the certicate is issued to only to 192.168.0.103
    //STEPS:
    //First,in SSL folder, delete .key .csr .crt .pfx but DON'T delete the two .cnf and .sh files 
    //Second go to crt.cnf and change subjectAltName to your ip
    //Third, To create the ssl files, run .sh files in the order: make-key, make-csr, make-crt, make-pfx. If you have a virtual linux OS (like Ubuntu), it is preferred to run them there and then send the files to Windows
    const fs = require("fs").promises;
    var fss = require("fs");

    options = {

        pfx: fss.readFileSync("ssl/crt.pfx"),//pfx is one of the accepted certificate formats in Android 
        passphrase: "password"

    };
    const httpsServer = http.createServer(options, function (req, res) {
        fs.readFile(__dirname + "/index.html")
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
    });

    const wss = new WebSocket.Server({ server:httpsServer })

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(data) {
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            })
        })
    })

    httpsServer.listen(port, host, () => {
        console.log(`Server is running on https://${host}:${port}`)
    })
})();
