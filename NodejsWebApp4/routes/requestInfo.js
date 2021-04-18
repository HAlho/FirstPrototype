const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/requestInfo', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'requestInfo.html'));
});

router.post('/getRequest', async (request, response) => { //add to recieve that post(endpoint)
    console.log('GOT A HISTORY!');
    console.log(request.body);
    const data = request.body;
    var snapshot = await db.ref('previousRequests/' + data.userId + '/' + data.requestId).once('value');
    var request = snapshot.val();
    response.json({
        status: "success",
        request: request
    });

});


module.exports = router;
