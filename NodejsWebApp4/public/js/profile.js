// JavaScript source code
const PROMPT_HEIGHT = "77%";
//html elements global variables
var buttonsDiv = document.getElementById("buttons"); //buttonsDiv that contains 'request charge' and 'available request' buttons
//active request elements
var requestDiv = document.getElementById("request"); //if the user has an active request, it will be shown here
var cancelButton = document.getElementById('cancel'); //cancel button to cancel active request
var acceptButton = document.getElementById('accept'); //accept button for requester to accept active request once his/her match accepts
var paymentDiv = document.getElementById("payment"); //payment section to input payment info after request is done
var pay = document.getElementById('pay'); //pay button
//available request elements
var avaReqDecline = document.getElementById("avaReqDecline"); //button to decline available request
var avaReqAccept = document.getElementById('avaReqAccept'); //button to accept available request

//global variables
let inProgress; //?????????????????????????????? this takes the request time  but it resets when we refresh                                  ///////////////////////////////////////////////////////??????? delete?
//store current car's information
var carBrand = null; //store current car's brand
var car, carModel, carColor, carNum, consumption, batteryCapacity; //store current car's info
var cardsFlag = false; //set true if user has saved payment info
//For when theres an active request
var userIsRequester = false;
var userId;

//check if the user came back from the car select page (reload page to show new car information)
window.addEventListener("pageshow", async function (event) {
    var historyTraversal = event.persisted ||
        (typeof window.performance != "undefined" &&
            window.performance.navigation.type === 2); // window.performance.navigation.type = 2 when user 
    if (historyTraversal) { //user came back from the car select page
        window.location.reload(); //reload page to show changes
    }
});

//html elements event listeners
//main menu account button event listeners
document.getElementById('account').addEventListener('click', () => {
    window.location.assign('../account'); //main menu account button to forward the user to the account page
});

//main menu account button event listener
document.getElementById("edit").addEventListener("click", function () {
    if (userStatus == 'Available' || userStatus == 'Do Not Disturb')
        window.location.assign('../carSelect'); //button to change current car
    else alert('Current car cannot be changed when there is a request in progress');
}); 

//request form buttons
//when 'request charge' button is clicked, show the request form 
document.getElementById("newRequest").addEventListener('click', () => {
    if (carBrand == null) { //if user doesn't have any registered cars
        if (confirm("You must add your car information first. Would you like to do that now?"))
            window.location.assign("../registerCar"); //forward user to registerCar page
    } else {
        navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
            if (result.state === 'granted' && localStorage.getItem('locationPermission') == 'granted') //location permission is granted
                window.location.assign("../newRequest"); //forward user to newRequest page
            else alert('Location access must be turned on');
        });
    }
});

//available request buttons
//button to show available request window prompt
document.getElementById('avaReq').addEventListener('click', () => {
    if (!document.getElementById('avaReq').classList.contains('disabled')) { //buttton is disabled if there is no available request
        document.getElementById("dimContent").classList.add("dimVisible"); //dim the screen behind the window prompt
        document.getElementById("windowPromptAvaReq").style.display = "block";
        document.getElementById("windowPromptAvaReq").style.height = PROMPT_HEIGHT; //show available request
    }
});

//button to hide available request window prompt
document.getElementById('closeAvaReq').addEventListener('click', () => {
    document.getElementById("windowPromptAvaReq").style.height = "0";
    document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
  //  setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "none"; }, 510); //hide window prompt
});


//function that check if user is authenticated then calls other functions
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        userId = firebase.auth().currentUser.uid; //current user ID

        //send user ID to the server to clear any bugs from the user's account
        const sdata = { userId };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/debugAccount', options);
        const json = await response.json();

        showStatus(); //show user status in main menu (function is found in status.js)

        notificationPermission(userId); //check if notifications permission is allowed and stored
        locationPermission(); //check if location access is allowed and stored

        displayCurrentCar(); //get and display the user's current car
        getCards();//get the user's payment information

        profilePage(); //check if the user has active requests
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

//function to set delay
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

