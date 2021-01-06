const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/avaReq', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'avaReq.html'));
});

router.get('/getReq', async (request, response) => { //add to recieve that post(endpoint)

    var snapshot = await db.ref('activeRequests/issued').once('value');
    var Req = snapshot.val();
    
    console.log(Req);

    response.json({
        status: "success",
        Req: Req
    });

});

router.post('/check', async (request, response) => { //add to recieve that post(endpoint)
    console.log('CHECK!');

    const data = request.body;
    var canAccept = true;
    var snapshot = await db.ref('users/' + data.userId + '/activeRequest').once('value');
    if (snapshot.exists()) canAccept = false;

    response.json({
        status: "success",
        canAccept: canAccept
    });

});

router.post('/change', async (request, response) => { //add to recieve that post(endpoint)
    console.log('CHANGE INFO!');

    const data = request.body;

    //Store request info under supplier's user info
    db.ref('users/' + data.userId).child("activeRequest").set({ id: data.index, dbref: "accepted", role: "supplier" });
    //Update request info under requester's user info
    db.ref('users/' + data.reqId).child("activeRequest").update({ dbref: "accepted" });

    //Move request from issued to accepted
   
    db.ref('activeRequests/accepted').child(data.index).set({
        amount: data.amount,
        requester: data.reqInfo,
        supplier: {
            uid: data.userId
        },
        timestamp: data.reqAccepted
    });
    db.ref('activeRequests/issued/' + data.index).remove();

    var snapshot = await db.ref('activeRequests/accepted/' + data.index + '/requester').once('value');//get requester's id
    const req = snapshot.val();
    console.log(req);
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
        if (id == req.uid) {
            registrationToken = t[k].token;
            break;
        }
    }

    var payload = {
        notification: {
            title: 'Your request has been accepted',
            body: 'Provider: '+data.userId
        }
    };


    admin.messaging().sendToDevice(registrationToken, payload)
        .then(function (response) {
            console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });

    response.json({
        status: "success"
    });


});


module.exports = router;
