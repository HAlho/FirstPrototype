// JavaScript source code
const SLIDER_WIDTH = 175;

var carBrand, carModel, carColor, carNum, consumption, batteryCapacity; //store current car's info
var currentSoC = 0; //store car's current energy
var neededSoC = 0; //store car's needed energy
var longitude = 0
var latitude = 0;
var distance;

var step = 0;
//step 0: input current charge
//step 1: select request charge method
//step 2: request charge by destination
//step 3: request charge by amount



//back button event listener
document.getElementById("back").addEventListener("click", function () {
    if (step == 1) { //user is at 'select a request method' section
        step = 0;

        sliderCurrent.disabled = false; //enable current charge slider

        //show currentEnergy div, battery div, and the continue button
        document.getElementById("continue").style.display = "block";
        document.getElementById('currentEnergy').style.display = "block";
        //hide irrelevant divs
        document.getElementById('requestMethod').style.display = "none";
        document.getElementById("back").style.display = "none";
        document.getElementById('batteryDiv').classList.remove('hidden');

    }

    else if (step == 3) { //user is at 'request by amount' section
        step = 1;

        //clear variables
        neededSoC = 0;
        sliderDesired.style.display = "none";

        //show request method div
        document.getElementById('requestMethod').style.display = "block";
        //hide irrelevant divs
        document.getElementById("neededCharge").style.display = "none";
        document.getElementById("done").style.display = "none";
        document.getElementById('batteryDiv').classList.add('hidden');
    }
    else if (step == 2) {//user is at 'request by destination' section
        step = 1;

        longitude = 0; latitude = 0;

        //show request method div
        document.getElementById('requestMethod').style.display = "block";

        //hide irrelevant divs
        document.getElementById('map').style.display = "none";
        document.getElementById("done").style.display = "none";
    }
});

//continue button 
document.getElementById("continue").addEventListener("click", function () { //user inputted current charge
    if (currentSoC > 0 && currentSoC < 100) {
        step = 1; //user completed step 0

        sliderCurrent.disabled = true; //disable current energy slider
        //show requestMethod div and back button
        document.getElementById('requestMethod').style.display = "block";
        document.getElementById("back").style.display = "block";
        //hide irrelevant divs
        document.getElementById("continue").style.display = "none";
        document.getElementById('currentEnergy').style.display = "none";
        document.getElementById('batteryDiv').classList.add('hidden');
    }
});

//user wants to request by destination
document.getElementById("requestByDestination").addEventListener("click", function () {
    step = 2;
    //alert('Feature Unavailable :(');
    document.getElementById('map').style.display = "block";
    document.getElementById('requestMethod').style.display = "none";

    //create the map
    var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({//Initialize view
            //center at coordinates
            center: ol.proj.fromLonLat([54.4696592, 24.3925139]),
            zoom: 10
        }),

    });
    //create placemark at position
    var placemark = new ol.Overlay.Placemark({
        color: '#00c',
        radius: 0,
        position: [6063534, 2801311],
        stopEvent: false

    });
    map.addOverlay(placemark);//add to map

    //Drag interaction
    var drag = new ol.interaction.DragOverlay({
        overlays: placemark
    });
    //allow overlay dragging
    map.addInteraction(drag);

    drag.on('dragend', function (e) {//if overlay is dragged get new position
        console.log(ol.proj.toLonLat(placemark.getPosition()));
        var olCord = ol.proj.toLonLat(placemark.getPosition());
        longitude = olCord[0];
        latitude = olCord[1];
        document.getElementById("done").style.display = "inline-block";
        document.getElementById("done").classList.remove('disabled');

    });


});

//user wants to request a specific charge amount
document.getElementById("requestByAmount").addEventListener("click", function () {
    step = 3; //user completed step 1

    //show battery and neededCharge divs. show 'done' button
    document.getElementById('batteryDiv').classList.remove('hidden');
    document.getElementById("neededCharge").style.display = "block";
    document.getElementById("done").style.display = "inline-block";
    //hide irrelevant elements
    document.getElementById('requestMethod').style.display = "none";

    setSliderDesired(); //set slider for user to input needed energy
});

