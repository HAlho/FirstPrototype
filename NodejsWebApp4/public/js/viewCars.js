// JavaScript source code
// JavaScript source code
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user
        displayCars(userId);

    } else window.location.assign('../');
});

//display registered cars as buttons
async function displayCars(userId) {
    var carsElement = document.getElementById("cars");
    while (carsElement.firstChild) carsElement.removeChild(carsElement.firstChild); //clear cars div

    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getUserCars', options);
    const json = await response.json();
    console.log(json);
    cars = json.cars;
    currentCarId = json.currentCarId;
    console.log(currentCarId);

    //No or one registered car
    if (cars == null) document.getElementById("noCars").style.display = "block";
    else {
        if (currentCarId != null) {
            var keys = Object.keys(cars); //get car ids

            console.log(keys[0]);

            let brand = cars[currentCarId].brand;
            let model = cars[currentCarId].model;
            let color = cars[currentCarId].color;
            let licenseNumber = cars[currentCarId].licenseNumber;
            var button = document.createElement("button");
            button.innerHTML = "<b><small>Current Car</small></b><br /><b>" + brand + ' ' + model + "</b> (" + color + ")<br><small>" + licenseNumber + "</small>";

            carsElement.appendChild(button);

            (function (index) {
                button.addEventListener('click', function () {
                    window.location.replace('../editCar' + '?carId=' + index);
                });
            })(currentCarId)
        }
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];

            if (k == currentCarId) continue;
            let brand = cars[k].brand;
            let model = cars[k].model;
            let color = cars[k].color;
            let licenseNumber = cars[k].licenseNumber;
            var button = document.createElement("button");
            button.innerHTML = "<b>" + brand + ' ' + model + "</b> (" + color + ")<br><small>" + licenseNumber + "</small>";
            carsElement.appendChild(button);
            (function (index) {
                button.addEventListener('click', function () {
                    window.location.replace('../editCar' + '?carId=' + index);
                });
            })(k)



        }
    }
}



