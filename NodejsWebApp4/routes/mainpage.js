const path = require('path');

const express = require('express');

const router = express.Router();

router.use(express.json({ limit: '1mb' }));


router.get('/mainpage', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'mainpage.html'));
});



module.exports = router;