//function to check if notifications permission is granted and stored
function notificationPermission(userId) {
    if (Notification.permission === 'default') { //notifications permission is set as default in the browser, ask user for permission
        Notification.requestPermission().then(function (result) {
            localStorage.setItem('notificationsPermission', result); //save user's decision to allow or block permission
            if (result == "granted") { //if user allowed notifications, create token
                const messaging = firebase.messaging();                                                                                   ///////////////////////////////////////////////////////??????? not sure how to comment
                messaging.onTokenRefresh(handleTokenRefresh);
                messaging.requestPermission()
                    .then(() => handleTokenRefresh())
                    .catch(function (err) {
                        console.log('Error with notification token');
                    });
                function handleTokenRefresh() {
                    return messaging.getToken({ vapidKey: "BG9S8oj5kmcXZt1xaqHgmOCJgIcPHXgBaFing5JMUr4wlVbhlWXPwrbkikqKVAoVDZ2Fe31uCqpqQLJqAz18RyU" })
                        .then(async function (token) {
                            const d = { userId, token };
                            const options = {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(d)
                            };
                            const response = await fetch('/addToken', options);
                            const j = await response.json();
                        })
                }
            }
        });
    } else if (Notification.permission === 'denied' || localStorage.getItem('notificationsPermission') == null || localStorage.getItem('notificationsPermission') == 'default') 
        localStorage.setItem('notificationsPermission', Notification.permission); //update notificationsPermission variable if it wasn't set properly

    console.log('notification permission ' + localStorage.getItem('notificationsPermission'));
}


//check if location access is allowed and stored
function locationPermission() {
    //get current location permission state
    navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
        if (result.state === 'prompt') { //location permission is set as default in the browser, ask user for permission
            navigator.geolocation.getCurrentPosition(async position => { //if user allowed location access
                localStorage.setItem('locationPermission', 'granted');
            }, function () { //if user denied location access
                localStorage.setItem('locationPermission', 'denied');
            });
        } else if (result.state === 'denied' || localStorage.getItem('locationPermission') == null) { //location permission is denied in web browser
            localStorage.setItem('locationPermission', result.state);  //update locationPermission variable if it wasn't set properly
        }
    });
    console.log('location permission ' + localStorage.getItem('locationPermission'));
}


async function getCards() {
    //get payment information from the server
    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getCards', options);
    const json = await response.json();
    cards = json.cards;

    //No info found
    if (cards == null) {
        document.getElementById("noPayment").style.display = "block";
    } else {
        cardsFlag = true;
        var keys = Object.keys(cards); //get car ids
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            let option = document.createElement("option");
            option.text = cards[k].email;
            option.value = cards[k].email;
            document.getElementById("paymentSelect").appendChild(option);
            document.getElementById("paymentSelect").style.display = "block";
        }
    }
}

//get and display the user's current car
async function displayCurrentCar() {
    //get car information from the server
    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getCurrentCar', options);
    const json = await response.json(); //server response
    car = json.car;

    //display car information
    if (!json.carsFlag) { //user does not have any registered cars
        carBrand = null;
        document.getElementById('noCar').style.display = 'block';
        document.getElementById('newRequest').classList.add('disabled'); //reset avaReq button display


    } else if (!json.currentCarFlag) //user has registered cars but no selected car
        window.location.assign('../carSelect');
    else { //user has a current car
        //get car information
        carBrand = car.brand;
        carModel = car.model;
        carColor = car.color;
        carNum = car.licenseNumber;
        consumption = json.consumption;
        batteryCapacity = json.batteryCapacity;
        //display car on page
        let carInfo = "<b>CURRENT CAR </b> <br></br>" + carBrand + ' ' + carModel + " (Plate No.: " + carNum + ')';
        document.getElementById("currentCarInfo").innerHTML = carInfo;
        document.getElementById("edit").style.display = "block";
    }
}


