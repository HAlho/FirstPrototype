var carBrand, carModel, carColor, licenseNum;

carId = document.location.search.replace(/^.*?\=/, '');
currentCarId = '';
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user

        const sdata = { userId, carId };
        console.log(sdata);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/getCar', options);
        const json = await response.json();
        console.log(json);
        car = json.car;
        currentCarId = json.currentCarId;

        document.getElementById("car").innerHTML = car.brand + ' ' + car.model;
        document.getElementById("license").value = car.licenseNumber;
        document.getElementById(car.color).selected = true;

        console.log(carId + " " + currentCarId);
        if (carId != currentCarId) document.getElementById("makeCurrentCar").style.display = "inline-block";

    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

async function makeCurrentCar() {
    const userId = firebase.auth().currentUser.uid;

    const data = { userId, carId };
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
    window.location.assign('../viewCars');

}

async function submit() {
    licenseNum = document.getElementById("license").value;
    carColor = document.getElementById("colors").value;
    const userId = firebase.auth().currentUser.uid;

    const data = {userId, carId, licenseNum, carColor};
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/saveUpdate', options);
    const json = await response.json();
    console.log(json);

    window.location.assign('../viewCars');

}


async function deleteCar() {
    console.log(currentCarId + ' ' + carId);
    const userId = firebase.auth().currentUser.uid;
    const data = {userId, carId};
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/deleteCar', options);
    const json = await response.json();
    console.log(json);

    if (currentCarId == carId) window.location.replace('../carSelect');
    else window.location.assign('../viewCars');
}