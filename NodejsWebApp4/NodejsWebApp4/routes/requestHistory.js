const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/requestHistory', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'requestHistory.html'));
});

router.post('/getHistory', async (request, response) => { //add to recieve that post(endpoint)
    console.log('GOT A HISTORY!');
    console.log(request.body);
    const data = request.body;
    var snapshot = await db.ref('previousRequests/' + data.userId).once('value');
    var hist = snapshot.val();
    response.json({
        status: "success",
        hist: hist
    });

});


module.exports = router;
