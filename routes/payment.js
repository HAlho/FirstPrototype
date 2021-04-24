// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

// Function to direct the client to viewCars.html
router.get('/payment', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'payment.html'));
});


//get user cards information from the db and send it to the client
router.post('/getCards', async (request, response) => {
    //get client request info
    const userId = request.body.userId;

    //get user cards info from the database
    var snapshot = await db.ref('users/' + userId + '/payment').once('value');
    var cards = snapshot.val();

    // send user cards to client
    response.json({
        status: "success",
        cards: cards
    });
});

// Function to register a client's new car into the database
router.post('/deleteCard', async (request, response) => {
    //get information from the client
    const userId = request.body.userId;
    const cardId = request.body.cardId;

    //add the card information to the database
    await db.ref('users/' + userId +'/payment').child(cardId).remove();

    //send response to client
    response.json({
        status: "success"
    });
});

// Function to save the user's card information
router.post('/savePaypal', async (request, response) => {
    //get information from the client
    const userId = request.body.userId;
    const email = request.body.email;

    //add the card information to the database
    await db.ref('users/' + userId + '/payment').push().set({
        email: email
    });

    //send response to client
    response.json({
        status: "success"
    });
});

module.exports = router;