//check if user has any active requests
async function profilePage() {
    var status, previousStatus = null; //if there's an active request, store the status of the request, otherwise store the status of the user
    var userIsRequester = false; //set true if user has an active request and is the requester

    var timer = setInterval(async function () { //get the user's status and update page every 2 seconds

        //get user information from the server
        const d = { userId };
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(d)
        };
        const response = await fetch('/getUser', options);
        const j1 = await response.json();
        const user = j1.user; //store user information

        status = user.status; //get user status
        if (status == 'Busy') { //if status is 'Busy', status is set to be the request's status instead of the user's
            status = user.activeRequest.dbref; // status is set to be the request's status instead of the user's
            if (user.activeRequest.role == "requester") userIsRequester = true; //current user is the requester
        }
        //user status is 'Available' or 'Do Not Disturb' if they don't have any active requests
        //user status is 'matched' if user got matched to an active request
        //user status is 'Busy' if user has an active request
        //request status progress: issued -> matched -> pending -> accepted -> completed



        if (status != previousStatus) { //status was changed, update page
            previousStatus = status;
            showStatus(status); //update status icon in the main menu
            if (status == 'matched') await sleep(2000);
            let request, requestId; //store request informationa and request ID (if exists)
            //if there's an active/matched request, get request information
            if (status != 'Available' && status != 'Do Not Disturb') { //there's an active request
                let dbref;
                user.status == 'matched' ? dbref = user.status : dbref = user.activeRequest.dbref; //get request reference
                user.status == 'matched' ? requestId = user.matchedReq : requestId = user.activeRequest.id; //get request id

                //send request ID to the server and get back the request's information
                const d = { dbref, requestId };
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(d)
                };
                const response = await fetch('/getActiveRequest', options);
                const j2 = await response.json();
                request = j2.req; //active request information

                console.log(request);
                if (request == null) {
                    await sleep(2000);
                    location.reload(); //reload page to avoid errors
                }
            }

            //update html page depending on the user / request status
            if (status == 'Available' || status == 'Do Not Disturb') { //user does not have any active requests
                userIsRequester = false; //reset userIsRequester variable
                document.getElementById('avaReq').classList.add('disabled'); //reset avaReq button display

                //hide all elements and show buttonsDiv only
                hideAllElements();
                buttonsDiv.style.display = "block";

            } else if (status == 'Pay') { //consumer should pay
                //hide all elements and show the payment to the consumer
                hideAllElements();
                paymentDiv.style.display = "block";

                let text = "<h2>Your request has been completed!</h2>" + "<br />";
                text += "<b>Requested charge amount: </b>" + request.amount + " kWh" + "<br />";
                text += "<b>Cost: </b>" + request.match.estAmount + " AED" + "<br /><br /><br />";

                document.getElementById("paymentText").innerHTML = text;

                //add event listener to 'pay' button
                pay.addEventListener("click", async function () {
                    alert('Payment completed successfully!');

                    const p1 = { userId, requestId: user.activeRequest.id, match: request.match };
                    const poptions1 = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(p1)
                    };
                    const presponse1 = await fetch('/tempPay', poptions1);
                    const pj1 = await presponse1.json();

                    //const p1 = { userId, requestId: user.activeRequest.id, match: request.match };
                    //const poptions1 = {
                    //    method: 'POST',
                    //    headers: {
                    //        'Content-Type': 'application/json'
                    //    },
                    //    body: JSON.stringify(p1)
                    //};
                    //const presponse1 = await fetch('/pay', poptions1);
                    //const pj1 = await presponse1.json();
                    //console.log(pj1.req);
                    //window.location = pj1.forwardLink;
                });

            } else if (status == 'matched' && !userIsRequester) { //user is a possible provider and got matched to an active request
                //hide all elements and show buttonsDiv only
                hideAllElements();
                buttonsDiv.style.display = "block";
                document.getElementById("windowPromptAvaReq").style.display = "block";

                //set and display matched request information
                //show request information
                text = "<h2>A nearby user is in need of charge!</h2>" + "<br />";
                text += "<b>Requested charge amount: </b>" + request.amount + " kWh" + "<br />";
                text += "<b>Estimated price: </b>" + request.match.estAmount + " AED" + "<br />";
                text += "<b>Meet-up location: </b><br />";
                text += '<img src="./img/location-' + request.match.location + '.png" width="100%"><br />';

                document.getElementById("avaReqText").innerHTML = text;

                //set decline button
                avaReqDecline.addEventListener("click", async function () {
                    if (!confirm("Are you sure you want to decline the request?")) return; //confirm user's choice. leaves function if user declined

                    //send user and request information to the server to decline the request
                    const d = { userId, requestId, req: request };
                    const options = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(d)
                    };
                    const response = await fetch('/declineRequest', options);
                    const j5 = await response.json();
                    console.log(j5);

                    //hide available request window prompt
                    document.getElementById("windowPromptAvaReq").style.height = "0";
                    document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
                //    setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "none"; }, 510); //hide window prompt
                });

                //set accept button
                avaReqAccept.addEventListener("click", async function () {
                    let paypal = null;
                    //if user has cards, check if a card was selected
                    if (cardsFlag) {
                        if (document.getElementById("paymentSelect").value != "Select a Payment Method") {
                            paypal = document.getElementById("paymentSelect").value;
                        } else {
                            document.getElementById('emailAlert').innerHTML = "Pick a card"; //to display error messages
                            return;
                        }
                    } else if (!cardsFlag) {//user does not have cards, user should input paypal information
                        paypal = document.getElementById('paymentInput').value;
                        if (validateEmail(paypal)) { // paypal info is valid
                            //check if user checked the 'save card' box. if so, send paypal info to the server
                            if (document.getElementById('saveCard').checked) {
                                //send user and paypal information to the server
                                const cardd = { userId, paypal };
                                const options = {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(cardd)
                                };
                                const response = await fetch('/saveCard', options);
                                const jcard = await response.json();
                            }
                        } else return; //email is invalid
                    }


                    //set request info
                    const reqId = request.requester.uid; //requester ID

                    //send user and request info to the server to accept request
                    const sendData = { userId, requestId, reqId, paypal, car };
                    const matchedOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sendData)
                    };
                    const mresponse = await fetch('/matchAccept', matchedOptions);
                    const mjson = await mresponse.json();

                    //hide available request window prompt
                    document.getElementById("windowPromptAvaReq").style.height = "0";
                    document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
       //             setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "none"; }, 510); //hide window prompt

                });

                //enable available request button
                document.getElementById("avaReq").innerHTML = "Available Request";
                document.getElementById("avaReq").classList.remove("disabled");

                //show available request window prompt
                document.getElementById("dimContent").classList.add("dimVisible"); //dim the screen behind the window prompt
                document.getElementById("windowPromptAvaReq").style.height = PROMPT_HEIGHT;

            } else { //user has an active request
                //set and display current request information
                //hide all elements and show request div
                hideAllElements();
                requestDiv.style.display = "block";

                //set text message depending on the status of the request
                setText(status, userIsRequester, request);

                //set the cancel button
                cancelButton.addEventListener("click", async function () {
                    if (status != "completed") {
                        if (!confirm("Are you sure you want to cancel the request?")) return; //confirm user's choice. leaves function if user declined

                        //send user and request information to the server to cancel the request
                        const d = { userId, userIsRequester, requestRef: user.activeRequest, req: request };
                        const options = {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(d)
                        };
                        const response = await fetch('/cancelRequest', options);
                        const j5 = await response.json();
                        console.log(j5);
                    }
                });
                cancelButton.style.display = "block"; //show cancel button

                //set the accept button if needed
                if (status == 'pending' && userIsRequester) {
                    acceptButton.addEventListener("click", async function () {
                        //send users and request information to the server to accept the request
                        const d9 = { userId, user2Id: request.match.provider, requestId };
                        const mcOptions = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(d9)
                        };
                        const mcResponse = await fetch('/consumerMatchAccept', mcOptions);
                        const j9 = await mcResponse.json();
                        console.log(j9.req);
                    });

                    acceptButton.style.display = "block"; //show accept button

                } else if (status == 'accepted' || status == 'completed') {
                    //get time                                                                                         ///////////////////////////////////////////////////////??????? delete? when user refreshes page this resets
                    if (userIsRequester) {
                        inProgress = Date.now();
                        console.log(inProgress);
                    } else {
                        inProgressPro = Date.now();
                        console.log(inProgressPro);
                    }

                    //call function readyForDone(). the function will show the payment and 'done' buttons
                    readyForDone(userId, user, userIsRequester, request);
                }
            }
        }

        //get user's location and send it to the server. server will store location in the database
        if ('geolocation' in navigator && localStorage.getItem('locationPermission') == 'granted') { //if location access is allowed
            navigator.geolocation.getCurrentPosition(async position => {
                //get current latitude, longitude and time
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const tim = position.timestamp;

                //send user's location to the server to save location
                const d1 = { userId, lat, lon, tim };
                options1 = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(d1)
                };
                const response1 = await fetch('/storeGeolocation', options1);
                const json = await response1.json();
            });
        }
    }, 2000);
}


