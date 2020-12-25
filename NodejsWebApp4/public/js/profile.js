const account = document.getElementById('account');
const Request = document.getElementById('Request');
const displayNameHolder = document.getElementById('displayNameHolder');
const photoHolder = document.getElementById('photoHolder'); 
const avaReq = document.getElementById('avaReq');
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
var carDiv = document.getElementById("carDiv");
var requestInfoDiv = document.getElementById("requestInfoDiv");
var acceptedDiv = document.getElementById("accepted");

//For when selecting a car when making a request
var carBrand = null;
var carModel, carColor, carNum, consumption, batteryCapacity, sliderOutput=0;
var selected = false;

//For when theres an active request
var userIsRequester = false;

firebase.auth().onAuthStateChanged(function (user) {
    if (user){
        var userId = firebase.auth().currentUser.uid; //current user
        
        setStatus(userId); //User status

        firebase.database().ref('users/' + userId + '/activeRequest').on('value', function (snapshot) {
            //Check if user has an active request
            if (snapshot.exists()) {
                if (acceptedDiv.style.display != "block") {
                    acceptedDiv.style.display = "block";
                    requestDiv.style.display = "none";
                }

                var snap = snapshot.val();
                console.log(snap);

                if (snap.role == "requester") userIsRequester = true; //current user is the requester

                //Display text
                var text;
                if (snap.dbref == "issued")
                    text = "Searching for providers...";
                else if (snap.dbref == "completed")
                    text = "Finalizing Request..";
                else if (userIsRequester == true) {
                    text = "Provider is on their way...";
                    inProgress = Date.now();
                    console.log(inProgress);
                }
                else {
                    inProgressPro = Date.now();
                    console.log(inProgressPro);
                    text = "Go to meet-up location...";
                }
                document.getElementById("p2").innerHTML = text;

                //get Request information
                var reqRef = firebase.database().ref('activeRequests/' + snap.dbref + '/' + snap.id); //request's Reference
                reqRef.once('value', function (snapshot) {
                    //empty div
                    var div = document.getElementById("req");
                    while (div.firstChild)
                        div.removeChild(div.firstChild);

                    if (snap.dbref != "completed") {
                        var data = snapshot.val(); //get all accepted requests info
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
                        
                        var complete=false;
                        var done = document.createElement("button");
                        done.innerHTML = "<b>Done</b>";
                        div.appendChild(done);//add the button to html

                        //need to get the other user's id
                        firebase.database().ref('users').on('value', function (snapshot2) {

                            var ndata = snapshot2.val();
                            var nkeys = Object.keys(ndata);
                            for (var i = 0; i < nkeys.length; i++) { //need to show only the associated requests with the user
                                var k = nkeys[i];
                                try {
                                    var requestId = ndata[k].activeRequest.id;
                                } catch (error) {//if user doesn't have an active request catch and continue loop
                            continue;
                                 }
                                if (requestId != snap.id) continue;
                                if (k == userId) continue;
                                user2Id = k;
                                console.log(k);
                                user2status = ndata[k].activeRequest.dbref;
                                break;
                            }
                        });

                        done.addEventListener("click", function () {
                            if (confirm("Are you sure your request is done?") == false) return;
                            if (userIsRequester) {//delete this if condition it is useless now
                                firebase.database().ref('users/' + userId).child("activeRequest").update({ dbref: "completed" });
                                //if status is scompleted do change status to complete and move request
                                if (user2status == "completed") {
                                    complete = true;
                                    console.log("complete is now true");
                                }
                            } else {
                                firebase.database().ref('users/' + userId).child("activeRequest").update({ dbref: "completed" });
                                 //is status is completed do change status to complete and move request
                                if (user2status == "completed") {
                                    complete = true;
                                    console.log("complete is now true");
                                }
                            } 

                            //if both users had clicked done 
                            if (complete == true) {
                                const Done = Date.now();
                                const time = Done - inProgress;
                                console.log("Time to complete =" + time);
                                console.log("status is finally complete....");
                                //move object to another path //don't forget to add for the supplier??
                                var oldRef = firebase.database().ref('activeRequests/accepted/' + snap.id);
                                oldRef.update({ 'status': "completed" });
                                var newRef1 = firebase.database().ref('previousRequests/' + userId + '/' + snap.id);
                                var newRef2 = firebase.database().ref('previousRequests/' + user2Id + '/' + snap.id);
                                copyFirebaseObject(oldRef, newRef1);
                                moveFirebaseObject(oldRef, newRef2);
                                //delete active request from both users
                                firebase.database().ref('users/' + userId + '/activeRequest').remove();//delete from the current user
                                firebase.database().ref('users/' + user2Id + '/activeRequest').remove();//delete from the other user
                                console.log(snap.id);
                            }
                        });
                    }

                    if (snap.dbref != "completed") {
                        (function (index) {
                            button.addEventListener("click", function () {
                                if (confirm("Are you sure you want to cancel the request?") == false) return;
                                //if the requester is canceling the request
                                var newRef = firebase.database().ref('previousRequests/' + userId + '/' + snap.id);
                                var newRef2 = firebase.database().ref('previousRequests/' + user2Id + '/' + snap.id);
                                if (userIsRequester == true) {
                                    if (snap.dbref == "issued") {
                                        var oldRef = firebase.database().ref('activeRequests/issued/' + snap.id);
                                        oldRef.update({ 'status': "canceled" });
                                        moveFirebaseObject(oldRef, newRef);
                                        console.log("I am here in issued ");
                                    }
                                    else {
                                        var oldRef = firebase.database().ref('activeRequests/accepted/' + snap.id);
                                        oldRef.update({ 'status': "canceled" });
                                        copyFirebaseObject(oldRef, newRef2);
                                        moveFirebaseObject(oldRef, newRef);
                                        firebase.database().ref('users/' + user2Id + '/activeRequest').remove();
                                        console.log("I am here in accepted ");

                                    }
                                }
                                else {  //if the supplier is canceling
                                    firebase.database().ref('activeRequests/issued').child(index).set({
                                        amount: data.amount,
                                        requester: data.requester
                                    });
                                    firebase.database().ref('activeRequests/accepted/' + index).remove();
                                    firebase.database().ref('users/' + data.requester.uid).child("activeRequest").update({ dbref: "issued" });

                                }
                                firebase.database().ref('users/' + userId + '/activeRequest').remove();
                            });
                        })(snap.id)
                    }
                });
            } 
            //No active requests - user can make a request
            else {
                if (requestDiv.style.display != "block") {
                    acceptedDiv.style.display = "none";
                    requestDiv.style.display = "block";
                    carDiv.style.display = "block";
                    requestInfoDiv.style.display = "none";
                }

                displayCars(userId); //Display user cars buttons
            }
        });
    } else window.location.assign('../');
});

