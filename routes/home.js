// JavaScript source code
const UNITPRICE = 0.37;
const CREDITSCORE = 100;

const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

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

// Function to direct the client to home.html
router.get('/home', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'home.html'));
});

//try to fix any errors in the user's account
router.post('/debugAccount', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user information from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();
    var status = user.status;

    //check if the user is banned, if so, check if 2 days have passed
    if (user.banned != null) {
        if (Date.now() - Date.parse(user.banned.timestamp) >= 172800000) {
            //unban user
            db.ref('users/' + userId).child('banned').remove(); //delete banned from account
            db.ref('users/' + userId).update({ creditScore: 40 }); //update credit score
        }
    }


    //check for errors
    //if user credit score is null
    if (user.creditScore == null) db.ref('users/' + userId).update({ creditScore: CREDITSCORE });

    //if user unit price is null
    if (user.unitPrice == null) db.ref('users/' + userId).update({ unitPrice: UNITPRICE });

    //if user status is null
    if (status == null || status.includes('null')) {
        status = 'Available';
        db.ref('users/' + userId).update({ status: status }); //update status
    }

    //if status is offline
    if (status.includes('Offline')) {
        status = status.substring(status.indexOf('-') + 1); console.log(status);
        db.ref('users/' + userId).update({ status: status }); //update status
    }

    //errors regarding active requests
    if (user.activeRequest != null) {
        //if user has an active request, check if it actually exists
        var snapshot = await db.ref('activeRequests/' + user.activeRequest.dbref + '/' + user.activeRequest.id).once('value');
        if (snapshot.val() == null) { //if request doesn't exist, remove it from the user's account
            db.ref('users/' + userId + '/activeRequest').remove();
            db.ref('users/' + userId).update({ status: 'Available' });
        } else if (status != 'Busy' || status != 'Pay') {//if request exists but user's status is not 'Busy' or 'Pay', change it to 'Busy' or 'Pay'
            if (user.activeRequest.completed == null || user.activeRequest.role == 'provider' )
                db.ref('users/' + userId).update({ status: 'Busy' });
            else db.ref('users/' + userId).update({ status: 'Pay' });
        }
    } else if (status == 'Busy' || status == 'Pay')  //if request doesn't exist but user's status is 'Busy', change status to 'Available'
        db.ref('users/' + userId).update({ status: 'Available' });

    //errors regarding matched requests
    if (user.matchedReq != null) {
        //if user has a matched request, check if it actually exists
        var snapshot = await db.ref('activeRequests/matched/' + user.matchedReq).once('value');
        if (snapshot.val() == null) { //if request doesn't exist, remove it from the user's account
            db.ref('users/' + userId + '/matchedReq').remove();
            db.ref('users/' + userId).update({ status: 'Available' });
        } else if (status != 'matched') //if request exists but user's status is not 'matched', change it to 'matched'
            db.ref('users/' + userId).update({ status: 'matched' });
    } else if (status == 'matched') //if request doesn't exist but user's status is 'matched', change status to 'Available'
        db.ref('users/' + userId).update({ status: 'Available' });

    //if user's current car doesn't exist
    if (user.currentCar != null) { //user has a current car, check if it exists
        if (user.cars == null) db.ref('users/' + userId + '/currentCar').remove(); //user doesn't have any registered cars. remove 'currentCar'
        else if (user.cars[user.currentCar] == null) //if car doesn't exist, remove 'currentCar'
            db.ref('users/' + userId + '/currentCar').remove();
    }

    //set and send response
    response.json({ status: "success" });
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


//get user status and send it to the client
router.post('/getStat', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user information from the database
    var snapshot = await db.ref('users/' + userId).child('status').once('value');
    var status = snapshot.val();

    //send user status to client
    response.json({
        status: "success",
        stat: status
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

//set user status offline
router.post('/setOffline', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //read the current status
    //get user status from the database
    var snapshot = await db.ref('users/' + userId).child('status').once('value');
    var status = snapshot.val();

    //save changes to database
    db.ref('users/' + userId).update({ status: 'Offline-' + status });

    // send response to client
    response.json({
        status: "success",
    });
});

//remove offline from the user's stauts
router.post('/setOnline', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //read the current status
    //get user status from the database
    var snapshot = await db.ref('users/' + userId).child('status').once('value');
    var status = snapshot.val();

    if (status == null || status.includes('null')) status = 'Available';
    else if (status.includes('Offline')) status = status.substring(status.indexOf('-') + 1);
    
    //save changes to database
    db.ref('users/' + userId).update({ status: status });

    // send response to client
    response.json({
        status: "success",
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
    let carsNum = 0; //number of registered cars
    let currentCarFlag = false; //true if user selected a current car
    let car, batteryCapacity, consumption; //store current car info


    if (user.cars != null) {
        carsFlag = true; //user has registered cars
        carsNum = Object.keys(user.cars).length; //number if cars
    }
    if (user.currentCar != null) { //user has a current car
        currentCarFlag = true;
        //get current car
        car = user.cars[currentCar];

        //get technical car info
        var snapshot = await db.ref('carList/' + car.brand + '/' + car.model).once('value');
        batteryCapacity = snapshot.val().batteryCapacity;
        consumption = snapshot.val().avgConsumption;
    }

    //send car to client
    response.json({ status: "success", carsFlag, carsNum, currentCarFlag, car, batteryCapacity, consumption });
});


//get user cards information from the db and send it to the client
router.post('/getCards', async (request, response) => {
    //get client request info
    const userId = request.body.userId;

    //get user cards info from the database
    var snapshot = await db.ref('users/' + userId + '/payment').once('value');
    var cards = snapshot.val();

    // send user cards to client
    response.json({
        status: "success",
        cards: cards
    });
});


// Function to save the user's card information
router.post('/saveCard', async (request, response) => {
    //get information from the client
    const userId = request.body.userId;
    const email = request.body.paypal;

    //add the card information to the database
    await db.ref('users/' + userId + '/payment').push().set({
        email: email
    });

    //send response to client
    response.json({
        status: "success"
    });
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

    if (req != null && req.match != null) {
        var olCoordinates;//coords in openLayers format Long then Lat
        //replace coordinates from MPFile
        fs.readFile('./IOs/MPFile.txt', "utf8", (err, data) => {
            if (err) throw err;
            // break the textblock into an array of lines
            var lines = data.split('\n');
            for (a of lines) {
                if (req.match.location == a.substring(0, 1)) {
                    console.log("iamhere");
                    let sindex = a.lastIndexOf(" ");//find the second's space index
                    let lat = a.substring(2, sindex);
                    let long = a.substring(sindex + 1, a.length);
                    olCoordinates = [long, lat];
                    req.match.location = olCoordinates;

                    //send request information to client
                    response.json({
                        status: "success",
                        req: req
                    });
                }
            }

        });
        
    } else {
        //send request information to client
        response.json({
            status: "success",
            req: req
        });
    }

  
});



//cancel an active request 
//if the person canceling is the requester, the request will have to be completely removed from activeRequests
//if the person canceling is the provider, the request will have to be moved back to 'activeRequests/issued'
router.post('/cancelRequest', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const userIsRequester = request.body.userIsRequester; //true if user is requester
    const requestId = request.body.requestRef.id; //request ID
    var snapshot = await db.ref('users/' + userId + '/activeRequest').once('value');
    var reqStatus = snapshot.val();
    var requestStatus = reqStatus.dbref;//request status (also dbref)
    var snapshot = await db.ref('activeRequests/' + requestStatus + '/' + requestId).once('value');
    var req = snapshot.val();//request information


    var wait = false;
    var check = false;
    var allowed = false;
    var interval = setInterval(async () => {
        if (!allowed) {
            //check if the user data is changed in helper.js
            fs.readFile('cancelQueue.txt', "utf8", (err, data) => {

                if (err) throw err;
                // break the textblock into an array of lines
                var lines = data.split('\n');
                for (i = 0; i < lines.length; i++) {
                    //if user is not there
                    if (lines[i] != userId) {
                        check = false;
                    }
                    else {//if user is there
                        wait = true;
                        check = true;
                        break;
                    }
                }
                allowed = !(check);
            });
        }
        if (allowed) {
            //to excute this block once
            clearInterval(interval);

            //indicate user data will be changed (for helper.js)
            fs.writeFileSync('./cancelQueue.txt', userId);

            //if have waited once, must update the requet information
            if (wait) {
                //check request again
                var snapshot = await db.ref('users/' + userId + '/activeRequest').once('value');
                var reqStatus = snapshot.val();
                requestStatus = reqStatus.dbref;
                var snapshot = await db.ref('activeRequests/' + requestStatus + '/' + requestId).once('value');
                req = snapshot.val();

            }

            var newRef = db.ref('previousRequests/' + userId + '/' + requestId); //path to move the request to the user's history
            var newRef2, user2Id; //get user ID and the request's path for the second user
            if (requestStatus != 'issued') { //get second user's info
                userIsRequester ? user2Id = req.match.provider : user2Id = req.requester.uid; //get the second user's ID
                newRef2 = db.ref('previousRequests/' + user2Id + '/' + requestId); //path to move the request to the second user's history

                //save message for other user to see
                if (userIsRequester && requestStatus != 'matched') db.ref('users/' + user2Id).update({ message: "Oh no!<br />It seems like the request was cancelled.<br />We're very sorry." });
                else db.ref('users/' + user2Id).update({ message: "Oh no!<br />It seems like the provider cancelled.<br />Please wait until we find a new match." });
            }

            //clear request information from the user's account
            if(requestStatus == 'accepted') db.ref('users/' + userId + '/previousCompleted').remove();
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

            fs.writeFileSync('./cancelQueue.txt', '');

            //send response to client
            response.json({
                status: "success",
            });
        }

    }, 500);
});

//get user status and send it to the client
router.post('/deleteMessage', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //delete the message from the user's account
    db.ref('users/' + userId + '/message').remove();

    //send user status to client
    response.json({
        status: "success",
    });
});

//update user sCS
router.post('/creditScore', (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const creditScore = request.body.creditScore; //user status
    const tim = request.body.reqStart;

    //save changes to database
    db.ref('users/' + userId).update({ creditScore: creditScore });

    if (creditScore == 0) {
        db.ref('users/' + userId).child('banned').set({ timestamp: tim }); //save request info under user information
    }

    // send response to client
    response.json({
        status: "success"
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
    const car = request.body.car;

    //check if request exists
    //get request information from the database
    var snapshot = await db.ref("activeRequests/matched/" + requestId).once('value');
    var req = snapshot.val();
    if (req == null || req.requester == null) return; //if request doesn't exist leave the function


    //accept request

    var oldRef = db.ref("activeRequests/matched/" + requestId); //the request's current path

    //add the provider's paypal to the request
    oldRef.child('match').update({ paypal: paypal, car: car });

        //move request from 'activeRequests/matched' to 'activeRequests/pending'
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
            body: 'Provider: ' + request.body.userId
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
    const userIsRequester = request.body.userIsRequester; //true if the user is the requester
    const requestId = request.body.requestId; //request ID

    //updated the user's activeRequest to note this change
    db.ref('users/' + userId).child("activeRequest").update({ completed: "true" });

    //check if the second user clicked the 'done' button
    var snapshot = await db.ref('users/' + user2Id + '/activeRequest').once('value'); //get user 2 activeRequest info

    if (snapshot.val().completed != null) { //both users clicked 'done'
        //both users pressed 'done', copy request to the provider's history
        let providerId, requesterId;
        userIsRequester ? (requesterId = userId, providerId = user2Id) : (requesterId = user2Id, providerId = userId)

        //update request status to 'completed'
        var oldRef = db.ref('activeRequests/completed/' + requestId); //path to request
        oldRef.update({ 'status': "completed" }); //request was completed


        //add request to the provider's history
        var newRef = db.ref('previousRequests/' + providerId + '/' + requestId);
        copyFirebaseObject(oldRef, newRef); //copy request to user 1 previousRequests

        //clear request from the provider's account
        db.ref('users/' + providerId + '/activeRequest').remove();//delete from the other user
        db.ref('users/' + providerId).update({ status: 'Available' }); //set status to available

        //change consumer's status to pay
        db.ref('users/' + requesterId).update({ status: 'Pay' }); //set status to available

    } else { //second user still didn't click 'done'
        //move request from 'activeRequests/accepted' to 'activeRequests/completed'
        var oldRef = db.ref('activeRequests/accepted/' + requestId); //current path
        var newRef = db.ref('activeRequests/completed/' + requestId); //desired path
        moveFirebaseObject(oldRef, newRef);

        //change dbref for both users
        db.ref('users/' + userId).child("activeRequest").update({ dbref: "completed" });
        db.ref('users/' + user2Id).child("activeRequest").update({ dbref: "completed" });
    }

    if (!userIsRequester) 
        requestCompleted(userId);
    

    //send response to client
    response.json({
        status: "success",
    });

});

//user completed a request, increase the credit score
async function requestCompleted(userId) {
    var snapshot = await db.ref('users/' + userId).once('value');
    const user = snapshot.val();

    if (user.creditScore != 100 && user.creditScore != 0) {
        if (user.previousCompleted == null) db.ref('users/' + userId).update({ previousCompleted: 'true' }); //set status to available
        else {
            db.ref('users/' + userId).update({ creditScore: user.creditScore + 20 });
            db.ref('users/' + userId).child('previousCompleted').remove();
        }
    }
}

//temperory payment function (for testing purposes)
router.post('/tempPay', async (request, response) => {
    //get client request info
    const userId = request.body.userId;
    const requestId = request.body.requestId;

    //move request to the consumer's history
    //update request status to 'completed'
    var oldRef = db.ref('activeRequests/completed/' + requestId); //path to request
    var newRef = db.ref('previousRequests/' + userId + '/' + requestId);
    moveFirebaseObject(oldRef, newRef); //copy request to user 1 previousRequests

    //clear request from the consumer's account
    db.ref('users/' + userId + '/activeRequest').remove();//delete from the other user
    db.ref('users/' + userId).update({ status: 'Available' }); //set status to available

    //requester completed a request
    requestCompleted(userId);

    //user response
    response.json({
        status: "success",
    });
});


router.post('/pay', async (request, response) => {                                                                                      ///////////////////////////////////////////////////////???????
    //get client request info
    const userId = request.body.userId;
    const requestId = request.body.requestId;
    const match = request.body.match; //match info

    var interval;

    var price = (match.estAmount * 0.27).toFixed(2);
    var paypalEmail = match.paypal;

    console.log("price: " + price);
    console.log("paypal info: " + paypalEmail);

    //paypal checkout sdk

    // Construct a request object and set desired parameters
    // Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
    let paypalrequest = new paypal.orders.OrdersCreateRequest();
    paypalrequest.requestBody({
        "intent": "CAPTURE",
        "application_context": {
            "return_url": "https://https://v2v-charge.herokuapp.com/home",
            "cancel_url": "https://https://v2v-charge.herokuapp.com/account"
        },
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD",
                    "value": price
                },
                "payee": {
                    "email_address": paypalEmail //email_address   uinfo.paypal   mobile_number phone_number
                }
            }
        ]
    });

    let captureOrder = async function (orderId) {
        request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        // Call API with your client and get a response for your call
        let response = await client.execute(request);
        if (response.result.status == "COMPLETED") {
            //move request to the consumer's history
            var oldRef = db.ref('activeRequests/completed/' + requestId); //path to request
            var newRef = db.ref('previousRequests/' + userId + '/' + requestId);
            moveFirebaseObject(oldRef, newRef); //copy request to user 1 previousRequests

            //clear request from the consumer's account
            db.ref('users/' + userId + '/activeRequest').remove();//delete from the other user
            db.ref('users/' + userId).update({ status: 'Available' }); //set status to available

            //requester completed a request
            requestCompleted(userId);

            clearInterval(interval);//exit the interval

            response.json({
                status: "success",
            });
        }

        console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Capture: ${JSON.stringify(response.result)}`);

        //if user status is not 'Pay' that means that the user clicked the fake pay button. Clear interval and leave this function
        var snapshot = await db.ref('users/' + userId).child('status').once('value');
        var status = snapshot.val();
        if (status != 'Pay') {
            clearInterval(interval);//exit the interval
            response.json({
                status: "success",
            });
        }
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
                        console.log(paypalresponse.result.id);
                    } catch (e) {
                        //console.log(e)
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








const periodic = new Worker("./manager.js");

module.exports = router;
