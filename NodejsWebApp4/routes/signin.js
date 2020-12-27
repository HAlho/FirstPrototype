const path = require('path');

const express = require('express');

const router = express.Router();

router.get('/signin', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'index.html'));
});

router.use(express.json({ limit: '1mb' }));

router.post('/api', (request, response) => { //add to recieve that post(endpoint)
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
