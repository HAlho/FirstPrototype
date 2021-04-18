var buttonsDiv = document.getElementById("buttons");
var requestForm = document.getElementById("requestForm");

var requestDiv = document.getElementById("request");
var div = document.getElementById("req");
var cancelButton = document.getElementById('cancel');
var acceptButton = document.getElementById('accept');
var paymentDiv = document.getElementById("payment");
var pay = document.getElementById('pay');

var avaReqCancel = document.getElementById("avaReqCancel");
var avaReqAccept = document.getElementById('avaReqAccept');

let inProgress;


const auth = firebase.auth();

auth.onAuthStateChanged(user => {
    console.log(user);
})

document.getElementById('avaReq').addEventListener('click', () => {
    if (!document.getElementById('avaReq').classList.contains('disabled')) {
        document.getElementById("dimContent").classList.add("dimVisible");
        setTimeout(function () { document.getElementById("windowPromptAvaReq").style.display = "block"; }, 250);
    }
});
document.getElementById('closeAvaReq').addEventListener('click', () => {
    document.getElementById("dimContent").classList.remove("dimVisible");
    document.getElementById("windowPromptAvaReq").style.display = "none";
});


document.getElementById('account').addEventListener('click', () => {
    window.location.assign('../account');
});

document.getElementById("edit").addEventListener("click", function () {
    window.location.replace('../carSelect');
}); 

document.getElementById("requestFormToggle").addEventListener('click', () => {
    if (carBrand == null) {
        if (confirm("You can't request charge until you add your car information. Would you like to do that now?"))
            window.location.replace("../registerCar");
    } else {
        document.getElementById("requestFormToggle").style.display = "none";
        document.getElementById("avaReq").style.display = "none";
        requestForm.style.display = "block";
        document.getElementById("cancelRequest").style.display = "block";
    }
});

document.getElementById("cancelRequest").addEventListener('click', () => {
    requestForm.style.display = "none";
    document.getElementById("cancelRequest").style.display = "none";
    document.getElementById("requestFormToggle").style.display = "block";
    document.getElementById("avaReq").style.display = "block";
});

document.getElementById('SRequest').addEventListener('click', sendNotifications);


firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user
        notificationPermission(userId); //check if notifications permission is allowed and stored
        locationPermission(); //check if location access is allowed and stored
        displayCurrentCar(userId); //get and display the user's current car
        profilePage(userId); //check if the user has active requests
    }
    else window.location.assign('../');
});


//check if notifications permission is allowed and stored
function notificationPermission(userId) { //check notification permissions
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(function (result) {
            localStorage.setItem('notificationsPermission', result);
            if (result == "granted") { //create token
                const messaging = firebase.messaging();
                messaging.onTokenRefresh(handleTokenRefresh);
                messaging.requestPermission()
                    .then(() => handleTokenRefresh())
                    .catch(function (err) {
                        console.log('Error with notification token');
                    });
                function handleTokenRefresh() {
                    return messaging.getToken({ vapidKey: "BG9S8oj5kmcXZt1xaqHgmOCJgIcPHXgBaFing5JMUr4wlVbhlWXPwrbkikqKVAoVDZ2Fe31uCqpqQLJqAz18RyU" })
                        .then(async function (token) {
                            //console.log(token);
                            const d = { userId: userId, token: token };
                            const options = {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(d)
                            };
                            const response = await fetch('/addToken', options);
                            const j = await response.json();
                        })
                }
            }
        });
    } else if (Notification.permission === 'denied' || localStorage.getItem('notificationsPermission') == null || localStorage.getItem('notificationsPermission') == 'default')
        localStorage.setItem('notificationsPermission', Notification.permission);

    console.log('notification permission ' + localStorage.getItem('notificationsPermission'));
}


//check if location access is allowed and stored
function locationPermission() {
    //get current location permission state
    navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
        if (result.state === 'prompt') {
            //ask user for location access
            navigator.geolocation.getCurrentPosition(async position => {
                localStorage.setItem('locationPermission', 'granted');
            }, function () {
                document.getElementById("location").checked = false;
                localStorage.setItem('locationPermission', 'denied');
                alert("Location permission blocked. Please enable them in your browser.");
            });
        } else if (result.state === 'denied' || localStorage.getItem('locationPermission') == null) {
            localStorage.setItem('locationPermission', result.state);
        }
    });
    console.log('location permission ' + localStorage.getItem('locationPermission'));
}


