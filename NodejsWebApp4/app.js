const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const https = require('https'); 
const fs = require('fs');

const app = express();

const privateKey = fs.readFileSync('./ssl/key.key');
const certificate = fs.readFileSync('./ssl/crt.crt')

const signUpRoute = require('./routes/signup');
const signInRoute = require('./routes/signin');
const profileRoute = require('./routes/profile');
const accountRoute = require('./routes/account');
const avaReqRoute = require('./routes/avaReq');
const editRoute = require('./routes/edit');
const registerCarRoute = require('./routes/registerCar');
const requestHistoryRoute = require('./routes/requestHistory');
const resetRoute = require('./routes/reset');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(signUpRoute);
app.use(signInRoute);
app.use(profileRoute);
app.use(accountRoute);
app.use(avaReqRoute);
app.use(editRoute);
app.use(registerCarRoute);
app.use(requestHistoryRoute);
app.use(resetRoute);

app.use((req, res, next) => {
    res.status(404).send('<h1>Page not found</h1>');
});

https.createServer({ key: privateKey, cert: certificate }, app).listen(3000);
