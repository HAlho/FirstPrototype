// JavaScript source code
const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/carSelect', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'carSelect.html'));
});



router.post('/postCars', async (request, response) => { //add to recieve that post(endpoint)
    console.log('GOT A CAR!');

    const data = request.body;
    var snapshot = await db.ref('users/' + data.userId + '/cars').once('value');
    var cars = snapshot.val();
    console.log(cars);

    response.json({
        status: "success",
        cars: cars
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