//button to submit request
document.getElementById("done").addEventListener("click", function () {
        submitRequest(); //function to submit request
});


//main function
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        var userId = firebase.auth().currentUser.uid; //current user ID
        getCar(userId); //get the user's current car information
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

//function to set delay
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

//get the user's current car info
async function getCar(userId) {
    //get car information from the server
    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getCurrentCar', options);
    const json = await response.json(); //server response
    console.log(json);
    //save car information
    carBrand = json.car.brand;
    carModel = json.car.model;
    carColor = json.car.color;
    carNum = json.car.licenseNumber;
    consumption = json.consumption;
    batteryCapacity = json.batteryCapacity;

    setSliderCurrent(); //set slider to get the user's current state of charge
}


//send request to the server
async function submitRequest() {
    let userId = firebase.auth().currentUser.uid; //current user ID

    if (!document.getElementById("done").classList.contains('disabled')) document.getElementById("done").classList.add('disabled');
    else return;

    //get user's location and send it to the server
    if ('geolocation' in navigator && localStorage.getItem('locationPermission') == 'granted') { //if location access is allowed
        navigator.geolocation.getCurrentPosition(async position => {
            //get current latitude, longitude and time
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var tim = position.timestamp;

            //send user's location to the server to save location
            if (step == 2) {
                var d1 = { userId, lat, lon, tim, latitude, longitude };
            }
            else {
                var d1 = { userId, lat, lon, tim };
            }
            var options1 = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(d1)
            };
            const response1 = await fetch('/storeGeoFindDistance', options1);
            console.log("I am in geolocation");
            const json = await response1.json();
            if (step == 2)
                distance = json.distance;
        });
    } else {
        console.log('geolocation not available'); //location access is not allowed
        return; //don't submit request
    }

    await sleep(2000); //2 seconds delay. just in case the server was busy

    if (step == 2) {
        let counter = 0;
        while (distance == null) {
            await sleep(2000); //2 seconds delay. just in case the server was busy
            if (counter > 10) {
                alert("Error issuing request. We're very sorry.");
                window.location.reload();
            }
            counter++;
        }

        var currentSoC = document.getElementById("sliderCurrent").value; //from Request
        let totalNeededEnergy = Math.ceil((distance / 1000) * consumption);

        var currentEnergy = Math.floor(((currentSoC / 100) * batteryCapacity) * 2) / 2; //current energy percent to kWh (set by user in the slider range)
        var neededEnergy = Math.round((totalNeededEnergy - currentEnergy) * 10) / 10;//needed energy based on distance
        var maxDistance = Math.floor((currentEnergy / consumption) * 100) / 100; //calculate max distance (km) user can take

        var neededSoC = Math.round(neededEnergy / batteryCapacity * 100);
        if (neededEnergy <= 0) {
            alert("You need " + totalNeededEnergy + " kWh to Reach that destination. You already have enough charge!");
            return;
        }
    } else if (step == 3) {

        //get request information
        currentSoC = document.getElementById("sliderCurrent").value;
        neededSoC = document.getElementById("sliderDesired").value;
        neededSoC = neededSoC - currentSoC; //needed charge
        if (neededSoC < 0) { alert('There was an error issuing the request.'); window.location.reload(); }

        var currentEnergy = Math.floor(((currentSoC / 100) * batteryCapacity) * 2) / 2; //current energy percent to kWh (set by user in the slider range)
        var neededEnergy = Math.ceil(((neededSoC / 100) * batteryCapacity) * 2) / 2; // needed energy percent to kWh (set by user in the slider range)
        var maxDistance = Math.floor((currentEnergy / consumption) * 100) / 100; //calculate max distance (km) user can take
    }


    //confirm request before continuing
    if (!confirm("You're about to request " + neededSoC + "% of charge. Continue?")) return;

    //send request information to the server to submit the request
    reqStart = new Date().toString();
    const data = { userId, neededEnergy, neededSoC, reqStart, currentEnergy, currentSoC, maxDistance, carBrand, carModel, carColor, carNum };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    const response = await fetch('/submitRequest', options);
    const reqJson = await response.json(); //server response

    alert("Your Request has Been Made!"); //alert user that their request has been made
    window.location.assign('../home'); //forward user to the main page
}







