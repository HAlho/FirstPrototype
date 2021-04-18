// JavaScript source code
//html elements global variables
var buttonsDiv = document.getElementById("buttons"); //buttonsDiv that contains 'request charge' and 'available request' buttons
var requestForm = document.getElementById("requestForm"); //requestForm div for users to make requests
//active request elements
var requestDiv = document.getElementById("request"); //if the user has an active request, it will be shown here
var div = document.getElementById("req"); //has active request info
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
var carModel, carColor, carNum, consumption, batteryCapacity; //store current car's info
var sliderOutput = 0; //store car's current state of charge
//For when theres an active request
var userIsRequester = false;



//html elements event listeners
//main menu account button event listeners
document.getElementById('account').addEventListener('click', () => {
    window.location.assign('../account'); //main menu account button to forward the user to the account page
});

//main menu account button event listener
document.getElementById("edit").addEventListener("click", function () {
    window.location.replace('../carSelect'); //button to change current car
}); 

//request form buttons
//when 'request charge' button is clicked, show the request form 
document.getElementById("showRequestForm").addEventListener('click', () => {
    if (carBrand == null) { //if user doesn't have any registered cars
        if (confirm("You can't request charge until you add your car information. Would you like to do that now?"))
            window.location.replace("../registerCar"); //forward user to registerCar page
    } else {
        buttonsDiv.style.display = "none"; //hide buttonsDiv
        requestForm.style.display = "block"; //show the request form
    }
});

//when 'cancel' button is clicked, hide the request form 
document.getElementById("cancelRequest").addEventListener('click', () => {
    requestForm.style.display = "none"; //hide request form
    buttonsDiv.style.display = "block"; //show buttonsDiv
});

//when 'send request' button is clicked, call function submitRequest()
document.getElementById('SRequest').addEventListener('click', submitRequest); 

//available request buttons
//button to show available request window prompt
document.getElementById('avaReq').addEventListener('click', () => {
    if (!document.getElementById('avaReq').classList.contains('disabled')) { //buttton is disabled if there is no available request
        document.getElementById("dimContent").classList.add("dimVisible"); //dim the screen behind the window prompt
        setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "block"; }, 250); //show available request
    }
});

//button to hide available request window prompt
document.getElementById('closeAvaReq').addEventListener('click', () => {
    document.getElementById("windowPromptAvaReq").style.display = "none"; //hide window prompt
    document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
});




//function that check if user is authenticated then calls other functions
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        var userId = firebase.auth().currentUser.uid; //current user ID

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

        showStatus(userId); //show user status in main menu (function is found in status.js)

        notificationPermission(); //check if notifications permission is allowed and stored
        locationPermission(); //check if location access is allowed and stored

        displayCurrentCar(userId); //get and display the user's current car

        profilePage(userId); //check if the user has active requests
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

//function to set delay
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