//For when selecting a car when making a request
var carBrand = null;
var carModel, carColor, carNum, consumption, batteryCapacity, sliderOutput = 0;
var selected = false;

//get and display the user's current car
async function displayCurrentCar(userId) {
    //get car information from the server
    const sdata = { userId };
    console.log(sdata);
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getCurrentCar', options);
    const json = await response.json();

    //display car information
    if (json.status == "success") {
        carBrand = json.car.brand;
        carModel = json.car.model;
        carColor = json.car.color;
        carNum = json.car.licenseNumber;
        consumption = json.consumption;
        batteryCapacity = json.batteryCapacity;
        let carInfo = "<b>CURRENT CAR </b> <br></br>" + carBrand + ' ' + carModel + " (Plate No.: " + carNum + ')';
        document.getElementById("currentCarInfo").innerHTML = carInfo;
        document.getElementById("edit").style.display = "block";
        setSlider(); //set charge request slider 
    } else {
        carBrand = null;
    }
}

//show request fields
async function setSlider() {
    document.getElementById("max").innerHTML = batteryCapacity + " kWh";

    var sliderDiv = document.getElementById("slider");
    while (sliderDiv.firstChild) sliderDiv.removeChild(sliderDiv.firstChild);

    var container = document.getElementsByClassName('slidecontainer')[0];
    var slider = document.createElement("input");
    slider.type = 'range';
    slider.max = batteryCapacity;
    slider.value = 0;
    container.prepend(slider);

    var value = document.getElementById("value");
    value.innerHTML = slider.value;

    slider.oninput = function () {
        value.innerHTML = this.value + " kWh";
        sliderOutput = this.value;
    }
}


//For when theres an active request
var userIsRequester = false;
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

