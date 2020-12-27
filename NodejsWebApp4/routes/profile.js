const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/profile', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'profile.html'));
});

//handling requests

router.use(express.json({ limit: '1mb' }));

router.post('/chargeReq', (request, response) => { //add to recieve that post(endpoint)
    console.log('GOT A REQ!');
    console.log(request.body);
    const data = request.body;
    response.json({
        status: "success",
        latitude: data.lat,
        longtitude: data.lon,
        timestamp: data.tim
    });
});

module.exports = router;
