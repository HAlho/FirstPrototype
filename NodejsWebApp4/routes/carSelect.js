// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

//database reference
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

//function to direct the client to carSelect.html
router.get('/carSelect', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'carSelect.html'));
});


//function to get user cars and send them to the client
router.post('/getCars', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user cars from the database
    var snapshot = await db.ref('users/' + userId + '/cars').once('value');
    var cars = snapshot.val();

    //send user cars to client
    response.json({
        status: "success",
        cars: cars
    });
});

//function to save current car
router.post('/saveCurrentCar', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const carId = request.body.carId; //car ID

    //get user info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    if (user.currentCar != carId) { //car was changed

        //if the user was matched to a request, changing the car could cause problems because the algorithm's did not consider this change. The request has to be moved back to issued requests
        //check if the user is matched
        if (user.status == 'matched') {
            //get request information
            const requestId = user.matchedReq;
            var snapshot = await db.ref('activeRequests/matched/' + requestId).once('value'); //get request information from the database
            var req = snapshot.val();

            //move request back to activeRequests/issued
            oldRef = db.ref('activeRequests/matched/' + requestId); 
            newRef = db.ref('activeRequests/issued/' + requestId);
            moveFirebaseObject(oldRef, newRef); //move request

            //update active request info of the consumer
            db.ref('users/' + req.requester.uid + '/activeRequest').update({ dbref: 'issued' });

            //remove active request info from the provider
            db.ref('users/' + userId + '/matchedReq').remove();
            db.ref('users/' + userId).update({ status: "Available" });

            newRef.child('match').remove(); //remove match from request;
        }

        //save current car in the database
        db.ref('users/' + userId).update({ currentCar: carId });
    }

    //send response to client
    response.json({
        status: "success"
    });
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

module.exports = router;