//function to validate email
function validateEmail(email) {
    const alert = document.getElementById('emailAlert'); //to display error messages
    //check if it's null
    if (email == null || email == '') { //email is empty
        alert.innerHTML = "Please input your paypal information."; //display error message
        return false;
    }
    //check email length
    if (email.length > 320) { //email is too long
        alert.innerHTML = "Email is too long!"; //display error message
        return false;
    }
    //email format should follow something@something.something... 
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; //email regex. source: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    if (!re.test(String(email).toLowerCase())) { //if email is not valid
        alert.innerHTML = 'Invalid email address!'; //display error message
        return false;
    }
    return true; //email is valid
}

//function to hide all request-related elements on the page 
//remove all events from buttons by cloning and replacing them
function hideAllElements() {
    //hide all request-relate elements
    buttonsDiv.style.display = "none";
    requestDiv.style.display = "none";
    cancelButton.style.display = "none";
    acceptButton.style.display = "none";
    document.getElementById("paypal").style.display = "none";
    paymentDiv.style.display = "none";

    //remove all events from buttons by cloning and replacing them

    //remove all events from the cancel button
    var oldCancelButton = cancelButton;
    cancelButton = oldCancelButton.cloneNode(true);
    oldCancelButton.parentNode.replaceChild(cancelButton, oldCancelButton);

    //remove all events from the consumer's accept button
    var oldAcceptButton = acceptButton;
    acceptButton = oldAcceptButton.cloneNode(true);
    oldAcceptButton.parentNode.replaceChild(acceptButton, oldAcceptButton);

    //remove all events from the decline button
    var oldAvaReqDecline = avaReqDecline;
    avaReqDecline = oldAvaReqDecline.cloneNode(true);
    oldAvaReqDecline.parentNode.replaceChild(avaReqDecline, oldAvaReqDecline);

    //remove all events from the provider's accept button
    var oldAvaReqAccept = avaReqAccept;
    avaReqAccept = oldAvaReqAccept.cloneNode(true);
    oldAvaReqAccept.parentNode.replaceChild(avaReqAccept, oldAvaReqAccept);

    //remove all events from the pay button
    var oldPay = pay;
    pay = oldPay.cloneNode(true);
    oldPay.parentNode.replaceChild(pay, oldPay);

    //if there's an available request and it got canceled, hide the prompt
    document.getElementById("windowPromptAvaReq").style.height = "0";
    document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
  //  setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "none"; }, 510); //hide window prompt
}

