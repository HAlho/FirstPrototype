const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/account', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'account.html'));
});

module.exports = router;
