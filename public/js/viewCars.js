// JavaScript source code

//check if the user came back from the car select page (reload page to show new car information)
window.addEventListener("pageshow", function (event) {
    var historyTraversal = event.persisted ||
        (typeof window.performance != "undefined" &&
            window.performance.navigation.type === 2); // window.performance.navigation.type = 2 when user 
    if (historyTraversal) window.location.reload(); //reload page to show changes
});

document.getElementById("registerCar").addEventListener('click', () => {
    window.location.assign('../registerCar');
});

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user
        displayCars(userId);
        showPage(); //page is set, show page content
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});

//display registered cars as buttons
async function displayCars(userId) {

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
            appendCar(1, cars[currentCarId], currentCarId);
        }
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (k == currentCarId) continue;
            appendCar(0, cars[k], k);
        }

        document.getElementById("carDiv").lastElementChild.style.marginBottom = "200px";
    }
}



function appendCar(currentCar, carInfo, carId) {

    let brand = carInfo.brand;
    let model = carInfo.model;
    let licenseNumber = carInfo.licenseNumber;
    let color = getColor(carInfo.color);

    let carTable = document.createElement('table');

    let tr1 = document.createElement('tr');

    let carIconTd = document.createElement('td');
    carIconTd.rowSpan = "5";
    carIconTd.innerHTML = '<i class="fas fa-car" style="font-size: 65px; color:' + color + ';"></i>';
    carIconTd.style.textAlign = "center";
    carIconTd.style.width = "100px";

    let currentCarTd = document.createElement('td');
    if (currentCar == 1) {
        let currentCarText = document.createTextNode("CURRENT CAR");
        currentCarTd.appendChild(currentCarText);
        currentCarTd.style.textAlign = "right";
        currentCarTd.style.fontSize = "11px";
        currentCarTd.style.color = "#777";
        
    }

    tr1.appendChild(carIconTd); tr1.appendChild(currentCarTd);


    let tr2 = document.createElement('tr');
    let carBrandTd = document.createElement('td');
    let carBrandText = document.createTextNode(brand + ' ' + model);
    carBrandTd.appendChild(carBrandText);
    carBrandTd.style.fontSize = "14px";
    carBrandTd.style.fontWeight = "bold";

    carBrandTd.style.verticalAlign = "bottom";

    tr2.appendChild(carBrandTd);

    let tr3 = document.createElement('tr');
    let carPlateTd = document.createElement('td');
    let carPlateText = document.createTextNode("Plate No.: " + licenseNumber);
    carPlateTd.appendChild(carPlateText);
    carPlateTd.style.verticalAlign = "top";
    carPlateTd.style.fontWeight = "400";
    tr3.appendChild(carPlateTd);

    let tr4 = document.createElement('tr');
    let emptyTd = document.createElement('td');
    emptyTd.style.height = "10px";
    tr4.appendChild(emptyTd);

    let tr5 = document.createElement('tr');
    let editTd = document.createElement('td');
    editTd.innerHTML = '<a href="../editCar?carId=' + carId + '">edit <i class="fa fa-caret-right" style="color: #444; display: inline;"></a>';
    editTd.style.textAlign = "right";
    tr5.appendChild(editTd);

    carTable.appendChild(tr1);
    carTable.appendChild(tr2);
    carTable.appendChild(tr3);
    carTable.appendChild(tr4);
    carTable.appendChild(tr5);

    if (currentCar == 1) {
        carTable.style.height = "140px";
        carTable.style.marginBottom = "35px";
        carTable.classList.add('selectedCar');
    }

    document.getElementById("carDiv").appendChild(carTable);
}

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