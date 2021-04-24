// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { fork } = require('child_process');
const maxProc = 2;
var numProc = 0;//number of running child processes
//const messaging = require('firebase/messaging');

//database reference
var db = admin.database();

//paypal checkout sdk
const paypal = require('@paypal/checkout-server-sdk');

// Creating an environment
let clientId = "AazgvfZgfI1XU-eb2huPK1FDVN-x7YSTolwAt-g6rabZJNQqnT5hf2fJPtaD2Vri14o0oktWCvfONZCO";
let clientSecret = "EKzFVyLD0QPUecuN0-HiYIgkQcrSJEQ2G94hBs38QkWIpH_1-buhkiy1ingyncmL_LTnhBFceigIYGSq";
// This sample uses SandboxEnvironment. In production, use LiveEnvironment
let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
let client = new paypal.core.PayPalHttpClient(environment);

router.use(express.json({ limit: '1mb' }));

// Function to direct the client to newRequest.html
router.get('/newRequest', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'newRequest.html'));
});


//get the user's current car information and send it to client
router.post('/getCurrentCar', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user's info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    const car = user.cars[user.currentCar]; //get user's car info

    //get technical car info
    var snapshot = await db.ref('carList/' + car.brand + '/' + car.model).once('value');
    const batteryCapacity = snapshot.val().batteryCapacity;
    const consumption = snapshot.val().avgConsumption;

    //send car to client
    response.json({ status: "success", car, batteryCapacity, consumption });
});

//update user's location
router.post('/storeGeolocation', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const lat = request.body.lat; //user latitude
    const lon = request.body.lon; //user longitude
    const tim = request.body.tim; //time

    //update user's location in the database
    db.ref('users/' + userId + "/location/").set({
        latitude: lat,
        longitude: lon,
        timestamp: tim
    });

    //send response to client
    response.json({
        status: "success"
    });
});

//submit a new request
router.post('/submitRequest', async (request, response) => {
    //get client request info
    const data = request.body; //data = { userId, neededEnergy, reqStart, currentEnergy, currentSoC, maxDistance, carBrand, carModel, carColor, carNum }

    var newReq = db.ref('activeRequests/issued').push(); //create reference to a new request
    //set requet information in the database
    newReq.set({
        amount: data.neededEnergy,
        timestamp: data.reqStart,
        requester: {
            uid: data.userId,
            currentEnergy: data.currentEnergy,
            currentSoC: data.currentSoC,
            maxDistance: data.maxDistance,
            car: { brand: data.carBrand, model: data.carModel, color: data.carColor, licenseNumber: data.carNum }
        }
    }).then(() => {
        db.ref('users/' + data.userId).child('activeRequest').set({ id: newReq.key, dbref: 'issued', role: 'requester' }); //save request info under user information
        db.ref('users/' + data.userId).update({ status: 'Busy' }); //set user status to 'busy'
    })

    //send response to client
    response.json({
        status: "success"
    });

    //send notification                                                                                            ///////////////////////////////////////////////////////??????? maybe make this a function?
    //retrieve tokens except the user's token
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
        if (id == data.userId) continue;
        else if (u[id].status != "Available") continue;
        tokens.push(t[k].token);
    }


    if (numProc < maxProc) {//was 30                                                                                            ///////////////////////////////////////////////////////???????
        const compute = fork('helper.js'); //create child process that runs helper.js
        numProc++;
        //top stack
        fs.appendFile('procInfo.txt', "1\n", function (err) {//write the number of running proccesses to procInfo.txt
            if (err) return console.log(err);
            console.log('proc now:' + numProc);
        });
        compute.send({ n: 17, uid: data.userId, pid: compute.pid });//send to the child process
        compute.on('message', sum => {//get the value from the child process
            console.log("result is: " + sum);
            compute.kill();
            numProc--;
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
                fs.writeFile('procInfo.txt', newData, function (err) {
                    if (err) return console.log(err);
                    console.log('proc now:' + numProc);
                });
            });


        });
    } else {//create a thread and let it check for available slots
        const worker = new Worker("./wait.js", { //create a new thread that runs helper.js
            workerData: { //pass the variables here
                n: 15,
                uid: data.userId
            }
        });

        worker.postMessage(worker.threadId);
        worker.on('message', message => console.log(message)); //get the result variables through message //add here worker.terminate();
    }
});
                                 

module.exports = router;
