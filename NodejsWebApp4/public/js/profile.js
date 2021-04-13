const account = document.getElementById('account');
const Request = document.getElementById('Request');
const displayNameHolder = document.getElementById('displayNameHolder');
const photoHolder = document.getElementById('photoHolder'); 
const avaReq = document.getElementById('avaReq');
var mAccept = document.getElementById('mAccept');

var cmAccept = document.getElementById('cmAccept');
var pay = document.getElementById('pay');//<-------------------

let inProgress;

const SRequest = document.getElementById('SRequest');
SRequest.addEventListener('click', sendNotifications);

const auth = firebase.auth();

auth.onAuthStateChanged(user => {
    console.log(user);
})

avaReq.addEventListener('click', () => {
    window.location.assign('../avaReq');
});

account.addEventListener('click', () => {
    window.location.assign('../account');
});

var requestDiv = document.getElementById("request");
var requestInfoDiv = document.getElementById("requestInfoDiv");
var acceptedDiv = document.getElementById("accepted");
var matchedDiv = document.getElementById("matched");

//<----------------
var cmatchedDiv = document.getElementById("cmatched"); 
var paymentDiv = document.getElementById("payment");


//For when selecting a car when making a request
var carBrand = null;
var carModel, carColor, carNum, consumption, batteryCapacity, sliderOutput=0;
var selected = false;

//For when theres an active request
var userIsRequester = false;
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

firebase.auth().onAuthStateChanged(async function (user) {
    if (user){
        var userId = firebase.auth().currentUser.uid; //current user

        //check if notifications allowed
        if (Notification.permission === 'denied' || Notification.permission === 'default') {
            Notification.requestPermission().then(function (result) {
                console.log(result);
                if (result == "granted") {
                    //create token
                    // [START get_messaging_object]
                    // Retrieve Firebase Messaging object.
                    const messaging = firebase.messaging();

                    messaging.onTokenRefresh(handleTokenRefresh);

                    messaging.requestPermission()
                        .then(() => handleTokenRefresh())
                        .catch(function (err) {
                            console.log('Error');
                        });

                    function handleTokenRefresh() {
                        return messaging.getToken({ vapidKey:"BG9S8oj5kmcXZt1xaqHgmOCJgIcPHXgBaFing5JMUr4wlVbhlWXPwrbkikqKVAoVDZ2Fe31uCqpqQLJqAz18RyU"})
                            .then(async function (token) {
                                console.log(token);
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
                                console.log(j);
                                
                            })
                    }
                }
            });
        } 

        //----------------------------------------------------------------------------------------------------------        
        setStatus(userId); //User status
        displayCurrentCar(userId);
        profilePage(userId);
    }
 else window.location.assign('../');
});