//show and set user status
async function setStatus(userId) {
    var snapshot = await firebase.database().ref('users/' + userId + '/status').once('value');

    var stat = snapshot.val();
    if (stat == null) {
        stat = "Available";
        firebase.database().ref('users/' + userId).update({ status: stat });
    }
    let op = document.createElement("option");
    op.value = stat; op.text = stat;
    document.getElementById("status").appendChild(op);
    let op2 = document.createElement("option");
    if (stat == "Available")
        op2.text = "Do Not Disturb";
    else op2.text = "Available";
    op2.value = op2.text;
    document.getElementById("status").appendChild(op2);

    document.getElementById("status").addEventListener('change', (event) => {
        let newStat = event.target.value;
        firebase.database().ref('users/' + userId).update({ status: newStat });
    });
}

//move requests in DB
function moveFirebaseObject(oldRef, newRef) {//normal function not a firebase function
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { oldRef.remove(); console.log("move successful")}
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}

//copy requests in DB
function copyFirebaseObject(oldRef, newRef) {//normal function not a firebase function
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { console.log("copy successful") }
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}

//display registered cars as buttons
async function displayCars(userId) {
    var cars = document.getElementById("cars");
    while (cars.firstChild) cars.removeChild(cars.firstChild); //clear cars div
    var snapshot = await firebase.database().ref('users/' + userId + '/cars').once('value');
    var data = snapshot.val(); //get all car inf

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

//show request fields
async function continueReq() {
    if (carBrand == null) {
        alert("Please pick a car first");
        return;
    }
    var snapshot = await firebase.database().ref('carList/' + carBrand + '/' + carModel).once('value');
    consumption = snapshot.val().avgConsumption; //from carList
    batteryCapacity = snapshot.val().batteryCapacity; //from carList

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

    carDiv.style.display = "none";
    requestInfoDiv.style.display = "block";
}

//clear and hide requests fields, show cars div
function back() {
    document.getElementById("amount").value = '';
    //show car selection menu
    requestInfoDiv.style.display = "none";
    carDiv.style.display = "block";
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
function sendNotifications(e) {
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
    var newReq = firebase.database().ref('activeRequests/issued').push();
    reqStart = new Date().toString();
    console.log(reqStart);
    newReq.set({
        amount: neededEnergy, 
        timestamp: reqStart,
        requester: {
            uid: userId,
            currentEnergy: currentEnergy,
            currentSoC: currentSoC,
            maxDistance: maxDistance,
            car: {
                brand: carBrand,
                model: carModel,
                color: carColor,
                licenseNumber: carNum
            }
            
        }
        
    }).then(() => {
        firebase.database().ref('users/' + userId).child("activeRequest").set({ id: newReq.key, dbref: "issued", role: "requester" });
        alert("Your Request has Been Made!");

        document.getElementById("amount").value = '';
        document.getElementById("car").innerHTML = '';
    })
}



