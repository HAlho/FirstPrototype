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
const carSelectRoute = require('./routes/carSelect'); //// new
const profileRoute = require('./routes/profile');
const accountRoute = require('./routes/account');
const avaReqRoute = require('./routes/avaReq');
const editRoute = require('./routes/edit');
const viewCarsRoute = require('./routes/viewCars'); //// new
const editCarRoute = require('./routes/editCar'); //// new
const registerCarRoute = require('./routes/registerCar');
const requestHistoryRoute = require('./routes/requestHistory');
const resetRoute = require('./routes/reset');
const paymentRoute = require('./routes/payment');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));//send the static js and css files with the corresponding html file

app.use(signUpRoute);
app.use(signInRoute);
app.use(carSelectRoute); ////new
app.use(profileRoute);
app.use(accountRoute);
app.use(avaReqRoute);
app.use(editRoute);
app.use(viewCarsRoute); ////new
app.use(editCarRoute); ////new
app.use(registerCarRoute);
app.use(requestHistoryRoute);
app.use(resetRoute);
app.use(paymentRoute);//new

app.use((req, res, next) => {
    res.status(404).send('<h1>Page not found</h1>');
});

fs.writeFile('queue.txt', '', function (err) {//clear queue
    if (err) return console.log(err);
});
fs.writeFile('procInfo.txt', '', function (err) {//clear procInfo
    if (err) return console.log(err);
});

https.createServer({ key: privateKey, cert: certificate }, app).listen(3000);