//function to set innerHTML of requestText element depending on the status of the request
function setText(status, userIsRequester, request) {
    let text = '';
    //set text depending on the request's status
    switch (status) {
        case 'issued':
            text = "Searching for providers..." + "<br /><br />";
            text += "<b>Requested charge amount: </b>" + request.amount + " kWh";
            break;
        case 'matched':
            text = "Contacting nearby providers..." + "<br /><br />";
            text += "<b>Requested charge amount: </b>" + request.amount + " kWh";
            break;
        case 'pending':
            if (userIsRequester) text = "A provider had accepted your charge request." + "<br /><br />";
            else text = "Waiting for the confirmation..." + "<br /><br />";
            text += "<b>Requested charge amount: </b>" + request.amount + " kWh" + "<br />";
            text += "<b>Estimated price: </b>" + request.match.estAmount + " AED" + "<br />";
            text += "<b>Meet-up location: </b><br />";
            text += '<img src="./img/location-' + request.match.location + '.png" width="100%"><br />';
            break;
        case 'accepted':
            if (userIsRequester) {
                text = "Provider is on their way..." + "<br /><br />";
                text += "<b>Provider's car: </b>" + request.match.car.color + ' ' + request.match.car.brand + ' ' + request.match.car.model + ". Plate number: " + request.match.car.licenseNumber + "<br />";
            }
            else {
                text = "Go to meet-up location..." + "<br /><br />";
                text += "<b>Requester's car: </b>" + request.requester.car.color + ' ' + request.requester.car.brand + ' ' + request.requester.car.model + ". Plate number: " + request.requester.car.licenseNumber + "<br />";
            }
            text += "<b>Requested charge amount: </b>" + request.amount + " kWh" + "<br />";
            //text += "<b>Estimated price: </b>" + request.match.estAmount + " AED" + "<br />";
            text += "<b>Meet-up location: </b><br />";
            text += '<img src="./img/location-' + request.match.location + '.png" width="100%"><br />';
            break;
        case 'completed':
            text = "Finalizing Request..";
            break;
    }

    document.getElementById("requestText").innerHTML = text; //display text
}

//function to show the payment div and 'done' button. called when a request is almost completed
async function readyForDone(userId, user, userIsRequester, request) {
    //add event listener to pay button
    //pay.addEventListener("click", async function () {
    //    //if consumer had clicked done                                                                             ///////////////////////////////////////////////////////???????    delete?
    //    localStorage.setItem("reqid", user.requestRef.id);
    //    window.location.assign('../payment');
    //});

    if (user.activeRequest.completed != null) return; //user already clicked the done button

    //create and set a 'done' button
    var done = document.createElement("button");
    done.innerHTML = "<b>Done</b>";
    requestDiv.appendChild(done);//show done button

    //add event listener to the 'done' button.. user has completed the request, send update to the server
    done.addEventListener("click", async function () {
        if (!confirm("Are you sure your request is done?")) return;
        //get the other user's id
        let user2Id;
        userIsRequester ? user2Id = request.match.provider : user2Id = request.requester.uid;

        //send users and request IDs to the server
        const d = { userId, user2Id, userIsRequester, requestId: user.activeRequest.id };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(d)
        };
        const response = await fetch('/requestComplete', options);
        const j4 = await response.json();
        console.log(j4);

        done.style.display = "none";
        //const Done = Date.now();//this now calculate only the time until the user clicks done not when the request is complete
        //const time = Done - inProgress;//have to fix this                                                                  ///////////////////////////////////////////////////////???????    what's the point? delete?
        //console.log("Time to complete =" + time);
    });
}