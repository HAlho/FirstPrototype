// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

//database reference
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/requestHistory', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'requestHistory.html'));
});

//function to get user previous requests and send them to the client
router.post('/getHistory', async (request, response) => {
    //get client request info
    const userId = request.body.userId;

    //get user previous requests from the database
    var snapshot = await db.ref('previousRequests/' + userId).once('value');
    var previousRequests = snapshot.val();

    //send previous requests to client
    response.json({
        status: "success",
        previousRequests: previousRequests
    });
});

module.exports = router;