//function to check if notifications permission is granted and stored
function notificationPermission() {
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


//get and display the user's current car
async function displayCurrentCar(userId) {
    //get car information from the server
    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getCurrentCar', options);
    const json = await response.json(); //server response

    //display car information
    if (!json.carsFlag) { //user does not have any registered cars
        carBrand = null;
        document.getElementById('noCar').style.display = 'block';
    } else if (!json.currentCarFlag) //user has registered cars but no selected car
        window.location.replace('../carSelect');
    else { //user has a current car
        //get car information
        carBrand = json.car.brand;
        carModel = json.car.model;
        carColor = json.car.color;
        carNum = json.car.licenseNumber;
        consumption = json.consumption;
        batteryCapacity = json.batteryCapacity;
        //display car on page
        let carInfo = "<b>CURRENT CAR </b> <br></br>" + carBrand + ' ' + carModel + " (Plate No.: " + carNum + ')';
        document.getElementById("currentCarInfo").innerHTML = carInfo;
        document.getElementById("edit").style.display = "block";
        setSlider(); //set charge request slider 
    }
}

//set range slider with limits 0 to batteryCapacity (kWh) for user to set current car state of charge
async function setSlider() {
    var sliderDiv = document.getElementById("slider"); //get sliderDiv
    while (sliderDiv.firstChild) sliderDiv.removeChild(sliderDiv.firstChild); //clear sliderDiv

    //create a range slider and append it to sliderDiv
    var slider = document.createElement("input"); 
    slider.type = 'range';
    slider.max = batteryCapacity;
    slider.value = 0;
    sliderDiv.prepend(slider);

    document.getElementById("max").innerHTML = batteryCapacity + " kWh"; //display the max range of the slider
    var value = document.getElementById("value"); //element to display slider value
    value.innerHTML = slider.value; //display slider value (initial value is set to 0)

    //if slider.value was changed, display slider value
    slider.oninput = function () { 
        value.innerHTML = this.value + " kWh";
        sliderOutput = this.value;
    }
}


//check if user has any active requests
async function profilePage(userId) {
    var status, previousStatus = null; //if there's an active request, store the status of the request, otherwise store the status of the user
    var userIsRequester = false; //set true if user has an active request and is the requester

    while (1) {
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
            showStatus(userId, status); //update status icon in the main menu

            let request, requestId; //store request informationa and request ID (if exists)
            //if there's an active/matched request, get request information
            if (status != 'Available' && status != 'Do Not Disturb') { //there's an active request
                user.status == 'Busy' ? requestId = user.activeRequest.id : requestId = user.matchedReq; //get request id

                //send request ID to the server and get back the request's information
                const d = { dbref: status, requestId };
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
                    await sleep(5000);
                    location.reload(); //reload page to avoid errors
                }
            }

            //update html page depending on the user / request status
            if (status == 'Available' || status == 'Do Not Disturb') { //user does not have any active requests
                var userIsRequester = false; //reset userIsRequester variable
                document.getElementById('avaReq').classList.add('disabled'); //reset avaReq button display

                //hide all elements and show buttonsDiv only
                hideAllElements();
                buttonsDiv.style.display = "block";
            } else if (status == 'matched' && !userIsRequester) { //user is a possible provider and got matched to an active request
                //set and display matched request information
                //show request information
                text = "User: " + request.requester.uid + "<br> location: " + request.match.location;
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
                    document.getElementById("dimContent").classList.remove("dimVisible");
                    document.getElementById("windowPromptAvaReq").style.display = "none";
                });

                //set accept button
                avaReqAccept.addEventListener("click", async function () {
                    //set request info
                    var paypal = document.getElementById("paypal").value; //provider's paypal info
                    const reqId = request.requester.uid; //requester ID

                    //send user and request info to the server to accept request
                    const sendData = { userId, requestId, reqId, paypal};
                    const matchedOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sendData)
                    };
                    const mresponse = await fetch('/matchAccept', matchedOptions);
                    const mjson = await mresponse.json();

                    //hide available request window prompt
                    document.getElementById("dimContent").classList.remove("dimVisible");
                    document.getElementById("windowPromptAvaReq").style.display = "none";
                });

                //enable available request button
                document.getElementById("avaReq").innerHTML = "Available Request";
                document.getElementById("avaReq").classList.remove("disabled");

                 //show available request window prompt
                document.getElementById("dimContent").classList.add("dimVisible"); //dim the screen behind the window prompt
                setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "block"; }, 250);

            } else { //user has an active request
                //set and display current request information
                //hide all elements and show request div
                hideAllElements();
                requestDiv.style.display = "block";

                //empty div to display/update current request information
                while (div.firstChild) div.removeChild(div.firstChild);

                //set and display request information
                if (status != "completed") {
                    //display requested charge amount
                    amount = request.amount;
                    var amt = document.createElement("small");
                    amt.innerHTML = "<b>Charge Amount:</b> " + amount + " kW \n\n\n";
                    div.appendChild(amt);

                    //display requester information
                    if (!userIsRequester) { 
                        var car = request.requester.car; //get requester's car
                        var c = document.createElement("small");
                        c.innerHTML = "\n<b>Requester's car:</b> " + car.color + " " + car.brand + " " + car.model + ". License Number:" + car.licenseNumber + "\n\n"; 
                        div.appendChild(c); //display requester's car
                    }
                }

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

                } else if (status == 'accepted') {
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

                } else if (status == 'completed' && userIsRequester) {  //consumer should pay

                    //add event listener to 'pay' button
                    pay.addEventListener("click", async function () {                                                                        ///////////////////////////////////////////////////////??????? not sure what to comment
                        const p1 = { req: user.activeRequest.id, match: request.match };
                        const poptions1 = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(p1)
                        };
                        const presponse1 = await fetch('/pay', poptions1);
                        const pj1 = await presponse1.json();
                        console.log(pj1.req);
                        window.location = pj1.forwardLink;
                    });

                    //show the payment to the consumer
                    paymentDiv.style.display = "block";
                }

            }
        }

        await sleep(2000);

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
                json = await response1.json();
            });
        } else console.log('geolocation not available'); //location access is not allowed
    }
}




