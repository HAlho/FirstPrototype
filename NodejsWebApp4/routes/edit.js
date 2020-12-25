const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/edit', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'edit.html'));
});

module.exports = router;