async function profilePage(userId) {
    var j6 = { status: null, update: null };
    var initial = true;
    var curstatus = null;

    while (1) {
        // console.log(j6.update);

        if (j6.update == true || initial) {

            initial = false;

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

            //Check if user has an active request
            if (j1.user.activeRequest != null) {

                

                //pay.addEventListener("click", async function () {//
                //    const p1 = { userId: userId, req: j1.user.activeRequest.id };
                //    const poptions1 = {
                //        method: 'POST',
                //        headers: {
                //            'Content-Type': 'application/json'
                //        },
                //        body: JSON.stringify(p1)
                //    };
                //    const presponse1 = await fetch('/pay', poptions1);
                //    const pj1 = await presponse1.json();
                //    console.log(pj1.req);
                //});
                

                var snap = j1.user.activeRequest;
                curstatus = snap.dbref;
                if (snap.role == "requester") userIsRequester = true; //current user is the requester

                //get Request information
                const d = { userId: userId, status: snap.dbref, id: snap.id };
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

                var data = j2.req; //get all accepted requests info

                //Display text

                var text;
                if (snap.dbref == "issued") {
                    if (acceptedDiv.style.display != "block") {
                        acceptedDiv.style.display = "block";
                        requestDiv.style.display = "none";
                        // matchedDiv.style.display = "block";
                    }
                    text = "Searching for providers...";
                }
                else if (snap.dbref == "completed") {
                    if (acceptedDiv.style.display != "block") {
                        acceptedDiv.style.display = "block";
                        requestDiv.style.display = "none";
                        // matchedDiv.style.display = "block";
                    }
                    text = "Finalizing Request..";

                }
                else if (userIsRequester == true) {
                    if (snap.dbref == "matched") {//<--------------------
                        //show the user the accept button and the provider+price details

                        if (cmatchedDiv.style.display != "block") {
                            cmatchedDiv.style.display = "block";
                            acceptedDiv.style.display = "none";
                            requestDiv.style.display = "none";
                            matchedDiv.style.display = "none";
                        }

                        text = "A provider had accepted your charge request. <br> provider: " + data.match.provider + "<br>estimated price: "
                            + data.match.estAmount + "<br> location: " + data.match.location;
                        document.getElementById("p4").innerHTML = text;

                        console.log(text);

                        //accept button to move the request to accepted
                        cmAccept.addEventListener("click", async function () {//

                            const d9 = { userId: userId, status: snap.dbref, requestId: snap.id, provider: data.match.provider };
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

                            //hide matched display "none"
                            cmatchedDiv.style.display = "none";

                        });

                    } else {
                        if (acceptedDiv.style.display != "block") {
                            acceptedDiv.style.display = "block";
                            requestDiv.style.display = "none";
                            matchedDiv.style.display = "none";
                            cmatchedDiv.style.display = "none";

                        }
                        text = "Provider is on their way...";
                        inProgress = Date.now();
                        console.log(inProgress);
                    }
                }
                else {//for provider
                    if (acceptedDiv.style.display != "block") {
                        acceptedDiv.style.display = "block";
                        requestDiv.style.display = "none";
                        matchedDiv.style.display = "none";
                        cmatchedDiv.style.display = "none";

                    }
                    inProgressPro = Date.now();
                    console.log(inProgressPro);
                    text = "Go to meet-up location...";
                }
                document.getElementById("p2").innerHTML = text;

                console.log(snap.dbref);
                console.log(snap.id);




                //empty div
                var div = document.getElementById("req");
                while (div.firstChild)
                    div.removeChild(div.firstChild);

                if (snap.dbref != "completed") {
                    amount = data.amount;

                    //display request information
                    if (userIsRequester != true) {
                        var car = data.requester.car;
                        var c = document.createElement("small");
                        c.innerHTML = "\n<b>Requester's car:</b> " + car.color + " " + car.brand + " " + car.model + ". License Number:" + car.licenseNumber + "\n\n";
                        div.appendChild(c);
                    }

                    var amt = document.createElement("small");
                    amt.innerHTML = "<b>Charge Amount:</b> " + amount + " kW \n\n\n";
                    //var amt = document.createTextNode("<b>Charge Amount:</b> " + amount + " kW");
                    var button = document.createElement("button");
                    button.innerHTML = "Cancel";
                    div.appendChild(amt);
                    div.appendChild(button);
                }

                var readyForDone;
                if (snap.dbref == "accepted") {
                    readyForDone = true;
                }
                console.log(readyForDone);

                var user2Id;
                var user2status;

                if (readyForDone) {

                    //<------------------------------------
                    if (userIsRequester) {
                        //show the payment to the consumer
                        paymentDiv.style.display = "none";

                    }
                    pay.addEventListener("click", async function () {//<-------
                        //if consumer had clicked done
                        localStorage.setItem("reqid", j1.user.activeRequest.id);
                        window.location.replace('../payment');
                    });


                    var done = document.createElement("button");
                    done.innerHTML = "<b>Done</b>";
                    div.appendChild(done);//add the button to html

                    //need to get the other user's id
                    const d = { userId: userId, id: snap.id };
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




                        const d = { userId: userId, user2Id: user2Id, user2status: user2status, id: snap.id };
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
                } else if (snap.dbref == "completed") {
                    if (userIsRequester) {
                        //show the payment to the consumer
                        paymentDiv.style.display = "block";
                        //<------------------------------------
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
                    }

                   
                }

                if (snap.dbref != "completed") {
                    button.addEventListener("click", async function () {
                        if (confirm("Are you sure you want to cancel the request?") == false) return;

                        const d = { userId: userId, status: snap.dbref, user2Id: user2Id, id: snap.id, userIsRequester: userIsRequester, amount: amount, requester: data.requester };
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


                    });
                }
            }
            //No active requests - user can make a request


            else { //<----------------------------------------


                if (j1.user.status == "matched") {//it should be user status not request status
                    console.log("I am matched");

                    //get Request information
                    const d = { userId: userId, status: "matched", id: j1.user.matchedReq };
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

                    var data = j2.req; //get all accepted requests info


                    //show request information

                    console.log("There is a user nearby in need of charge.<br> User: " + data.requester.uid + " location: " + data.match.location);
                    if (matchedDiv.style.display != "block") {
                        matchedDiv.style.display = "block";
                        acceptedDiv.style.display = "none";
                        requestDiv.style.display = "none";
                        cmatchedDiv.style.display = "none";

                    }

                    text = "There is a user nearby in need of charge.<br> User: " + data.requester.uid + " location: " + data.match.location;
                    document.getElementById("p3").innerHTML = text;

                  



                    mAccept.addEventListener("click", async function () {//<-------------

                        //paypal info
                        var x = document.getElementById("paypal").value;
                        console.log("paypal info:" + x);

                        const reqAccepted = new Date().toString();
                        const reqId = data.requester.uid;
                        const amount = data.amount;
                        const reqInfo = data.requester;

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

                        //hide the matched display (none)
                        matchedDiv.style.display = "none";
                    });

                }
                else {
                    if (requestDiv.style.display != "block") {
                        acceptedDiv.style.display = "none";
                        requestDiv.style.display = "block";
                        //carDiv.style.display = "block";
                        requestInfoDiv.style.display = "none";
                        // matchedDiv.style.display = "block";


                    }
                    //displayCars(userId); //Display user cars buttons


                }





            }
        }
        //-----------------------------------------------------------------------------------------------------------

        await sleep(2000);

        if ('geolocation' in navigator) {
            //console.log('geolocation available');
            navigator.geolocation.getCurrentPosition(async position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const tim = position.timestamp;
                const d1 = { userId: userId, status: curstatus, lat, lon, tim };
                const options1 = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(d1)
                };
                const response1 = await fetch('/checkUpdates', options1);//check if the a user request's status changed, created, or deleted
                j6 = await response1.json();
                console.log(j6);
            });
        }
        else {
            console.log('geolocation not available');
            const d1 = { userId: userId, status: curstatus };
            const options1 = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(d1)
            };
            const response1 = await fetch('/checkUpdates', options1);//check if the a user request's status changed, created, or deleted
            j6 = await response1.json();
            console.log(j6);
        }



    }
}
//show and set user status
async function setStatus(userId) {

    const sdata = { userId };
    console.log(sdata);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getStat', options);
    const json = await response.json();
    console.log(json);
    stat = json.stat;
   
    let op = document.createElement("option");
    op.value = stat; op.text = stat;
    document.getElementById("status").appendChild(op);
    let op2 = document.createElement("option");
    if (stat == "Available")
        op2.text = "Do Not Disturb";
    else op2.text = "Available";
    op2.value = op2.text;
    document.getElementById("status").appendChild(op2);

    document.getElementById("status").addEventListener('change', async (event) => {
        let newStat = event.target.value;


        const data = { userId, newStat };
        console.log(data);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
        const response = await fetch('/pfile', options);
        const json = await response.json();
        console.log(json);
    });
}

