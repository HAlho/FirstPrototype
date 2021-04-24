// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

// Function to direct the client to viewCars.html
router.get('/viewCars', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'viewCars.html'));
});


// Get user cars from the db and send it to the client
router.post('/getUserCars', async (request, response) => {

    // Get client request info (client id)
    const data = request.body;

    // Get user cars from the database
    var snapshotCars = await db.ref('users/' + data.userId + '/cars').once('value');
    var cars = snapshotCars.val();
    var snapshot = await db.ref('users/' + data.userId + '/currentCar').once('value');
    var currentCarId = snapshot.val();

    // Send user cars information to client
    response.json({
        status: "success",
        cars: cars,
        currentCarId: currentCarId
    });


});

// Get user current car information from the client and save it to the database
router.post('/currentCar', (request, response) => {

    console.log('GOT A REQ!');

    // Get client request info (client id + car id)
    console.log(request.body);
    const data = request.body;

    // Send response to client
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

module.exports = router;
