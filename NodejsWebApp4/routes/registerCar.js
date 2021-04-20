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

// Function to register a client's new car into the database
router.post('/getCars', async (request, response) => { 

    console.log('POST A CAR!');

    // Get the car information from the client
    const data = request.body;

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
