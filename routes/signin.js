// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '1mb' }));

// Function to direct the client to index.html
router.get('/signin', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'signin.html'));
});

module.exports = router;

