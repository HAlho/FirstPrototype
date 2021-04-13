// JavaScript source code
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user
        displayCars(userId);

    } else window.location.assign('../');
});

var carId = "";
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

    //No or one registered car
    if (data == null) window.location.assign('../profile');

    var keys = Object.keys(data); //get car ids
    if (keys.length == 1) {
        var index = keys[0];
        saveCurrentCar(userId, index, 1);
    } else {
        document.getElementById("title").style.display = "block";
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            let brand = data[k].brand;
            let model = data[k].model;
            let color = data[k].color;
            let licenseNumber = data[k].licenseNumber;
            var button = document.createElement("button");
            button.innerHTML = "<b>" + brand + ' ' + model + "</b> (" + color + ")<br><small>" + licenseNumber + "</small>";
            cars.appendChild(button);

            (function (index) {
                button.addEventListener('click', function () {
                    saveCurrentCar(userId, index, 0);
                    document.getElementById("next").style.display = "block";
                });
            })(k)
        }
    }
}

document.getElementById("next").addEventListener("click", function () {
    window.location.replace('../profile');
}); 

async function saveCurrentCar(userId, carId, onlyCarFlag){
    const data = {userId, carId};
    console.log(data);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/currentCar', options);
    const json = await response.json();
    console.log(json);
    if (onlyCarFlag == 1) window.location.assign('../profile');

}



