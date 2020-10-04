(function () {
const port = 1337;
const host = '192.168.0.103';
const WebSocket = require('ws');
var http = require('https');
const fs = require("fs").promises;
    var fss = require("fs");

options = {

    pfx: fss.readFileSync("ssl/crt.pfx"),
    passphrase: "password"

};
const server = http.createServer(options, function (req, res) {
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

const wss = new WebSocket.Server({ server })

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        })
    })
})

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
})
})();