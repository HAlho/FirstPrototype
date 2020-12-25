const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/reset', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'reset.html'));
});

module.exports = router;
