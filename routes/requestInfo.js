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

    //get the user's reports
    var reportsSnap = await db.ref('users/' + userId).child('reports').once('value');
    var reports = reportsSnap.val();

    //get the user's previous requests
    var historySnap = await db.ref('previousRequests/' + userId).once('value');
    var history = historySnap.val();

    //get the user's email and add it to banned emails
    let email;
    admin.auth().getUser(userId).then((userRecord) => {
        email = userRecord.toJSON().email;
        db.ref('bannedAccounts').push().set({ email: email, reports: reports, history: history });
    }).catch((error) => { console.log('Error fetching user data:', error); });


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

//function to delete user info from the database
async function deleteUserInfo(userId) {
    //get user info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var userInfo = snapshot.val();

    //if user has an active request, get request information
    let role, dbref, requestId, oldRef, req, user2Id;
    if (userInfo.status != 'Available' && userInfo.status != 'Do Not Disturb') { //user has an active request

        //get the reqeust's meta data to get the request's path
        if (userInfo.status == 'matched') {
            role = 'provider'; //the user's role in the request            
            dbref = 'matched'; //the directory the request is in
            requestId = userInfo.matchedReq; // the request's ID
        } else {
            role = userInfo.activeRequest.role; //the user's role in the request
            dbref = userInfo.activeRequest.dbref; //the directory the request is in
            requestId = userInfo.activeRequest.id;// the request's ID
        }

        //the request's current path
        oldRef = db.ref('activeRequests/' + dbref + '/' + requestId);


        //get the second user's ID
        if (dbref != 'issued') {
            let snapshot = await oldRef.once('value'); //read the request from the database
            req = snapshot.val(); //request info
            role == 'requester' ? user2Id = req.match.provider : user2Id = req.requester.uid; //get the second user's ID
        }
    }


    //user has an active request, cancel the request
    if (userInfo.status == "Busy") {
        //if the user is a requester,  delete the request completely. otherwise, just move the request back to issued
        if (role == 'requester') { //the user is a requester, move the request to the provider's history
            if (dbref == 'issued') {
                oldRef.remove(); //remove request from its old path
            } else if (dbref == 'matched') {
                db.ref('users/' + user2Id).child('matchedReq').remove();
                db.ref('users/' + user2Id).update({ status: "Available" });
                oldRef.remove(); //remove request from its old path
            }
            else {
                db.ref('users/' + user2Id + '/activeRequest').remove();
                db.ref('users/' + user2Id).update({ status: "Available" });
                db.ref('users/' + user2Id).child('messages').push().set({ message: "<b>Request was canceled</b><br><br>Oh no! It seems like the request was removed.<br />We're very sorry." });

                //move the request to the provider's history
                let newRef = db.ref('previousRequests/' + user2Id + '/' + requestId); //destination path
                oldRef.update({ status: 'canceled' });
                moveFirebaseObject(oldRef, newRef);
            }

        } else { //the user is a provider, move the request back to 'activeRequests/issued'
            let newRef = db.ref('activeRequests/issued/' + requestId); //destination path
            moveFirebaseObject(oldRef, newRef);
            newRef.child('match').remove(); //remove match from the request
            db.ref('users/' + user2Id + '/activeRequest').update({ dbref: 'issued' }); //change the dbref in the user's account
            db.ref('users/' + user2Id).child('messages').push().set({ message: "<b>Request was canceled</b><br><br>Oh no! We have lost the provider.<br />Please wait while we find a new match." });
        }
    } else if (userInfo.status == 'matched') { //user got matched to a request, move request back to issued
        let newRef = db.ref('activeRequests/issued/' + requestId); //destination path
        moveFirebaseObject(oldRef, newRef);
        newRef.child('match').remove(); //remove match from the request
        db.ref('users/' + user2Id + '/activeRequest').update({ dbref: 'issued' }); //change the dbref in the user's account
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



module.exports = router;