//show current car
async function displayCurrentCar(userId) {
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
    if (json.status == "success") {
        carBrand = json.car.brand;
        carModel = json.car.model;
        carColor = json.car.color;
        carNum = json.car.licenseNumber;
        consumption = json.consumption;
        batteryCapacity = json.batteryCapacity;
        let carInfo = "<b>CURRENT CAR: </b>" + carBrand + ' ' + carModel + " (Plate No.: " + carNum + ')';
        document.getElementById("currentCarInfo").innerHTML = carInfo;
        document.getElementById("edit").style.display = "block";
        setSlider();
    } else {
        carBrand = null;
    }
}

document.getElementById("requestDivToggle").addEventListener('click', () => {
    if (carBrand == null) {

        if (confirm("You can't request charge until you add your car information. Would you like to do that now?"))
            window.location.replace("../registerCar");
    } else {
        if (requestInfoDiv.style.display == "none") {
            requestInfoDiv.style.display = "block";
            document.getElementById("requestDivToggle").innerHTML = "Cancel";
        } else {
            requestInfoDiv.style.display = "none";
            document.getElementById("requestDivToggle").innerHTML = "<b>Make a New Request</b>";
        }
    }
});

/*
//display registered cars as buttons
async function displayCars(userId) {
    var cars = document.getElementById("cars");
    while (cars.firstChild) cars.removeChild(cars.firstChild); //clear cars div

    const sdata = { userId };
    console.log(sdata);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/postCars', options);
    const json = await response.json();
    console.log(json);
    data = json.cars;

    //No registered cars
    if (data == null) {
        var text = document.createTextNode("You do not have any registered cars.\n")
        var button = document.createElement("button");
        button.innerHTML = "Register A Car";
        cars.appendChild(text);
        cars.appendChild(button);
        button.addEventListener('click', function () {
            window.location.assign('../registerCar');
        });
    }
    //List cars
    else {
        var keys = Object.keys(data); //get car ids
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            let brand = data[k].brand;
            let model = data[k].model;
            let color = data[k].color;
            let licenseNumber = data[k].licenseNumber;
            var button = document.createElement("button");
            button.innerHTML = "<b>" + brand + ' ' + model + "</b><br><small>" + color + " | " + licenseNumber + "</small>";
            cars.appendChild(button);

            (function (index) {
                button.addEventListener('click', function () {
                    carBrand = data[index].brand;
                    carModel = data[index].model;
                    carColor = data[index].color;
                    carNum = data[index].licenseNumber;
                    document.getElementById("car").innerHTML = "<b>Car:</b> " + carBrand + ' ' + carModel;
                    selected = true;
                });
            })(k)
        }
    }
}
*/

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

/*
//clear and hide requests fields, show cars div
function back() {
    document.getElementById("amount").value = '';
    //show car selection menu
    requestInfoDiv.style.display = "none";
    carDiv.style.display = "bloc
    k";
}
*/


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

    let cont = confirm("You're about to request " + neededEnergy +" kWh. Continue?");
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
    const response = await fetch('/reqInfo', options);
    const json = await response.json();
    console.log(json);

    alert("Your Request has Been Made!");

    document.getElementById("amount").value = '';
    document.getElementById("car").innerHTML = '';
}



document.getElementById("edit").addEventListener("click", function () {
    window.location.replace('../carSelect');
}); 