
const express = require('express');

const router = express.Router();

const path = require('path');


const { admin } = require('./firebaseConfig.js');

const paypal = require('paypal-rest-sdk');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AazgvfZgfI1XU-eb2huPK1FDVN-x7YSTolwAt-g6rabZJNQqnT5hf2fJPtaD2Vri14o0oktWCvfONZCO',
    'client_secret': 'EKzFVyLD0QPUecuN0-HiYIgkQcrSJEQ2G94hBs38QkWIpH_1-buhkiy1ingyncmL_LTnhBFceigIYGSq'
});


router.get('/payment', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'payment.html'));
});


//router.post('/pay', (req, res) => {
//    const create_payment_json = {
//        "intent": "sale",
//        "payer": {
//            "payment_method": "paypal"
//        },
//        "redirect_urls": {
//            "return_url": "https://192.168.0.123:3000/profile",
//            "cancel_url": "https://192.168.0.123:3000/account"
//        },
//        "transactions": [{
//            "item_list": {
//                "items": [{
//                    "name": "Red Sox Hat",
//                    "sku": "001",
//                    "price": "25.00",
//                    "currency": "USD",
//                    "quantity": 1
//                }]
//            },
//            "amount": {
//                "currency": "USD",
//                "total": "25.00"
//            },
//            "description": "Hat for the best team ever"
//        }]
//    };

//    paypal.payment.create(create_payment_json, function (error, payment) {
//        if (error) {
//            throw error;
//        } else {
//            for (let i = 0; i < payment.links.length; i++) {
//                if (payment.links[i].rel === 'approval_url') {
//                    res.redirect(payment.links[i].href);
//                }
//            }
//        }
//    });

//});



//router.get('/success', (req, res) => {
//    const payerId = req.query.PayerID;
//    const paymentId = req.query.paymentId;

//    const execute_payment_json = {
//        "payer_id": payerId,
//        "transactions": [{
//            "amount": {
//                "currency": "USD",
//                "total": "25.00"
//            }
//        }]
//    };

//    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
//        if (error) {
//            console.log(error.response);
//            throw error;
//        } else {
//            console.log(JSON.stringify(payment));
//            res.send('Success');
//        }
//    });
//});




//router.get('/cancel', (req, res) => res.send('Cancelled'));


//router.get('/pay', async (request, response) => { //add to recieve that post(endpoint)
//    console.log('GOT A payment!');

//    const data = request.body;

//    var create_payment_json = {
//        "intent": "sale",
//        "payer": {
//            "payment_method": "paypal"
//        },
//        "redirect_urls": {
//            "return_url": "https://localhost:3000/profile",
//            "cancel_url": "https://localhost:3000/account"
//        },
//        "transactions": [{
//            "item_list": {
//                "items": [{
//                    "name": "charge1",
//                    "sku": "12",
//                    "price": "5.00",
//                    "currency": "USD",
//                    "quantity": 1
//                }]
//            },
//            "amount": {
//                "currency": "USD",
//                "total": "5.00"
//            },
//            "description": "payment description1."
//        }]
//    };

//    paypal.payment.create(create_payment_json, function (error, payment) {
//        if (error) {
//            throw error;
//        } else {
//            console.log("Create Payment Response");
//            //console.log(payment);
//            //response.json({
//            //    status: "success",

//            //});
//            for (let i = 0; i < payment.links.length; i++) {
//                if (payment.links[i].rel === 'approval_url')
//                    response.redirect(payment.links[i].href);
//            }
//        }
//    });




//});


module.exports = router;
