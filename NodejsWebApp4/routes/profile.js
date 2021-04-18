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

router.get('/profile', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'profile.html'));
});


//try to fix any errors in the user's account
router.post('/debugAccount', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user information from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    //check for errors

    //errors regarding active requests
    if (user.activeRequest != null) {
        //if user has an active request, check if it actually exists
        var snapshot = await db.ref('activeRequests/' + user.activeRequest.dbref + '/' + user.activeRequest.id).once('value');
        if (snapshot.val() == null) { //if request doesn't exist, remove it from the user's account
            db.ref('users/' + userId + '/activeRequest').remove();
            db.ref('users/' + userId).update({ status: 'Available' });
        } else if (user.status != 'Busy') //if request exists but user's status is not 'Busy', change it to 'Busy'
            db.ref('users/' + userId).update({ status: 'Busy' });
    } else if (user.status == 'Busy')  //if request doesn't exist but user's status is 'Busy', change status to 'Available'
        db.ref('users/' + userId).update({ status: 'Available' });

    //errors regarding matched requests
    if (user.matchedReq != null) {
        //if user has a matched request, check if it actually exists
        var snapshot = await db.ref('activeRequests/matched/' + user.matchedReq).once('value');
        if (snapshot.val() == null) { //if request doesn't exist, remove it from the user's account
            db.ref('users/' + userId + '/matchedReq').remove();
            db.ref('users/' + userId).update({ status: 'Available' });
        } else if (user.status != 'matched') //if request exists but user's status is not 'matched', change it to 'matched'
            db.ref('users/' + userId).update({ status: 'matched' });
    } else if (user.status == 'matched') //if request doesn't exist but user's status is 'matched', change status to 'Available'
        db.ref('users/' + userId).update({ status: 'Available' });

    //if user's current car doesn't exist
    if (user.currentCar != null) { //user has a current car, check if it exists
        if (user.cars[user.currentCar] == null) //if car doesn't exist, remove 'currentCar'
            db.ref('users/' + userId + '/currentCar').remove();
    }

    //if user status is null
    if (user.status == null) db.ref('users/' + userId).update({ status: 'Available' });

    //if user credit score is null
    if (user.creditScore == null) db.ref('users/' + userId).update({ creditScore: 100 });

    //if user unit price is null
    if (user.unitPrice == null) db.ref('users/' + userId).update({ unitPrice: 0.37 });


    //set and send response
    response.json({
        status: "success"
    });
});


//get user status and send it to the client
router.post('/getStat', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user information from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    //send user status to client
    response.json({
        status: "success",
        stat: user.status
    });
});

//update user status
router.post('/setStat', (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const stat = request.body.status; //user status

    //save changes to database
    db.ref('users/' + userId).update({ status: stat });

    // send response to client
    response.json({
        status: "success",
    });
});


//get user information from the db and send it to the client
router.post('/getUser', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    //send user information to client
    response.json({
        status: "success",
        user: user
    });
});


//get the user's current car information and send it to client
router.post('/getCurrentCar', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user's info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();
    var currentCar = user.currentCar;

    let carsFlag = false; //true if user has registered cars
    let currentCarFlag = false; //true if user selected a current car
    let car, batteryCapacity, consumption; //store current car info

    if (user.cars != null) carsFlag = true; //user has registered cars
    if (user.currentCar != null) { //user has a current car
        currentCarFlag = true;
        //get current car
        car = user.cars[currentCar]; 

        //get technical car info
        var snapshot = await db.ref('carList/' + car.brand + '/' + car.model).once('value'); 
        batteryCapacity = snapshot.val().batteryCapacity;
        consumption = snapshot.val().consumption;
    }

    //send car to client
    response.json({ status: "success", carsFlag, currentCarFlag, car, batteryCapacity, consumption });
});


