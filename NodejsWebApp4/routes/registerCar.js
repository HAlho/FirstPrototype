// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');


// Database reference
var db = admin.database();

router.use(express.json({ limit: '1mb' }));


// Function to direct the client to registerCar.html
router.get('/registerCar', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'registerCar.html'));
});

// Function to get car brands from the db and send it to the client
router.post('/getBrands', async (request, response) => {

    // Get client request info
    const data = request.body;

    // Get brands from the database
    var snapshot = await db.ref('carList').once('value');
    var brands = snapshot.val();

    // Send brands to client
    response.json({
        status: "success",
        brands: brands
    });


});

// Function to get specific car brand models from the db and send it to the client
router.post('/getModels', async (request, response) => {

    // Get client request info (car brand)
    const data = request.body;

    // Get brand models info from the database
    var snapshot = await db.ref('carList/' + data.carBrand).once('value');
    var models = snapshot.val();

    // Send brand models to client
    response.json({
        status: "success",
        models: models
    });


});

// Function to register a client's new car into the database
router.post('/saveCar', async (request, response) => { 
    console.log('POST A CAR!');

    // Get the car information from the client
    const data = request.body;

    console.log(data);

    // Register the car info into the database
    await db.ref('users/' + data.userId + '/cars').push().set({
        brand: data.carBrand,
        model: data.carModel,
        licenseNumber: data.licenseNum,
        color: data.carColor
    });


    // Send response to client
    response.json({
        status: "success registring car"
    });

});


module.exports = router;
