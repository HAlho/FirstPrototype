const { fork } = require('child_process');
const fs = require('fs');

const { admin } = require('./routes/firebaseConfig.js');

// Get a database reference to our posts
var db = admin.database();


setInterval(() => {
    //check if the algorithm had been started by a user request
    let procInfo = fs.readFileSync('procInfo.txt', "utf8");
    var lines = procInfo.split('\n');
    if (lines[0] == '') {
        console.log("manager: starting periodic algorithm");
        const compute = fork('helper.js'); //create child process that runs helper.js
        fs.appendFile('procInfo.txt', "1\n", function (err) {//write the number of running proccesses to procInfo.txt
            if (err) return console.log(err);
        });
        compute.send({ pid: compute.pid });//send to the child process
        compute.on('message', sum => {//get the value from the child process
            console.log("result is: " + sum);
            compute.kill();
            //pop stack
            var newData;
            fs.readFile('procInfo.txt', "utf8", (err, data) => {
                if (err) throw err;
                // break the textblock into an array of lines
                var lines = data.split('\n');
                // remove one line, starting at the first position. Unlike slice, splice return the removed Items
                lines.splice(0, 1);
                // join the array back into a single string
                newData = lines.join('\n');
                //console.log("new data is :" + newData);
                fs.writeFile('procInfo.txt', newData, function (err) {
                    if (err) return console.log(err);
                });
            });


        });
    }
}, 180000); // 180000


setInterval(async () => { //retrieve tokens except the user's token
    console.log("manager: starting periodic location check");
    var snapshot = await db.ref('tokens').once('value');
    const t = snapshot.val();
    snapshot = await db.ref('users').once('value');
    const u = snapshot.val();
    var keys = Object.keys(t); //ids of the tokens
    var tokens = [];
    var k;
    var id;
    for (i = 0; i < keys.length; i++) {//also check the user status
        k = keys[i];
        id = t[k].uid;
        if (u[id].status != "Available") continue;
        if (u[id].activeRequest != null) continue//check if the user has a request
        if ((Date.now() - u[id].location.timestamp) < 900000) continue; //check if the location had passed 15 mins
        console.log("manager: tokens: " + id);

        tokens.push(t[k].token);
    }

    for (let i of tokens) {//do this for each token in the array
        var registrationToken = i;
        var payload = {
            notification: {
                title: 'Your location is outdated. Please open the app to receive consumer requests.',
                body: ''
            }
        };
        admin.messaging().sendToDevice(registrationToken, payload)
            .then(function (response) {
                console.log("Successfully sent message:", response);
            })
            .catch(function (error) {
                console.log("Error sending message:", error);
            });
    }
}, 900000);//15min

setInterval(async () => {
    console.log("manager: starting periodic matched check");
    var msnapshot = await db.ref('activeRequests/matched').once('value');
    var matched = msnapshot.val();
    if (matched != null) {
        var mkeys = Object.keys(matched); //ids of the tokens
        for (a of mkeys) {
            if (Date.now() - matched[a].match.matchMadeAt < 300000) continue; //if 5min had not passed

            await db.ref('activeRequests/matched/' + a + '/match').remove();

            //move request from matched to issued
            let oldRef = db.ref('activeRequests/matched/' + a);
            let newRef = db.ref('activeRequests/issued/' + a);
            snapshot = await oldRef.once('value');
            await newRef.set(snapshot.val());
            await oldRef.remove();

            //change requester's request reference to issued
            await db.ref('users/' + matched[a].requester.uid).child('activeRequest').update({ dbref: "issued" });

            //change provider status to Available and delete matched request from user
            await db.ref('users/' + matched[a].match.provider).update({ status: "Available" });
            await db.ref('users/' + matched[a].match.provider + '/matchedReq').remove();

        }
    }
}, 60000)//1min