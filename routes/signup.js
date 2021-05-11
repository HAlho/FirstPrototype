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


// Function to save the user's card information
router.post('/checkBanned', async (request, response) => {
    //get user email
    const email = request.body.email;
    let banned = false;

    //get banned emails
    db.ref('bannedAccounts').orderByChild('email').equalTo(email).on("value", function (snapshot) {
        snapshot.forEach(function (data) {
            banned = true;
        });
    });

    response.json({
        banned: banned
    });
});


// Function to save the user's card information
router.post('/saveUser', async (request, response) => {
    //get user ID
    const userId = request.body.userId;

    //add user to the database
    await db.ref('users').child(userId).set({
        creditScore: 100,
        status: 'Available',
        unitPrice: 0.37
    });

    //send response to client
    response.json({
        status: "success"
    });
});

module.exports = router;