//function to hide all request-related elements on the page 
//remove all events from buttons by cloning and replacing them
function hideAllElements() {
    //hide all request-relate elements
    buttonsDiv.style.display = "none";
    requestForm.style.display = "none";
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
}

//function to set innerHTML of requestText element depending on the status of the request
function setText(status, userIsRequester, request) {
    let text = '';
    //set text depending on the request's status
    switch (status) {
        case 'issued':
            text = "Searching for providers...";
            break;
        case 'matched':
            text = "Contacting nearby providers...";
            break;
        case 'pending':
            if (userIsRequester) text = "A provider had accepted your charge request. <br> provider: " + request.match.provider + "<br>estimated price: "
                + request.match.estAmount + "<br> location: " + request.match.location;
            else text = "Waiting for the confirmation...";
            break;
        case 'accepted':
            if (userIsRequester) text = "Provider is on their way...";
            else text = "Go to meet-up location...";
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
    //    window.location.replace('../payment');
    //});

    //create and set a 'done' button
    var done = document.createElement("button");
    done.innerHTML = "<b>Done</b>";
    div.appendChild(done);//show done button

    //add event listener to the 'done' button.. user has completed the request, send update to the server
    done.addEventListener("click", async function () {
        if (!confirm("Are you sure your request is done?")) return;
        //get the other user's id
        let user2Id;
        userIsRequester ? user2Id = request.match.provider : user2Id = request.requester.uid;

        //send users and request IDs to the server
        const d = { userId, user2Id, requestId: user.activeRequest.id };
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

        //const Done = Date.now();//this now calculate only the time until the user clicks done not when the request is complete
        //const time = Done - inProgress;//have to fix this                                                                  ///////////////////////////////////////////////////////???????    what's the point? delete?
        //console.log("Time to complete =" + time);
    });
}









//calculate needed charge given distance         
function calculate() {                                                         //Not sure how to comment because we should add a map first  ......................          ///////////////////////////////////////////////////////???????
    document.getElementById("amount").value = '';
    let input = prompt("Travel Distance (km):");
    let distance = parseInt(input);
    let currentEnergy = sliderOutput; //from Request
    let totalNeededEnergy = distance * consumption;
    let energyNeeded = Math.round((totalNeededEnergy - currentEnergy) * 10) / 10;

    if (energyNeeded <= 0) {
        alert("You need " + totalNeededEnergy + " kWh to Reach that destination. You already have enough charge!");
        return;
    }
    document.getElementById("amount").value = energyNeeded;
}


//user requested charge, submit button was clicked
async function submitRequest() {
    let userId = firebase.auth().currentUser.uid;

    //get request information
    let currentEnergy = sliderOutput; //current energy set by user in the slider range
    let neededEnergy = document.getElementById("amount").value; // needed energy amount inputted by user

    //prevent request if an input is invalid
    if (neededEnergy == '') { //needed energy field is empty
        alert("Please fill all fields first!"); return;
    }
    if (neededEnergy == 0) { //needed energy = 0
        alert("You can't request 0 kWh"); return;
    }
    //if (neededEnergy > (batteryCapacity - currentEnergy)) { //needed energy exceeds battery size
    //    alert("Amount too big"); return;
    //}

    //calculate state of charge % and max distance user can take
    let currentSoC = Math.round(((currentEnergy / batteryCapacity) * 10) * 10) / 10; //current SoC %
    let maxDistance = Math.round((currentEnergy / consumption) * 100) / 100; //max distance(km) requester can travel

    //confirm request before continuing
    if (!confirm("You're about to request " + neededEnergy + " kWh. Continue?")) return; 

    //send request information to the server to submit the request
    reqStart = new Date().toString();
    const data = { userId, neededEnergy, reqStart, currentEnergy, currentSoC, maxDistance, carBrand, carModel, carColor, carNum };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    const response = await fetch('/submitRequest', options);
    const json = await response.json();

    
    alert("Your Request has Been Made!"); 
    document.getElementById("amount").value = '';
}