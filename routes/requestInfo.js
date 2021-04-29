// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');


// Database reference
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

// Function to direct the client to requestInfo.html
router.get('/requestInfo', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'requestInfo.html'));
});

// Function to get user history and send it to the client
router.post('/getRequest', async (request, response) => { 
    // Get client request info
    const data = request.body;

    // Get request info from the database
    var snapshot = await db.ref('previousRequests/' + data.userId + '/' + data.requestId).once('value');
    var request = snapshot.val();

    // Sending back requested history information to the client
    response.json({
        status: "success",
        request: request
    });
});

// Function to report a user
router.post('/reportUser', async (request, response) => {
    // Get client request info
    const userId = request.body.userId;
    const requestId = request.body.requestId;
    const reason = request.body.reason;

    //save changes to database
    db.ref('previousRequests/' + userId + '/' + requestId).update({ report: reason });

    //get the other user's ID
    var snapshot = await db.ref('previousRequests/' + userId + '/' + requestId).once('value');
    var request = snapshot.val();
    let user2Id;
    request.requester.uid == userId ? user2Id = request.match.provider : user2Id = request.requester.uid;

    //increment number of reports
    var reportsSnapshot = await db.ref('users/' + user2Id).child('reports').once('value');
    var reports = reportsSnapshot.val();
    if (reports == null) db.ref('users/' + user2Id).child('reports').set({ count: 1 });
    else {
        if (reports.count == 4) banUser(user2Id);//user already got reported 4 times, ban user
        else db.ref('users/' + user2Id).child('reports').update({ count: reports.count+1 });
    }
    //save report in the other user's account
    db.ref('users/' + user2Id).child('reports').push().set({ reason: reason });


    // Sending back requested history information to the client
    response.json({
        status: "success"
    });
});

async function banUser(userId) {
    //get the user's email and add it to banned emails

    //delete user
    admin.auth().deleteUser(userId).then(() => {
        deleteUserInfo(userId); //delete user info from the database
        //send response to client
        response.json({
            status: "success"
        });
    }).catch((error) => {
        console.log('Error deleting user:', error);
    });
}



//function to delete user
router.post('/deleteUser', async (request, response) => {
    //get client request info
    const userId = request.body.userId;

    //delete user
    admin.auth().deleteUser(userId).then(() => {
        deleteUserInfo(userId); //delete user info from the database
        //send response to client
        response.json({
            status: "success"
        });
    }).catch((error) => {
        console.log('Error deleting user:', error);
    });
});

//function to delete user info from the database
async function deleteUserInfo(userId) {
    //get user info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var userInfo = snapshot.val();


    //if user has an active request
    // get request information
    let role, dbref, requestId, oldRef, req, user2Id;
    if (userInfo.status != 'Available' && userInfo.status != 'Do Not Disturb') {
        role = userInfo.activeRequest.role; //the user's role in the request

        //get request dir info
        dbref = userInfo.activeRequest.dbref;
        requestId = userInfo.activeRequest.id;
        oldRef = db.ref('activeRequests/' + dbref + '/' + requestId); //the request's current path

        if (dbref != 'issued') { //get request information to get the second user ID
            let snapshot = await db.ref('activeRequests/' + dbref + '/' + requestId).once('value');
            req = snapshot.val();
            role == 'requester' ? user2Id = req.match.provider : user2Id = req.requester.uid;
        }
    }

    // delete active request
    if (userInfo.status == "Busy") {
        if (dbref != 'issued') {
            //if the user is a requester,  delete the request completely. otherwise the user is a provider, just move the request back to issued
            if (role == 'requester') { //the user is a requester, completely delete the request
                //clear request information from the provider's account
                if (dbref != 'matched') {
                    db.ref('users/' + providerId + '/activeRequest').remove();
                    db.ref('users/' + providerId).update({ status: "Available" });
                } else {
                    db.ref('users/' + providerId).child('matchedReq').remove();
                    db.ref('users/' + providerId).update({ status: "Available" });
                }

                //copy the request to the provider's history
                if (dbref != 'issued' && dbref != 'matched') {
                    let newRef = db.ref('previousRequests/' + providerId + '/' + requestId); //destination path
                    copyFirebaseObject(oldRef, newRef);
                }

            } else { //the user is a provider, move the request back to 'activeRequests/issued'
                oldRef.child('match').remove; //remove match from the request

                //move the request back to issued
                let newRef = db.ref('activeRequests/issued/' + requestId); //destination path
                copyFirebaseObject(oldRef, newRef);

                db.ref('users/' + providerId + '/activeRequest').update({ dbref: 'issued' }); //change the dbref in the user's account
            }
        }

        //delete request from its current path in activeRequests directory
        oldRef.remove();

    } else if (userInfo.status == 'matched') { //user got matched to a request, move request back to issued
        let newRef = db.ref('activeRequests/issued/' + requestId); //destination path
        moveFirebaseObject(oldRef, newRef);
    } else if (userInfo.status == 'Pay') { //user still did not pay
        oldRef.remove();
    }



    //delete any notification tokens for this specific user
    //get tokens from the database
    var snapshot = await db.ref('tokens').once('value');
    var tokens = snapshot.val();
    if (tokens != null) {//if there are tokens
        var keys = Object.keys(tokens);
        for (var i = 0; i < keys.length; i++) { //check each token's user id
            var k = keys[i];
            if (userId == tokens[k].uid) //if IDs match, delete token
                await db.ref('tokens/' + k).remove();
        }
    }



    //delete all of the user's previous requests
    await db.ref('previousRequests/' + userId).remove();

    //delete user information
    await db.ref('users/' + userId).remove();
}



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

module.exports = router;
