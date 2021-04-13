// JavaScript source code
const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();


router.get('/signup', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../', 'views', 'signup.html'));
});

/*
router.post('/saveUser', async (request, response) => { //add to recieve that post(endpoint)

    const data = request.body;
    console.log(data);

    db.ref('users/' + data.userId).set({ unitPrice: 0.5, creditScore: 100 });

    response.json({
        status: "success",
    });

});*/
module.exports = router;
