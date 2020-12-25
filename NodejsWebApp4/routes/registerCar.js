const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/registerCar', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'registerCar.html'));
});

module.exports = router;
