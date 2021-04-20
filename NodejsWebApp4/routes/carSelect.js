// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

//database reference
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

//function to direct the client to carSelect.html
router.get('/carSelect', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'carSelect.html'));
});


//function to get user cars and send them to the client
router.post('/getCars', async (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID

    //get user cars from the database
    var snapshot = await db.ref('users/' + userId + '/cars').once('value');
    var cars = snapshot.val();

    //send user cars to client
    response.json({
        status: "success",
        cars: cars
    });
});

//function to save current car
router.post('/saveCurrentCar', (request, response) => {
    //get client request info
    const userId = request.body.userId; //user ID
    const carId = request.body.carId; //car ID

    //save current car in the database
    db.ref('users/' + userId).update({ currentCar: carId });

    //send response to client
    response.json({
        status: "success"
    });
});

module.exports = router;
