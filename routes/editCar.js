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

// Get user car information from the db and send it to the client
router.post('/getCar', async (request, response) => {

    // Get client request info (client id, car id)
    const data = request.body;

    // Get user car info from the database
    var snapshotCar = await db.ref('users/' + data.userId + '/cars/' + data.carId).once('value');
    var car = snapshotCar.val();
    // Get user current car info from the database
    var snapshot = await db.ref('users/' + data.userId + '/currentCar').once('value');
    var currentCarId = snapshot.val();

    // Send user car information to client
    response.json({
        status: "success",
        car: car,
        currentCarId: currentCarId
    });

});

//function to update user current car info in dp
router.post('/currentCar', (request, response) => {

    console.log('GOT A REQ!');

    // Get client request info (client id + car id)
    console.log(request.body);
    const data = request.body;
    response.json({
        status: "success",
        userId: data.userId,
        carId: data.carId
    });

    // Register current car info into the database
    db.ref('users/' + data.userId).update({ currentCar: data.carId });

    // Send response to client
    response.json({
        status: "current car updated."
    });
});

//function to get user previous requests and send them to the client
router.post('/saveUpdate', async (request, response) => {

    // Get client request info (client id + car id)
    const data = request.body;

    // Update car info in the db
    await db.ref('users/' + data.userId + '/cars/' + data.carId).update({
        licenseNumber: data.licenseNum,
        color: data.carColor
    });

   // Send response to client
    response.json({
        status: "success"
    });

});

//function to delete a car from the dp
router.post('/deleteCar', async (request, response) => {

    // Get client request info (client id + car id)
    const data = request.body;

    // Delete car from the database
    await db.ref('users/' + data.userId + '/cars/' + data.carId).remove();

    // Send response to client
    response.json({
        status: "success"
    });

});
module.exports = router;
