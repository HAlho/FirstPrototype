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
    console.log('GOT A HISTORY!');

    // Get client's history from the database
    console.log(request.body);
    const data = request.body;
    var snapshot = await db.ref('previousRequests/' + data.userId + '/' + data.requestId).once('value');
    var request = snapshot.val();

    // Sending back requested history information to the client
    response.json({
        status: "success",
        request: request
    });

});


module.exports = router;