//check if user has any active requests
async function profilePage(userId) {
    var j6 = { status: null, update: null };
    var initial = true;
    var currentStatus = null;
    var matchedDisplay = false;

    while (1) {
        console.log(matchedDisplay);
        //get user information
        const d = { userId };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(d)
        };
        const response = await fetch('/userRequest', options);
        const j1 = await response.json();
        console.log(j1.user);
        const user = j1.user;

        
        if (j6.update == true || initial) {
            showStatus(userId);
            initial = false;

            //check if the user has an active request
            if (user.activeRequest != null) {
                //check request status and if the user is the requester
                var requestRef = user.activeRequest; //request information reference (db path: 'users/userId/activeRequest')
                currentStatus = requestRef.dbref;
                if (requestRef.role == "requester") userIsRequester = true; //current user is the requester

                //get request information
                const d = { userId: userId, dbref: requestRef.dbref, id: requestRef.id };
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(d)
                };
                const response = await fetch('/getActiveRequest', options);
                const j2 = await response.json();
                console.log(j2.req);
                var request = j2.req; //get all accepted requests info

                //set and display current request information
                //show request div
                hideAllElements();
                requestDiv.style.display = "block";

                //empty div to display current request information
                while (div.firstChild)
                    div.removeChild(div.firstChild);

                //set request information
                if (requestRef.dbref != "completed") {
                    amount = request.amount;
                    if (!userIsRequester) {
                        var car = request.requester.car;
                        var c = document.createElement("small");
                        c.innerHTML = "\n<b>Requester's car:</b> " + car.color + " " + car.brand + " " + car.model + ". License Number:" + car.licenseNumber + "\n\n";
                        div.appendChild(c);
                    }
                    var amt = document.createElement("small");
                    amt.innerHTML = "<b>Charge Amount:</b> " + amount + " kW \n\n\n";
                    div.appendChild(amt);
                }

                //set text message
                setText(requestRef.dbref, userIsRequester, request);

                //set the cancel button
                cancelButton.addEventListener("click", async function () {
                    if (requestRef.dbref != "completed") {
                        if (confirm("Are you sure you want to cancel the request?") == false) return;
                        const d = { userId: userId, userIsRequester: userIsRequester, requestRef: requestRef, req: request, matchedProviderFlag: false };
                        const options = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(d)
                        };
                        const response = await fetch('/cancelRequest', options);
                        const j5 = await response.json();
                        console.log(j5);
                    }
                });
                cancelButton.style.display = "block";

                switch (currentStatus) {
                    case 'issued':
                        break;
                    case 'matched':
                        break;
                    case 'pending':
                        if (userIsRequester) {
                            //set and display the accept button
                            acceptButton.addEventListener("click", async function () {
                                const d9 = { userId: userId, status: requestRef.dbref, requestId: requestRef.id, provider: request.match.provider };
                                const mcOptions = {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(d9)
                                };
                                const mcResponse = await fetch('/cmAccept', mcOptions);
                                const j9 = await mcResponse.json();
                                console.log(j9.req);

                            });
                            acceptButton.style.display = "block";
                        }
                        break;
                    case 'accepted':
                        if (userIsRequester) {
                            inProgress = Date.now();
                            console.log(inProgress);
                        } else {
                            inProgressPro = Date.now();
                            console.log(inProgressPro);
                        }
                        readyForDone(userId, user, requestRef);
                        break;
                    case 'completed':
                        //show the payment to the consumer
                        paymentDiv.style.display = "block";
                        pay.addEventListener("click", async function () {
                            //    //if consumer had clicked done
                            const p1 = { req: j1.user.activeRequest.id };
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

                        break;
                    default:

                }
            } else if (user.status == 'Available' || (matchedDisplay == true && user.status != 'matched')) {
                matchedDisplay = false;
                currentStatus = null;
                if (buttonsDiv.style.display != "block") {
                    hideAllElements();
                    buttonsDiv.style.display = "block";
                    document.getElementById('requestFormToggle').style.display = 'block';
                    document.getElementById('avaReq').style.display = 'block';
                }
            }
        } else if (user.status == 'matched' && matchedDisplay == false) {
            matchedDisplay = true;

            currentStatus = user.status;

            //get Request information
            const d = { userId: userId, dbref: "matched", id: j1.user.matchedReq };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(d)
            };
            const response = await fetch('/getActiveRequest', options);
            const j2 = await response.json();
            var request = j2.req;

            //show request information
            text = "User: " + request.requester.uid + "<br> location: " + request.match.location;
            document.getElementById("avaReqText").innerHTML = text;

            //set cancel button
            avaReqCancel.addEventListener("click", async function () {
                if (confirm("Are you sure you want to decline the request?") == false) return;
                const d = { userId: userId, userIsRequester: userIsRequester, requestRef: j1.user.matchedReq, req: request, matchedProviderFlag: true };
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(d)
                };
                const response = await fetch('/cancelRequest', options);
                const j5 = await response.json();
                console.log(j5);

                document.getElementById("dimContent").classList.remove("dimVisible");
                document.getElementById("windowPromptAvaReq").style.display = "none";
                matchedDisplay = false;
            });

            //set accept button
            avaReqAccept.addEventListener("click", async function () {
                //paypal info
                var x = document.getElementById("paypal").value;

                const reqAccepted = new Date().toString();
                const reqId = request.requester.uid;
                const amount = request.amount;
                const reqInfo = request.requester;

                const sendData = { userId: userId, requestId: j1.user.matchedReq, reqId, amount, reqInfo, reqAccepted, paypal: x };
                console.log(sendData);

                const matchedOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendData)
                };
                const mresponse = await fetch('/mAccept', matchedOptions);
                const mjson = await mresponse.json();
                console.log(mjson);

                document.getElementById("dimContent").classList.remove("dimVisible");
                document.getElementById("windowPromptAvaReq").style.display = "none";
                matchedDisplay = false;
            });

            document.getElementById("avaReq").innerHTML = "Available Request";
            document.getElementById("avaReq").classList.remove("disabled");
        }

        await sleep(2000);


        if ('geolocation' in navigator && localStorage.getItem('locationPermission') == 'granted') {
            navigator.geolocation.getCurrentPosition(async position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const tim = position.timestamp;
                const d1 = { userId: userId, status: currentStatus, lat, lon, tim };
                options1 = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(d1)
                };
                const response1 = await fetch('/checkUpdates', options1); //check if the a user request's status changed, created, or deleted
                j6 = await response1.json();
                console.log(j6);
               
            });
        } else {
            console.log('geolocation not available');
            const d1 = { userId: userId, status: currentStatus };
            options1 = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(d1)
            };
            const response1 = await fetch('/checkUpdates', options1); //check if the a user request's status changed, created, or deleted
            j6 = await response1.json();
            console.log(j6);
        }
    }
}


