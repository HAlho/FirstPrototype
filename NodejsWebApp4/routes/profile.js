const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/profile', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'profile.html'));
});

module.exports = router;
