const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/requestHistory', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'requestHistory.html'));
});

module.exports = router;