// set sliders and increment/decrement buttons
var sliderCurrent, sliderDesired; //store a dynamically created sliders in functions setSliderCurrent() and setSliderDesired()
var timer; //when user holds the + or - button set timer. when user lets go, clear timer.

//set range slider with limits 0 to batteryCapacity (kWh) for user to set current car state of charge
function setSliderCurrent() {

    sliderCurrent = document.getElementById("sliderCurrent");
    sliderCurrent.value = 0;

    var value = document.getElementById("current"); //element to display slider value
    value.innerHTML = sliderCurrent.value; //display slider value (initial value is set to 0)

    //if slider.value was changed, display slider value and update currentSoC variable
    sliderCurrent.oninput = function () {
        currentSoC = this.value;
        value.innerHTML = currentSoC;
        stop(); //check if user reached max/min limit and disable increment/decrement buttons accordingly
    }

    showPage(); //page was loaded, show content
}

//set range slider with limits 0 to batteryCapacity (kWh) for user to set current car state of charge
function setSliderDesired() {

    neededSoC = currentSoC; //initialize neededSoC

    sliderDesired = document.getElementById("sliderDesired");
    sliderDesired.style.width = (SLIDER_WIDTH * ((100 - currentSoC) / 100)) + 'px'; //set slider width (for appearance)
    sliderDesired.min = currentSoC; sliderDesired.value = currentSoC;
    sliderDesired.style.display = "block";

    var value = document.getElementById("desired"); //element to display slider value
    value.innerHTML = sliderDesired.value; //display slider value (initial value is set to 0)

    //let s = document.createElement("style");
    //document.head.appendChild(s);

    //if slider.value was changed, display slider value and update neededSoC variable
    sliderDesired.oninput = function () {
        neededSoC = this.value;
        value.innerHTML = neededSoC;
        stop(); //check if user reached max/min limit and disable increment/decrement buttons accordingly
        //colorPercent = ((this.value) / batteryCapacity) * 100;
        //s.textContent = `.slider::-webkit-slider-thumb{box-shadow: -100vw 0 0 100vw hsl(${colorPercent}, 100%, 50%)} .slider::-moz-range-thumb{box-shadow: -100vw 0 0 100vw hsl(${colorPercent}, 100%, 50%)}`
    }

    //sliderDesired.disabled = true; //disable current energy slider

}

//user wants to increase the shown slider's value
async function increment() {
    if (step == 0) { //user is at step 0 (step 0: input current charge)
        if (currentSoC < 100) {
            currentSoC++; //increment current state of charge
            sliderCurrent.value = currentSoC; //update slider value
            document.getElementById("current").innerHTML = sliderCurrent.value; //update displayed value
        }
        if (currentSoC >= 100) stop();//if user reached 100, call stop()

    } else { //user is at step 3 (step 3: input needed charge)
        if (neededSoC < 100) {
            neededSoC++; //increment needed charge
            sliderDesired.value = neededSoC;//update slider value
            document.getElementById("desired").innerHTML = sliderDesired.value;  //update displayed value
        }
        if (neededSoC >= 100) stop();//if user reached 100, call stop()
    }

    timer = setInterval(function () {
        if (step == 0) { //user is at step 0 (step 0: input current charge)
            if (currentSoC < 100) {
                currentSoC++; //increment current state of charge
                sliderCurrent.value = currentSoC; //update slider value
                document.getElementById("current").innerHTML = sliderCurrent.value; //update displayed value
            }
            if (currentSoC >= 100) stop();//if user reached 100, call stop()

        } else { //user is at step 3 (step 3: input needed charge)
            if (neededSoC < 100) {
                neededSoC++; //increment needed charge
                sliderDesired.value = neededSoC; //update slider value
                document.getElementById("desired").innerHTML = sliderDesired.value;  //update displayed value
            }
            if (neededSoC >= 100) stop();//if user reached 100, call stop()
        }
    }, 87); // the above code is executed every 87 ms


}

