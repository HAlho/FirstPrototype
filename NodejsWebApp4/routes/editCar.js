// JavaScript source code route
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

//function to direct the client to editCar.html
router.get('/editCar', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'editCar.html'));
});

router.post('/getCar', async (request, response) => { //add to recieve that post(endpoint)
    const data = request.body;
    var snapshotCar = await db.ref('users/' + data.userId + '/cars/' + data.carId).once('value');
    var car = snapshotCar.val();

    var snapshot = await db.ref('users/' + data.userId + '/currentCar').once('value');
    var currentCarId = snapshot.val();


    response.json({
        status: "success",
        car: car,
        currentCarId: currentCarId
    });

});

router.post('/currentCar', (request, response) => { //add to recieve that post(endpoint)
    console.log('GOT A REQ!');
    console.log(request.body);
    const data = request.body;
    response.json({
        status: "success",
        userId: data.userId,
        carId: data.carId
    });
    db.ref('users/' + data.userId).update({ currentCar: data.carId });

    response.json({
        status: "current car updated."
    });
});

router.post('/saveUpdate', async (request, response) => { //add to recieve that post(endpoint)
    const data = request.body;

    await db.ref('users/' + data.userId + '/cars/' + data.carId).update({
        licenseNumber: data.licenseNum,
        color: data.carColor
    });

    response.json({
        status: "success"
    });

});

router.post('/deleteCar', async (request, response) => { //add to recieve that post(endpoint)
    const data = request.body;

    await db.ref('users/' + data.userId + '/cars/' + data.carId).remove();

    response.json({
        status: "success"
    });

});
module.exports = router;
