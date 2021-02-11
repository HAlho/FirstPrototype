const fs = require('fs');

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { fork } = require('child_process');

const maxProc = 2;
var numProc = 0;//number of running child processes


const path = require('path');


const express = require('express');

//const messaging = require('firebase/messaging');


const router = express.Router();



const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));




    router.get('/profile', (req, res, next) => {
        res.sendFile(path.join(__dirname, '../', 'views', 'profile.html'));
    });

    router.post('/addToken', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT AN addToken!');

        const data = request.body;


        db.ref('/tokens').push({
            token: data.token,
            uid: data.userId
        });

        response.json({
            status: "success",


        });

    });


    router.post('/userRequest', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A userReq!');
        console.log(request.body);
        const data = request.body;
        var snapshot = await db.ref('users/' + data.userId + '/activeRequest').once('value');
        var req = snapshot.val();

        response.json({
            status: "success",
            req: req
        });


    });


    router.post('/getActiveRequest', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A getActiveRequest!');

        const data = request.body;

        var snapshot = await db.ref('activeRequests/' + data.status + '/' + data.id).once('value');
        var req = snapshot.val();

        response.json({
            status: "success",
            req: req
        });

    });

    router.post('/getSecondUser', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A getSecondUser!');

        const data = request.body;
        const userId = data.userId;
        const reqId = data.id;
        var user2Id;
        var user2status;
        await db.ref('users').once('value', function (snapshot) {//HERE

            var ndata = snapshot.val();
            var nkeys = Object.keys(ndata);
            for (var i = 0; i < nkeys.length; i++) { //need to show only the associated requests with the user
                var k = nkeys[i];
                try {
                    var requestId = ndata[k].activeRequest.id;// get id of every request
                } catch (error) {//if user doesn't have an active request catch and continue loop
                    continue;
                }
                if (requestId != reqId) continue;
                if (k == userId) continue;
                user2Id = k;
                console.log(k);
                user2status = ndata[k].activeRequest.dbref;
                break;
            }
        });

        response.json({
            status: "success",
            user2Id: user2Id,
            user2status: user2status
        });

    });

    router.post('/updateComplete', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A updateComplete!');

        const data = request.body;

        db.ref('users/' + data.userId).child("activeRequest").update({ dbref: "completed" });

        //if status is scompleted do change status to complete and move request
        var snapshot = await db.ref('users/' + data.user2Id + '/activeRequest').once('value');
        var req = snapshot.val();
        if (req.dbref == "completed") {
            console.log("complete is now true");

            //if both users had clicked done 
            console.log("status is finally complete....");
            //move object to another path //don't forget to add for the supplier??
            var oldRef = db.ref('activeRequests/accepted/' + data.id);
            oldRef.update({ 'status': "completed" });//HERE
            var newRef1 = db.ref('previousRequests/' + data.userId + '/' + data.id);
            var newRef2 = db.ref('previousRequests/' + data.user2Id + '/' + data.id);
            copyFirebaseObject(oldRef, newRef1);
            moveFirebaseObject(oldRef, newRef2);
            //delete active request from both users
            db.ref('users/' + data.userId + '/activeRequest').remove();//delete from the current user
            db.ref('users/' + data.user2Id + '/activeRequest').remove();//delete from the other user

        }


        response.json({
            status: "success",
        });

    });


    router.post('/cancelRequest', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A cancelRequest!');

        const data = request.body;

        var newRef = db.ref('previousRequests/' + data.userId + '/' + data.id);
        var newRef2 = db.ref('previousRequests/' + data.user2Id + '/' + data.id);
        //if the requester is canceling the request
        if (data.userIsRequester == true) {
            if (data.status == "issued") {
                var oldRef = db.ref('activeRequests/issued/' + data.id);
                oldRef.update({ 'status': "canceled" });
                moveFirebaseObject(oldRef, newRef);
            }
            else {
                var oldRef = db.ref('activeRequests/accepted/' + data.id);
                oldRef.update({ 'status': "canceled" });
                copyFirebaseObject(oldRef, newRef2);
                moveFirebaseObject(oldRef, newRef);
                db.ref('users/' + data.user2Id + '/activeRequest').remove();

            }
        }
        else {  //if the supplier is canceling
            db.ref('activeRequests/issued').child(data.id).set({
                amount: data.amount,
                requester: data.requester
            });
            db.ref('activeRequests/accepted/' + data.id).remove();
            db.ref('users/' + data.requester.uid).child("activeRequest").update({ dbref: "issued" });

        }
        db.ref('users/' + data.userId + '/activeRequest').remove();

        response.json({
            status: "success",
        });

    });





    router.post('/pfile', (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A REQ!');
        console.log(request.body);
        const data = request.body;
        response.json({
            status: "success",
            userId: data.userId,
            newStat: data.newStat
        });

        db.ref('users/' + data.userId).update({ status: data.newStat });

    });


    router.post('/getStat', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A STAT!');

        const data = request.body;

        var snapshot = await db.ref('users/' + data.userId + '/status').once('value');
        var stat = snapshot.val();
        if (stat == null) {
            stat = "Available";
            db.ref('users/' + data.userId).update({ status: stat });
        }

        console.log(stat);

        response.json({
            status: "success",
            stat: stat
        });

    });

    router.post('/postCars', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A CAR!');

        const data = request.body;

        var snapshot = await db.ref('users/' + data.userId + '/cars').once('value');
        var cars = snapshot.val();


        console.log(cars);

        response.json({
            status: "success",
            cars: cars
        });

    });

    router.post('/carInfo', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT AN INFO!');

        const data = request.body;

        var snapshot = await db.ref('carList/' + data.carBrand + '/' + data.carModel).once('value');
        var consumption = snapshot.val().avgConsumption; //from carList
        var batteryCapacity = snapshot.val().batteryCapacity; //from carList


        response.json({
            status: "success",
            consumption: consumption,
            batteryCapacity: batteryCapacity

        });

    });



    router.post('/reqInfo', async (request, response) => { //add to recieve that post(endpoint)
        console.log('GOT A REQ INFO!');

        const data = request.body;

        var newReq = db.ref('activeRequests/issued').push();

        newReq.set({
            amount: data.neededEnergy,
            timestamp: data.reqStart,
            requester: {
                uid: data.userId,
                currentEnergy: data.currentEnergy,
                currentSoC: data.currentSoC,
                maxDistance: data.maxDistance,
                car: {
                    brand: data.carBrand,
                    model: data.carModel,
                    color: data.carColor,
                    licenseNumber: data.carNum
                }

            }

        }).then(() => {
            db.ref('users/' + data.userId).child("activeRequest").set({ id: newReq.key, dbref: "issued", role: "requester" });
        })

        response.json({
            status: "success"

        });

        //send notification
        //retrieve tokens except the user's token
        var snapshot = await db.ref('tokens').once('value');
        const t = snapshot.val();
        snapshot = await db.ref('users').once('value');
        const u = snapshot.val();
        var keys = Object.keys(t); //ids of the tokens
        var tokens = [];
        var k;
        var id;
        //console.log("keys: " + keys);
        for (i = 0; i < keys.length; i++) {//also check the user status
            k = keys[i];
           // console.log("key: " + keys[i]);
            id = t[k].uid;
            if (id == data.userId) continue;
            else if (u[id].status != "Available") continue;
            //console.log("token pushed is: " + t[k].token);
            tokens.push(t[k].token);
        }
       // console.log("tokens: " + tokens);

        //for (let i of tokens) {//do this for each token in the array
        //    //console.log("to be sent: " + i);
        //    var registrationToken = i;
        //    var payload = {
        //        notification: {
        //            title: 'A new request has been made',
        //            body: data.neededEnergy
        //        }
        //    };
        //    admin.messaging().sendToDevice(registrationToken, payload)
        //        .then(function (response) {
        //            console.log("Successfully sent message:", response);
        //        })
        //        .catch(function (error) {
        //            console.log("Error sending message:", error);
        //        });
        //}





        if (numProc < maxProc) {//was 30
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
                    console.log("new data is :" + newData);
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
    //there should be a last else for if the thread's queue is full, we ask the user to try again shortly



    });


router.post('/checkUpdates', async (request, response) => {
    console.log('GOT A checkUpdates');
    console.log('GOT A LOCATION!');

    console.log(request.body);

    const data = request.body;

    var location = db.ref('activeRequests/issued').push();

    db.ref('location').child(data.userId).set({
        latitude: data.lat,
        longitude: data.lon,
        timestamp: data.tim
    });

    //var req = { dbref:null, id:null, role:null };//asssign them null to prevent cannot read property of null error
    const snapshot = await db.ref('users/' + data.userId + '/activeRequest').once('value');
    var req = snapshot.val();

    var u = true;

    try {
        if (data.status == req.dbref)
            u = false;
    } catch (error) {
        //console.log(error);
        if ((data.status == null && req == null))
            u = false;
        //console.log(data.status);
    }


    

    response.json({
        status: "success",
        update: u
    });

    });




//functions

//move requests in DB
function moveFirebaseObject(oldRef, newRef) {//normal function not a firebase function
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { oldRef.remove(); console.log("move successful") }
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}

//copy requests in DB
function copyFirebaseObject(oldRef, newRef) {//normal function not a firebase function
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { console.log("copy successful") }
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}







module.exports = router;
