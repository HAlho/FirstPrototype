const logOut = document.getElementById('logOut');
const modifyAccount = document.getElementById('modifyAccount');
const Request = document.getElementById('Request');
const displayNameHolder = document.getElementById('displayNameHolder');
const photoHolder = document.getElementById('photoHolder'); 
const avaReq = document.getElementById('avaReq');
const regCar = document.getElementById('regCar'); 
const acRequests = document.getElementById('acRequests');
const reqHistory = document.getElementById('reqHistory')
const SRequest = document.getElementById('SRequest');
SRequest.addEventListener('click', sendNotifications);

const auth = firebase.auth();

logOut.addEventListener('click', () => {
    //signOut() is a built in firebase function responsible for signing a user out
    auth.signOut()
    .then(() => {
        window.location.assign('../');
    })
    .catch(error => {
        console.error(error);
    })
})

auth.onAuthStateChanged(user => {
    console.log(user);
    
})

//Go to modification page
modifyAccount.addEventListener('click', () => {
    window.location.assign('../edit');
});

reqHistory.addEventListener('click', () => {
    window.location.assign('../requestHistory');
});

avaReq.addEventListener('click', () => {
    window.location.assign('../avaReq');
});

regCar.addEventListener('click', () => {
    window.location.assign('../registerCar');
});

//For when selecting a car when making a request
var carBrand, carModel, carColor, carNum;
var selected = false;

//For when theres an active request
var userIsRequester = false;

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        var request = document.getElementById("request");
        var accepted = document.getElementById("accepted");
        var userId = firebase.auth().currentUser.uid; //current user

        //User status
        firebase.database().ref('users/' + userId + '/status').once('value', function (snapshot) {
            var stat = snapshot.val();
            if (stat == null) stat = "Available";
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
        });

        firebase.database().ref('users/' + userId + '/activeRequest').on('value', function (snapshot) {
            //Check if user has an active request
            if (snapshot.exists()) {
                if (request.style.display != "none")
                    //document.getElementById("request").remove(); //hide div request from html
                    request.style.display = "none";


                var snap = snapshot.val();
                console.log(snap);

                if (snap.role == "requester") userIsRequester = true; //current user is the requester

                //Display text
                var text;
                if (snap.dbref == "issued")
                    text = "Searching for suppliers...";
                else if (snap.dbref == "completed")
                    text = "Finalizing Request..";
                else if (userIsRequester == true)
                    text = "Supplier is on their way...";
                else
                    text = "Go to meet-up location...";
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
                            var carInfo = car.color + " " + car.brand + " " + car.model + ". License Number:" + car.licenseNumber + "\n";
                            var c = document.createTextNode(carInfo);
                            div.appendChild(c);
                        }


                        var amt = document.createTextNode("Charge Amount: " + amount + " kW \n\n");
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
                        done.innerHTML = "Done";
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
                            if (confirm("Are you sure your reuqest is done?") == false) return;
                            if (userIsRequester) {//delete this if condition it is useless now
                                firebase.database().ref('users/' + userId).child("activeRequest").update({ dbref: "completed" });
                               // firebase.database().ref('users/' + user2Id).child("activeRequest").update({ dbref: "rcompleted" });
                                //if status is scompleted do change status to complete and move request
                                if (user2status == "completed") {
                                    complete = true;
                                    console.log("complete is now true");
                                }
                            } else {
                                firebase.database().ref('users/' + userId).child("activeRequest").update({ dbref: "completed" });
                              //  firebase.database().ref('users/' + user2Id).child("activeRequest").update({ dbref: "scompleted" });
                                 //is status is rcompleted do change status to complete and move request
                                if (user2status == "completed") {
                                    complete = true;
                                    console.log("complete is now true");
                                }
                            }

                            //if both users had clicked done 
                            if (complete==true) {
                                console.log("status is finally complete....");
                                //move object to another path //don't forget to add for the supplier??
                                var oldRef = firebase.database().ref('activeRequests/accepted/' + snap.id);
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
                                        moveFirebaseObject(oldRef, newRef);
                                        console.log("I am here in issued ");
                                    }
                                    else {
                                        var oldRef = firebase.database().ref('activeRequests/accepted/' + snap.id);
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
                                //  window.location.replace('../profile'); //redirect user to main page
                            });
                        })(snap.id)
                    }
                });
            } 
            //No active requests - user can make a request
            else {
                if (accepted.style.display != "none") {
                    //document.getElementById("accepted").remove();
                    accepted.style.display = "none";
                    request.style.display = "block";
                }

                //Display user cars buttons
                firebase.database().ref('users/' + userId + '/cars').once('value', function (snapshot) {

                    var data = snapshot.val(); //get all car info
                    var keys = Object.keys(data); //get car ids
                    if (data == null) {
                        var button = document.createElement("button");
                        button.innerHTML = "Register Your Car";
                        document.getElementById("cars").appendChild(button);

                        button.addEventListener('click', function () {
                                window.location.assign('../registerCar');
                        });
                        
                    }
                    else {
                        for (var i = 0; i < keys.length; i++) {
                            var k = keys[i];
                            let brand = data[k].brand;
                            let model = data[k].model;
                            let color = data[k].color;
                            let licenseNumber = data[k].licenseNumber;

                            var button = document.createElement("button");
                            button.innerHTML = "<b>" + brand + ' ' + model + "</b><br>" + color + " | " + licenseNumber;
                            document.getElementById("cars").appendChild(button);

                            (function (index) {
                                button.addEventListener('click', function () {
                                    carBrand = data[index].brand;
                                    carModel = data[index].model;
                                    carColor = data[index].color;
                                    carNum = data[index].licenseNumber;
                                    document.getElementById("car").innerHTML = carBrand + ' ' + carModel;
                                    selected = true;
                                });
                            })(k)
                        }
                    }
                   
                });
            }
        });
    } else window.location.assign('../');
});

