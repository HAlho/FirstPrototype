const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/signup', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'signup.html'));
});

module.exports = router;
