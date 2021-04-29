var carBrand, carModel, carColor, licenseNum;

carId = document.location.search.replace(/^.*?\=/, '');
currentCarId = '';
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        userId = firebase.auth().currentUser.uid; //current user ID

        //send the user and car ID to get car information
        const sdata = { userId, carId };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/getCar', options);
        const json = await response.json();
        car = json.car; //car info
        currentCarId = json.currentCarId; //user's current car ID

        //display car information
        document.getElementById("car").innerHTML = car.brand + ' ' + car.model;
        document.getElementById("license").value = car.licenseNumber;
        document.getElementById(car.color).selected = true;

        //if the car is not the user's current car, display makeCurrentCar button
        if (carId != currentCarId) document.getElementById("makeCurrentCar").style.display = "inline-block";

        showPage(); //display the page's content

    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

//user wants to make car his/her current car
async function makeCurrentCar() {
    const userId = firebase.auth().currentUser.uid; //user ID

    //send user and car IDs to the server
    const data = { userId, carId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/currentCar', options);
    const json = await response.json();

    //go to view cars page
    window.location.assign('../viewCars');
}

//function to submit changes
async function submit() {
    const userId = firebase.auth().currentUser.uid;//user ID

    //get user inputs
    licenseNum = document.getElementById("license").value;
    carColor = document.getElementById("colors").value;

    //send changes to the server
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

    //forward user to view cars page
    window.location.assign('../viewCars');
}

//delete the car being editted
async function deleteCar() {
    const userId = firebase.auth().currentUser.uid; //user ID

    //send user ID and car ID to the server to delete the car
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

    //if the deleted car was set as the user's current car, forward user to 'carselect' page, otherwise forward user to 'viewcars' page
    if (currentCarId == carId) window.location.replace('../carSelect');
    else window.location.assign('../viewCars');
}