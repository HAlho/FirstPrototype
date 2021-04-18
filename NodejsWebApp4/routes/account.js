// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/account', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'account.html'));
});

//get user information from the db and send it to the client
router.post('/getUser', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    //send user information to client
    response.json({
        status: "success",
        user: user
    });
});

//get user status and send it to the client
router.post('/getStat', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user information from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var user = snapshot.val();

    //send user status to client
    response.json({
        status: "success",
        stat: user.status
    });
});

//update user status
router.post('/setStat', (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const stat = request.body.status; //new status

    //save changes to database
    db.ref('users/' + userId).update({ status: stat });

    // send response to client
    response.json({
        status: "success",
    });
});


router.post('/updateUnitPrice', async (request, response) => { //add to recieve that post(endpoint)
    const data = request.body;
    db.ref('users/' + data.userId).update({ unitPrice: data.newUnitPrice });

    response.json({
        status: "success"
    });
});



module.exports = router;
