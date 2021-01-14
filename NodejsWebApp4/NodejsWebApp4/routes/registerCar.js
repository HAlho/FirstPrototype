const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/registerCar', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'registerCar.html'));
});

router.post('/getCars', async (request, response) => { //add to recieve that post(endpoint)
    console.log('POST A CAR!');

    const data = request.body;

    await db.ref('users/' + data.userId + '/cars').push().set({
        brand: data.carBrand,
        model: data.carModel,
        licenseNumber: data.licenseNum,
        color: data.carColor
    });



    response.json({
        status: "success registring car"
    });

});

module.exports = router;
