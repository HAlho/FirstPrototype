// JavaScript source code
var selectedCarFlag = false; //set true when user selects a car
var currentCarId;

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        var userId = firebase.auth().currentUser.uid; //current user ID
        getCars(userId); //function to get user cars
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

//display registered cars as buttons
async function getCars(userId) {
    //get user cars from the server
    const sdata = { userId };
    console.log(sdata);
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getCars', options);
    const json = await response.json();
    const data = json.cars; //store car info in variable data

    //forward user to main page if they don't have any registered cars
    if (data == null) window.location.assign('../home');

    //user has registered car(s)
    var keys = Object.keys(data); //get cars ids
    if (keys.length == 1) { //if there's only one car, set is as 'currentCar' then forward user to main page
        var carId = keys[0];
        saveCurrentCar(carId, 1, 0); //function to save the car as currentCar in the database
    } else { //if there are multiple cars, display each car
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i]; //get car Id
            displayCar(userId, data[k], k, i); //function to display car
        }
        document.getElementById("carDiv").lastElementChild.style.marginBottom = "200px"; //add extra space at the end of the page to make it scrollable

        showPage(); //display the page's content
    }
}

document.getElementById('next').addEventListener('click', async () => { //when user clicks the 'continue' button
    if (selectedCarFlag) submit();
});

async function saveCurrentCar(carId, onlyCarFlag, carPosition) { //function to save current car to database
    selectedCarFlag = true; //a car was selected

    currentCarId = carId;

    if (onlyCarFlag == 1) { //forward user to main page if the user has 1 car only
        submit();
    } else { //if user has multiple cars
        //remove 'selectedCar' class from all displayed cars
        for (let pos = document.getElementById("carDiv").childElementCount - 1; pos >= 0; pos--)
            document.getElementById("carDiv").children.item(pos).classList.remove('selectedCar');

        //add 'selectedCar' class to the car the user clicked
        document.getElementById("carDiv").children.item(carPosition).classList.add('selectedCar');

        //enable the continue button
        document.getElementById("next").classList.remove('disabled');
        document.getElementById("arrow").style.color = "#6dbec3";
    }
}

async function submit() {
    var userId = firebase.auth().currentUser.uid; //current user ID

    //send current car ID to the server to save it
    const data = { userId, carId: currentCarId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/saveCurrentCar', options);
    const json = await response.json();

    const ref = document.referrer; 
    if (ref.includes('signin') || ref.includes('signup') || ref.includes('mainpage')) window.location.replace('../home');
    else window.history.back(); //go back to previous page
}

function displayCar(userId, carInfo, carId, carPosition) {
    //get car info
    let brand = carInfo.brand;
    let model = carInfo.model;
    let licenseNumber = carInfo.licenseNumber;
    let color = getColor(carInfo.color); //function that takes color and returns its hex code

    //create table to put car info in
    let carTable = document.createElement('table');


    //td elements
    //create a td element to display car icon (row span = 3)
    let carIconTd = document.createElement('td');
    carIconTd.rowSpan = "3";
    carIconTd.innerHTML = '<i class="fas fa-car" style="font-size: 65px; color:' + color + ';"></i>';
    carIconTd.style.textAlign = "center"; carIconTd.style.width = "125px"; //style element

    //create a td element to display car brand and model
    let carBrandTd = document.createElement('td');
    let carBrandText = document.createTextNode(brand + ' ' + model);
    carBrandTd.appendChild(carBrandText);
    carBrandTd.style.fontSize = "14px"; carBrandTd.style.fontWeight = "bold"; carBrandTd.style.verticalAlign = "bottom"; //style element

    //create a td element to display plate number
    let carPlateTd = document.createElement('td');
    let carPlateText = document.createTextNode("Plate No.: " + licenseNumber);
    carPlateTd.appendChild(carPlateText);
    carPlateTd.style.verticalAlign = "top"; carPlateTd.style.fontWeight = "400"; //style element

    //create an empty td to add space
    let emptyTd = document.createElement('td');
    emptyTd.style.height = "10px"; //style element


    //tr elements
    //create row and append car icon and car brand and model 
    let tr1 = document.createElement('tr');
    tr1.appendChild(carIconTd); tr1.appendChild(carBrandTd);

    //create row and append plate number
    let tr2 = document.createElement('tr');
    tr2.appendChild(carPlateTd);

    //create row and add empty td
    let tr3 = document.createElement('tr');
    tr3.appendChild(emptyTd);


    //append rows to tha table
    carTable.appendChild(tr1);
    carTable.appendChild(tr2);
    carTable.appendChild(tr3);

    carTable.setAttribute("onclick", "saveCurrentCar('"  + carId + "', 0, '" + carPosition + "');"); //onclick event listener that calls saveCurrentCar() function
    document.getElementById("carDiv").appendChild(carTable); //append car to page
}

//function that takes color and returns its hex code. used to display and color the car icons
function getColor(color) {
    if (color == "Black") return "#313131";
    if (color == "White") return "#fdfdfd; -webkit-text-stroke-width: 1px; -webkit-text-stroke-color: #999";
    if (color == "Silver") return "#a9a9a9";
    if (color == "Grey") return "#7c7c7c";
    if (color == "Gold") return "#e3b64f; -webkit-text-stroke-width: 1px; -webkit-text-stroke-color: #a1642e";
    if (color == "Red") return "#e95151";
    if (color == "Blue") return "#5687d3";
    if (color == "Yellow") return "#fbe060; -webkit-text-stroke-width: 1px; -webkit-text-stroke-color: #e39403";
    if (color == "Green") return "#89d34c";
    if (color == "Brown") return "#9b7c74";
    if (color == "Tan") return "#d2aa92; -webkit-text-stroke-width: 1px; -webkit-text-stroke-color: #956e4d";
    if (color == "Purple") return "#bf7ae6";
    if (color == "Orange") return "#ec9763";
}