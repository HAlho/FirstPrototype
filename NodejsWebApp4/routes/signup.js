// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

// Function to direct the client to signup.html
router.get('/signup', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../', 'views', 'signup.html'));
});

module.exports = router;
