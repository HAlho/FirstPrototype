// JavaScript source code
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user
        displayCars(userId);

    } else window.location.assign('../');
});

var selectedCarFlag = 0;
//display registered cars as buttons
async function displayCars(userId) {

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
        var carId = keys[0];
        saveCurrentCar(userId, carId, 1, 0);
    } else {
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            appendCar(userId, data[k], k, i);
        }
        document.getElementById("carDiv").lastElementChild.style.marginBottom = "200px";
    }
}

function submit() {
    if (selectedCarFlag == 1) window.location.replace('../profile');
}

async function saveCurrentCar(userId, carId, onlyCarFlag, tablePos) {
    selectedCarFlag = 1;

    if (onlyCarFlag != 1) {
        document.getElementById("next").classList.remove('disabled');
        document.getElementById("arrow").style.color = "#6dbec3";


        for (let pos = document.getElementById("carDiv").childElementCount - 1; pos >= 0; pos--)
            document.getElementById("carDiv").children.item(pos).classList.remove('selectedCar');

        document.getElementById("carDiv").children.item(tablePos).classList.add('selectedCar');
    }
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
    console.log(json);
    if (onlyCarFlag == 1) window.location.assign('../profile');

}




function appendCar(userId, carInfo, carId, tablePos) {

    let brand = carInfo.brand;
    let model = carInfo.model;
    let licenseNumber = carInfo.licenseNumber;
    let color = getColor(carInfo.color);

    let carTable = document.createElement('table');

    let tr2 = document.createElement('tr');

    let carIconTd = document.createElement('td');
    carIconTd.rowSpan = "3";
    carIconTd.innerHTML = '<i class="fas fa-car" style="font-size: 65px; color:' + color + ';"></i>';
    carIconTd.style.textAlign = "center";
    carIconTd.style.width = "125px";

    let carBrandTd = document.createElement('td');
    let carBrandText = document.createTextNode(brand + ' ' + model);
    carBrandTd.appendChild(carBrandText);
    carBrandTd.style.fontSize = "14px";
    carBrandTd.style.fontWeight = "bold";

    carBrandTd.style.verticalAlign = "bottom";

    tr2.appendChild(carIconTd); tr2.appendChild(carBrandTd);

    let tr3 = document.createElement('tr');
    let carPlateTd = document.createElement('td');
    let carPlateText = document.createTextNode("Plate No.: " + licenseNumber);
    carPlateTd.appendChild(carPlateText);
    carPlateTd.style.verticalAlign = "top";
    carPlateTd.style.fontWeight = "400";
    tr3.appendChild(carPlateTd);

    let tr4 = document.createElement('tr');
    let emptyTd4 = document.createElement('td');
    emptyTd4.style.height = "10px";
    tr4.appendChild(emptyTd4);

    carTable.appendChild(tr2);
    carTable.appendChild(tr3);
    carTable.appendChild(tr4);

    carTable.setAttribute("onclick", "saveCurrentCar('" + userId + "', '" + carId + "', 0, '" + tablePos + "');");
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