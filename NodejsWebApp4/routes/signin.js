// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '1mb' }));

// Function to direct the client to index.html
router.get('/signin', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'index.html'));
});

// Get user sign in information from the client
router.post('/home', (request, response) => {
    console.log('GOT A REQ!');
    console.log(request.body);
    const data = request.body;
    response.json({
        status: "success",
        email: data.email,
        password: data.password
    });
});

module.exports = router;

