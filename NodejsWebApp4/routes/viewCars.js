// JavaScript source code route
// JavaScript source code
const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/viewCars', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'viewCars.html'));
});



router.post('/getUserCars', async (request, response) => { //add to recieve that post(endpoint)

    const data = request.body;
    var snapshotCars = await db.ref('users/' + data.userId + '/cars').once('value');
    var cars = snapshotCars.val();

    var snapshot = await db.ref('users/' + data.userId + '/currentCar').once('value');
    var currentCarId = snapshot.val();


    response.json({
        status: "success",
        cars: cars,
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

module.exports = router;
