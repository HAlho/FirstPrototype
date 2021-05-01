// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

// Function to direct the client to account.html
router.get('/account', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'account.html'));
});


//update user unit price
router.post('/updateUnitPrice', async (request, response) => { //add to recieve that post(endpoint)
    //get client request info
    const userId = request.body.userId; //user ID
    const newUnitPrice = request.body.newUnitPrice; //new status

    //save changes to database
    db.ref('users/' + userId).update({ unitPrice: newUnitPrice });

    // send response to client
    response.json({
        status: "success"
    });
});

module.exports = router;