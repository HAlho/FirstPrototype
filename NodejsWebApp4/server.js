const port = 1337;
const host = '192.168.0.103';
const WebSocket = require('ws');
var https = require('https');
var fs = require("fs").promises;

/*options = {

    pfx: fs.readFileSync("ssl/crt.pfx"),
    passphrase: "password"

};*/
const server = https.createServer(function (req, res) {
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