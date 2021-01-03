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

    response.json({
        status: "success"
    });

});


module.exports = router;