function moveFirebaseObject(oldRef, newRef) {//normal function not a firebase function
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { oldRef.remove(); console.log("move successful")}
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}

function copyFirebaseObject(oldRef, newRef) {//normal function not a firebase function
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (!error) { console.log("copy successful") }
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}

function sendNotifications(e) {
    e.preventDefault();

    if (document.getElementById("energy").value == '' || document.getElementById("distance").value == '') {
        alert("Please fill all fields first!");
        return;
    }

    if (selected == false) {
        alert("Please pick a car first!");
        return;
    }


    firebase.database().ref('carList/' + carBrand + '/' + carModel).once('value', function (snapshot) {
        let consumption = snapshot.val().avgConsumption; //from carList
        let batteryCapacity = snapshot.val().batteryCapacity; //from carList
        let currentEnergy = document.getElementById("energy").value; //from Request
        let neededDistance = document.getElementById("distance").value; //from Request

        var currentSoC = Math.round(((currentEnergy / batteryCapacity) * 100) * 100) / 100; //current SoC %

        let maxDistance = Math.round((currentEnergy / consumption) * 100) / 100; //max distance(km) requester can travel

        let totalNeededEnergy = consumption * neededDistance; //total energy(kWh) requester needs
        let energyNeeded = Math.round((totalNeededEnergy - currentEnergy) * 100) / 100; //energy(kWh) requester needs

        if (energyNeeded <= 0) {
            alert("You already have enough charge!");
            //clear all fields
            document.getElementById("energy").value = '';
            document.getElementById("distance").value = '';
            document.getElementById("car").innerHTML = '';
            return;
        } else {
            let cont = confirm("You're about to request " + energyNeeded + "kWh. Continue?");
            if (cont == false) return;
        }

        var userId = firebase.auth().currentUser.uid;
        var newReq = firebase.database().ref('activeRequests/issued').push();
        newReq.set({
            amount: energyNeeded,
            requester: {
                uid: userId,
                currentEnergy: currentEnergy,
                currentSoC: currentSoC,
                neededDistance: neededDistance,
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
            window.location.replace('../profile'); //redirect user to main page
        })
    });


}



