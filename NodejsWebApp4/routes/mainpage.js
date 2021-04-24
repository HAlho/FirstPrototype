// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();

router.use(express.json({ limit: '1mb' }));

//function to direct the client to mainpage.html
router.get('/mainpage', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'mainpage.html'));
});

module.exports = router;


