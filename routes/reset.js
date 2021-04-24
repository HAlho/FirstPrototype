// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();

// Function to direct the client to reset.html
router.get('/reset', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'reset.html'));
});

module.exports = router;
