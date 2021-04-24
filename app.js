const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const https = require('http'); 
const fs = require('fs');

const app = express();

const privateKey = fs.readFileSync('./ssl/key.key');
const certificate = fs.readFileSync('./ssl/crt.crt')

const mainpageRoute = require('./routes/mainpage');
const signUpRoute = require('./routes/signup');
const signInRoute = require('./routes/signin');
const carSelectRoute = require('./routes/carSelect');
const profileRoute = require('./routes/profile');
const newRequestRoute = require('./routes/newRequest');
const accountRoute = require('./routes/account');
const settingsRoute = require('./routes/settings');
const paymentRoute = require('./routes/payment');
const editAccountRoute = require('./routes/editAccount');
const viewCarsRoute = require('./routes/viewCars');
const editCarRoute = require('./routes/editCar'); 
const registerCarRoute = require('./routes/registerCar');
const requestHistoryRoute = require('./routes/requestHistory');
const requestInfoRoute = require('./routes/requestInfo');
const resetRoute = require('./routes/reset');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));//send the static js and css files with the corresponding html file

app.use(mainpageRoute);
app.use(signUpRoute);
app.use(signInRoute);
app.use(carSelectRoute);
app.use(profileRoute);
app.use(newRequestRoute);
app.use(accountRoute);
app.use(settingsRoute);
app.use(paymentRoute);
app.use(editAccountRoute);
app.use(viewCarsRoute);
app.use(editCarRoute);
app.use(registerCarRoute);
app.use(requestHistoryRoute);
app.use(requestInfoRoute);
app.use(resetRoute);

app.use((req, res, next) => {
    res.status(404).send('<h1>Page not found</h1>');
});

fs.writeFile('queue.txt', '', function (err) {//clear queue
    if (err) return console.log(err);
});
fs.writeFile('procInfo.txt', '', function (err) {//clear procInfo
    if (err) return console.log(err);
});
fs.writeFile('cancelQueue.txt', '', function (err) {//clear queue
    if (err) return console.log(err);
});

https.createServer(app).listen(process.env.PORT || 3000);