//user wants to decrease the shown slider's value
async function decrement() {
    if (step == 0) { //user is at step 0 (step 0: input current charge)
        if (currentSoC > 0) {
            currentSoC--; //increment current state of charge
            sliderCurrent.value = currentSoC;  //update slider value
            document.getElementById("current").innerHTML = sliderCurrent.value; //update displayed value
        }
        if (currentSoC <= 0) stop(); //if user reached 100, call stop()

    } else { //user is at step 3 (step 3: input needed charge)
        if (neededSoC > currentSoC) {
            neededSoC--; //increment needed charge
            sliderDesired.value = neededSoC; //update slider value
            document.getElementById("desired").innerHTML = sliderDesired.value;  //update displayed value
        }
        if (neededSoC <= currentSoC) stop(); //if user reached 100, call stop()
    }

    timer = setInterval(function () {
        if (step == 0) { //user is at step 0 (step 0: input current charge)
            if (currentSoC > 0) {
                currentSoC--; //increment current state of charge
                sliderCurrent.value = currentSoC;  //update slider value
                document.getElementById("current").innerHTML = sliderCurrent.value; //update displayed value
            }
            if (currentSoC <= 0) stop(); //if user reached 100, call stop()

        } else { //user is at step 3 (step 3: input needed charge)
            if (neededSoC > currentSoC) {
                neededSoC--; //increment needed charge
                sliderDesired.value = neededSoC; //update slider value
                document.getElementById("desired").innerHTML = sliderDesired.value;  //update displayed value
            }
            if (neededSoC <= currentSoC) stop(); //if user reached 100, call stop()
        }
    }, 87); // the above code is executed every 87 ms
}

//user either let go of the increment/decrement button or reached max/min unit price
function stop() {
    if (timer) clearInterval(timer); //clear timer to stop unit price from increasing / decreasing

    if (step == 0) {
        if (currentSoC == 100) document.getElementById("increment").style.color = "#aaa"; //user reached 100 (max percent), disable increment button
        if (currentSoC == 0) document.getElementById("decrement").style.color = "#aaa"; //user reached 0, disable decrement button
        if (currentSoC < 100) document.getElementById("increment").style.color = "#6dbec3"; //user can increase currentSoC, enable increment button
        if (currentSoC > 0) document.getElementById("decrement").style.color = "#6dbec3"; //user can decrease currentSoC, enable decrement button

        if (currentSoC == 0 || currentSoC == 100) document.getElementById('continue').classList.add('disabled'); //disable continue button if current SoC = 0%
        else document.getElementById('continue').classList.remove('disabled'); //enable continue button if current SoC > 0%
    } else {
        if (neededSoC == 100) document.getElementById("incrementDesired").style.color = "#aaa"; //user reached 100 (max percent), disable increment button
        if (neededSoC == currentSoC) document.getElementById("decrementDesired").style.color = "#aaa"; //user reached 0, disable decrement button
        if (neededSoC < 100) document.getElementById("incrementDesired").style.color = "#6dbec3";  //user can increase neededSoC, enable increment button
        if (neededSoC > currentSoC) document.getElementById("decrementDesired").style.color = "#6dbec3"; //user can decrease neededSoC, enable decrement button

        if (neededSoC == currentSoC) document.getElementById('done').classList.add('disabled'); //disable continue button if needed SoC = current SoC
        else document.getElementById('done').classList.remove('disabled'); //enable continue button if needed SoC > current SoC

        //map

    }

}