router.post('/addToken', async (request, response) => {                                                             ///////////////////////////////////////////////////////???????
    //get client request info
    const userId = request.body.userId; //user ID
    const token = request.body.token; //user token

    //add token to the database
    db.ref('/tokens').push({
        token: token,
        uid: userId
    });

    //send response to client
    response.json({
        status: "success",
    });
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

//get the user's active request information
router.post('/getActiveRequest', async (request, response) => {
    //get client request info
    const requestId = request.body.requestId; //request ID
    const dbref = request.body.dbref; //the directory the request is in (activeRequests/dbref/requestId) 

    //get request information from the database
    var snapshot = await db.ref('activeRequests/' + dbref + '/' + requestId).once('value');
    var req = snapshot.val();

    //send request information to client
    response.json({
        status: "success",
        req: req
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


//cancel an active request 
    //if the person canceling is the requester, the request will have to be completely removed from activeRequests
    //if the person canceling is the provider, the request will have to be moved back to 'activeRequests/issued'
router.post('/cancelRequest', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const userIsRequester = request.body.userIsRequester; //true if user is requester
    const requestStatus = request.body.requestRef.dbref; //request status (also dbref)
    const requestId = request.body.requestRef.id; //request ID
    const req = request.body.req; //request information

    var newRef = db.ref('previousRequests/' + userId + '/' + requestId); //path to move the request to the user's history
    var newRef2, user2Id; //get user ID and the request's path for the second user
    if (requestStatus != 'issued' && requestStatus != 'matched') { //get second user's info
        userIsRequester ? user2Id = req.match.provider : user2Id = req.requester.uid; //get the second user's ID
        newRef2 = db.ref('previousRequests/' + user2Id + '/' + requestId); //path to move the request to the second user's history
    }

    //clear request information from the user's account
    db.ref('users/' + userId + '/activeRequest').remove();
    db.ref('users/' + userId).update({ status: "Available" });

    //get the request's path for the user
    var oldRef;
    switch (requestStatus) { //get the request's path (activeRequests/dbref/requestID) and clear second user's account if needed
        case 'issued':
            oldRef = db.ref('activeRequests/issued/' + requestId); //get the request's path
            break;
        case 'matched':
            if (userIsRequester) { //if requester cancelled the request, clear request information from the provider's account
                db.ref('users/' + user2Id + '/matchedReq').remove();
                db.ref('users/' + user2Id).update({ status: "Available" });
            }
            oldRef = db.ref('activeRequests/matched/' + requestId); //get the request's path
            break;
        case 'pending':
            if (userIsRequester) { //if requester cancelled the request, clear request information from the provider's account
                db.ref('users/' + user2Id + '/activeRequest').remove();
                db.ref('users/' + user2Id).update({ status: "Available" });
            }
            oldRef = db.ref('activeRequests/pending/' + requestId); //get the request's path
            break;
        case 'accepted':
            if (userIsRequester) { //if requester cancelled the request, clear request information from the provider's account
                db.ref('users/' + user2Id + '/activeRequest').remove();
                db.ref('users/' + user2Id).update({ status: "Available" });
            } 
            oldRef = db.ref('activeRequests/accepted/' + requestId); //get the request's path
            break;
        case 'completed':
            if (userIsRequester) { //if requester cancelled the request, clear request information from the provider's account
                db.ref('users/' + user2Id + '/activeRequest').remove();
                db.ref('users/' + user2Id).update({ status: "Available" });
            }
            oldRef = db.ref('activeRequests/completed/' + requestId); //get the request's path
            break;
    }


    //move request to the user(s) history 
    if (userIsRequester) { //user is the requester
        oldRef.update({ 'status': "canceled" }); //change status to canceled

        //copy request to provider's history
        if (requestStatus != 'issued' && requestStatus != 'matched')
            copyFirebaseObject(oldRef, newRef2);

        //copy request to consumer's history then delete if from active requests
        moveFirebaseObject(oldRef, newRef);
    } else { //user is the provider
        //copy request information to the provider's history
        copyFirebaseObject(oldRef, newRef);
        newRef.update({ 'status': "canceled" });

        //remove the provider from the request then  move the request back to activeRequests/issued
        oldRef.child('match').remove();
        issuedRef = db.ref('activeRequests/issued/' + requestId);
        moveFirebaseObject(oldRef, issuedRef);

        //update active request info of the consumer
        db.ref('users/' + user2Id + '/activeRequest').update({ dbref: "issued" });
    }

    //send response to client
    response.json({
        status: "success",
    });
});


//function for providers to decline a charge request when matched
router.post('/declineRequest', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const requestId = request.body.requestId; //request ID
    const req = request.body.req; //request information

    //move request back to activeRequests/issued
    //old and new paths to request
    oldRef = db.ref('activeRequests/matched/' + requestId);
    newRef = db.ref('activeRequests/issued/' + requestId);

    //move request
    moveFirebaseObject(oldRef, newRef);

    //remove match from request
    oldRef.child('match').remove();

    //update active request info of the consumer
    db.ref('users/' + req.requester.uid + '/activeRequest').update({ dbref: 'issued' });

    //remove active request info from the provider
    db.ref('users/' + userId + '/matchedReq').remove();
    db.ref('users/' + userId).update({ status: "Available" });

    //send response to client
    response.json({
        status: "success"
    });
});


//function for providers to accept a charge request when matched
router.post('/matchAccept', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID (user is the provider)
    const requesterId = request.body.reqId; //other user ID (the consumer)
    const requestId = request.body.requestId; //request ID
    const paypal = request.body.paypal; //user's paypal

    //move request from 'activeRequests/matched' to 'activeRequests/pending'
    var oldRef = db.ref("activeRequests/matched/" + requestId);
    var newRef = db.ref("activeRequests/pending/" + requestId);
    moveFirebaseObject(oldRef, newRef);

    //set the provider's activeRequest info in the database and update status
    db.ref('users/' + userId).child("activeRequest").set({ id: requestId, dbref: 'pending', role: 'provider', paypal: paypal });
    db.ref('users/' + userId).update({ status: "Busy" }); //update user status
    db.ref('users/' + userId + '/matchedReq').remove();

    //update request info under requester's user info
    db.ref('users/' + requesterId).child("activeRequest").update({ dbref: 'pending' });


    //get user's token                                                                                                  ///////////////////////////////////////////////////////???????
    snapshot = await db.ref('tokens').once('value');
    const t = snapshot.val();
    var keys = Object.keys(t); //ids of the tokens
    var k;
    var id;
    var registrationToken;
    console.log("keys: " + keys);
    for (i = 0; i < keys.length; i++) {//also check the user status
        k = keys[i];
        console.log("key: " + keys[i]);
        id = t[k].uid;
        if (id == requesterId) {
            registrationToken = t[k].token;
            break;
        }
    }

    var payload = {
        notification: {
            title: 'Your request has been accepted',
            body: 'Provider: ' + data.userId
        }
    };

    admin.messaging().sendToDevice(registrationToken, payload)
        .then(function (response) {
            console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });




    //send response to client
    response.json({
        status: "success"
    });
});


//function for consumers to accept a request match
router.post('/consumerMatchAccept', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID (user is the consumer)
    const user2Id = request.body.user2Id; //other user ID (the provider)
    const requestId = request.body.requestId; //request ID

    //Move request from 'activeRequests/pending' to 'activeRequests/accepted'
    var oldRef = db.ref("activeRequests/pending/" + requestId); //path to request
    var newRef = db.ref("activeRequests/accepted/" + requestId); //desired path to request
    moveFirebaseObject(oldRef, newRef); //move request to new path

    //update request status for both users
    await db.ref('users/' + userId + '/activeRequest').update({ dbref: "accepted" });
    await db.ref('users/' + user2Id + '/activeRequest').update({ dbref: "accepted" });

    //send response to client
    response.json({
        status: "success"
    });
});


//function for when users are done with a request
//when the first user clicks the 'done' button, the request is moved from 'activeRequests/accepted' to 'activeRequests/completed'
//when the second user clicks the 'done' button, the request is removed from the activeRequests directory and copied to both users previous requests
router.post('/requestComplete', async (request, response) => { 
    //get client request info
    const userId = request.body.userId; //user ID
    const user2Id = request.body.user2Id; //second user's ID 
    const requestId = request.body.requestId; //request ID

    //check if the second user clicked the 'done' button
    var snapshot = await db.ref('users/' + user2Id + '/activeRequest').once('value'); //get user 2 activeRequest info

    if (snapshot.val().completed != null) { //second user clicked 'done'
        //both users pressed 'done', remove request from activeRequests directory
        var oldRef = db.ref('activeRequests/completed/' + requestId); //path to request
        oldRef.update({ 'status': "completed" }); //request was completed

        //get paths to both users' previousRequests directory then move request info there
        var newRef1 = db.ref('previousRequests/' + userId + '/' + requestId);
        var newRef2 = db.ref('previousRequests/' + user2Id + '/' + requestId);
        copyFirebaseObject(oldRef, newRef1); //copy request to user 1 previousRequests
        moveFirebaseObject(oldRef, newRef2); //copy request to user 2 previousRequests  then remove it from activeRequests

        //update users' information
        db.ref('users/' + data.userId + '/activeRequest').remove();//delete from the current user
        db.ref('users/' + data.user2Id + '/activeRequest').remove();//delete from the other user
        db.ref('users/' + userId).update({ status: 'Available' }); //set status to available
        db.ref('users/' + user2Id).update({ status: 'Available' }); //set status to available

    } else { //second user still didn't click 'done'
        //move request from 'activeRequests/accepted' to 'activeRequests/completed'
        var oldRef = db.ref('activeRequests/accepted/' + requestId); //current path
        var newRef = db.ref('activeRequests/completed/' + requestId); //desired path
        moveFirebaseObject(oldRef, newRef);

        //updated the user's activeRequest to note this change
        db.ref('users/' + userId).child("activeRequest").update({ completed: "true" });

        //change dbref for both users
        db.ref('users/' + userId).child("activeRequest").update({ dbref: "completed" });
        db.ref('users/' + user2Id).child("activeRequest").update({ dbref: "completed" });
    }

    //send response to client
    response.json({
        status: "success",
    });

});




router.post('/pay', async (request, response) => {                                                                                      ///////////////////////////////////////////////////////???????
    //get client request info
    const match = request.body.match; //match info

    var interval;

    var price = (match.estAmount * 0.27).toFixed(2);
    snapshot = await db.ref('users/' + match.provider + '/activeRequest').once('value');
    var provider = snapshot.val();

    console.log("price: " + price);
    console.log("paypal info: " + provider.paypal);

    //paypal checkout sdk

    // Construct a request object and set desired parameters
    // Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
    let paypalrequest = new paypal.orders.OrdersCreateRequest();
    paypalrequest.requestBody({
        "intent": "CAPTURE",
        "application_context": {
            "return_url": "https://192.168.0.123:3000/profile",
            "cancel_url": "https://192.168.0.123:3000/account"
        },
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD",
                    "value": price
                },
                "payee": {
                    "email_address": provider.paypal //email_address   uinfo.paypal   mobile_number phone_number
                }
            }
        ]
    });

    let captureOrder = async function (orderId) {
        request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        // Call API with your client and get a response for your call
        let response = await client.execute(request);
        if (response.result.status == "COMPLETED")
            clearInterval(interval);//exit the interval
        console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Capture: ${JSON.stringify(response.result)}`);
    }

    let createOrder = async function () {
        let paypalresponse = await client.execute(paypalrequest);
        //console.log(`Response: ${JSON.stringify(paypalresponse)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Order: ${JSON.stringify(paypalresponse.result)}`);
        for (let i = 0; i < paypalresponse.result.links.length; i++) {
            if (paypalresponse.result.links[i].rel === 'approve') {
                //response.redirect(paypalresponse.result.links[i].href);
                response.json({ forwardLink: paypalresponse.result.links[i].href });


                interval = setInterval(() => {
                    try {
                        captureOrder(paypalresponse.result.id); //'REPLACE-WITH-APPROVED-ORDER-ID'

                    } catch (e) {
                        console.log(e)
                    }

                }, 30000)//1.5min
            }
        }
    }
    createOrder();
});






//functions

//move an object to a new path in the database
function moveFirebaseObject(oldRef, newRef) {
    //oldRef is the current path to the object
    //newRef is the desired path
    //copy an object to the desired path then delete it from its current path
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { oldRef.remove(); } //remove item from its current path
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); } //error copying item
        });
    });
}

//copy an object in the database
function copyFirebaseObject(oldRef, newRef) {
    //oldRef is the current path to the object
    //newRef is the desired path
    //copy an object to the desired path
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (error && (typeof (console) !== 'undefined' && console.error)) { console.error(error); } //error copying item
        });
    });
}


const periodic = new Worker("./manager.js");                                                                    ///////////////////////////////////////////////////////???????       variable is not used/ delete?                                                    

module.exports = router;
