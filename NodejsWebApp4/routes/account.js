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

router.post('/getUserInfo', async (request, response) => { //add to recieve that post(endpoint)
    const data = request.body;
    var snapshotUP = await db.ref('users/' + data.userId + "/unitPrice").once('value');
    var unitPrice = snapshotUP.val();
    if (unitPrice == null) {
        db.ref('users/' + data.userId).update({ unitPrice: 0.5 });
        unitPrice = 0.5;
    }

    var snapshotCS = await db.ref('users/' + data.userId + "/creditScore").once('value');
    var creditScore = snapshotCS.val();
    if (creditScore == null) {
        db.ref('users/' + data.userId).update({ creditScore: 100 });
        creditScore = 100;
    }

    response.json({
        status: "success",
        unitPrice: unitPrice,
        creditScore: creditScore,
    });
});


router.post('/getStat', async (request, response) => { //add to recieve that post(endpoint)
    console.log('GOT A STAT!');

    const data = request.body;

    var snapshot = await db.ref('users/' + data.userId).once('value');
    var info = snapshot.val();
    var userStatus = info.status;
    var creditScore = info.creditScore;
    var unitPrice = info.unitPrice;
    if (userStatus == null) {
        userStatus = "Available";
        db.ref('users/' + data.userId).update({ status: userStatus });
    }

    if (creditScore == null) db.ref('users/' + data.userId).update({ creditScore: 100 });
    if (unitPrice == null) db.ref('users/' + data.userId).update({ unitPrice: 0.5 });

    console.log(userStatus);

    response.json({
        status: "success",
        stat: userStatus
    });

});

router.post('/setStat', (request, response) => { //add to recieve that post(endpoint)
    console.log(request.body);
    const data = request.body;

    db.ref('users/' + data.userId).update({ status: data.stat });
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