function hideAllElements() {
    buttonsDiv.style.display = "none";
    requestForm.style.display = "none";
    requestDiv.style.display = "none";
    cancelButton.style.display = "none";
    acceptButton.style.display = "none";
    document.getElementById("paypal").style.display = "none";
    paymentDiv.style.display = "none";

    var oldCancelButton = document.getElementById("cancel");
    cancelButton = oldCancelButton.cloneNode(true);
    oldCancelButton.parentNode.replaceChild(cancelButton, oldCancelButton);

    var oldAcceptButton = document.getElementById("accept");
    acceptButton = oldAcceptButton.cloneNode(true);
    oldAcceptButton.parentNode.replaceChild(acceptButton, oldAcceptButton);

    var oldAvaReqCancel = document.getElementById("avaReqCancel");
    avaReqCancel = oldAvaReqCancel.cloneNode(true);
    oldAvaReqCancel.parentNode.replaceChild(avaReqCancel, oldAvaReqCancel);

    var oldAvaReqAccept = document.getElementById("avaReqAccept");
    avaReqAccept = oldAvaReqAccept.cloneNode(true);
    oldAvaReqAccept.parentNode.replaceChild(avaReqAccept, oldAvaReqAccept);
}

function setText(status, userIsRequester, request) {
    let text = '';
    switch (status) {
        case 'completed': text = "Finalizing Request.."; break;
        case 'issued': text = "Searching for providers..."; break;
        case 'matched': 
            text = "Contacting nearby providers..."; 
            break;
        case 'pending':
            if (userIsRequester) text = "A provider had accepted your charge request. <br> provider: " + request.match.provider + "<br>estimated price: "
                + request.match.estAmount + "<br> location: " + request.match.location;
            else text = "Waiting for the confirmation...";
            break;
        default:
            if (userIsRequester) text = "Provider is on their way...";
            else text = "Go to meet-up location...";
    }
    if (status == 'completed') text = "Finalizing Request..";

    document.getElementById("requestText").innerHTML = text;
    console.log(text);
}






async function readyForDone(userId, user, requestRef) {

    pay.addEventListener("click", async function () {
        //if consumer had clicked done
        localStorage.setItem("reqid", user.requestRef.id);
        window.location.replace('../payment');
    });

    var done = document.createElement("button");
    done.innerHTML = "<b>Done</b>";
    div.appendChild(done);//add the button to html

    //need to get the other user's id
    const d = { userId: userId, id: requestRef.id };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(d)
    };
    const response = await fetch('/getSecondUser', options);
    const j3 = await response.json();
    console.log(j3);

    user2Id = j3.user2Id;
    user2status = j3.user2status

    done.addEventListener("click", async function () {
        if (confirm("Are you sure your request is done?") == false) return;
        const d = { userId: userId, user2Id: user2Id, user2status: user2status, id: requestRef.id };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(d)
        };
        const response = await fetch('/updateComplete', options);
        const j4 = await response.json();
        console.log(j4);

        const Done = Date.now();//this now calculate only the time until the user clicks done not when the request is complete
        const time = Done - inProgress;//have to fix this
        console.log("Time to complete =" + time);
    });
}



//calculate needed charge given distance
function calculate() {
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


//Submit button is clicked
async function sendNotifications(e) {
    e.preventDefault();

    let currentEnergy = sliderOutput; //from Request
    let neededEnergy = document.getElementById("amount").value; //from Request

    if (neededEnergy == '') {
        alert("Please fill all fields first!");
        return;
    }

    if (neededEnergy == 0) {
        alert("You can't request 0 kWh");
        return;
    }

    let currentSoC = Math.round(((currentEnergy / batteryCapacity) * 10) * 10) / 10; //current SoC %
    let maxDistance = Math.round((currentEnergy / consumption) * 100) / 100; //max distance(km) requester can travel

    let cont = confirm("You're about to request " + neededEnergy + " kWh. Continue?");
    if (cont == false) return;
    var userId = firebase.auth().currentUser.uid;
    reqStart = new Date().toString();
    console.log(reqStart);
    const data = { userId, neededEnergy, reqStart, currentEnergy, currentSoC, maxDistance, carBrand, carModel, carColor, carNum };
    console.log(data);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/newRequest', options);
    const json = await response.json();
    console.log(json);

    alert("Your Request has Been Made!");

    document.getElementById("amount").value = '';

    location.reload();
}



