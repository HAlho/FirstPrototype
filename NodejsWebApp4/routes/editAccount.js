// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

router.use(express.json({ limit: '1mb' }));

router.get('/editAccount', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'editAccount.html'));
});

module.exports = router;
