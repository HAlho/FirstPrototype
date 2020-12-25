const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/avaReq', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'avaReq.html'));
});

module.exports = router;
