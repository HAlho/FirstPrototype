var carBrand, carModel, carColor, licenseNum;

//Brands dropmenu
firebase.database().ref('carList').once('value', function (snapshot) {
    let data = snapshot.val(); //get all car info
    let brandsDB = Object.keys(data); //get all brands
    for (var i = 0; i < brandsDB.length; i++) {
        let option = document.createElement("option");
        option.text = brandsDB[i];
        option.value = brandsDB[i];
        document.getElementById("brands").appendChild(option);
    }
});

//Models dropmenu
document.getElementById("brands").addEventListener('change', (event) => {
    clearDropmenu(document.getElementById("models"));
    let carBrand = event.target.value;
    if (carBrand != "Select a Brand") {
        firebase.database().ref('carList/' + carBrand).once('value', function (snapshot) {
            let modelsData = snapshot.val(); //get selected brand info
            let modelsDB = Object.keys(modelsData); //get all of selected brand's models
            for (var i = 0; i < modelsDB.length; i++) {
                let option = document.createElement("option");
                option.text = modelsDB[i];
                option.value = modelsDB[i];
                document.getElementById("models").appendChild(option);
            }
        });
        document.getElementById("models").disabled = false;
    } else document.getElementById("models").disabled = true;
});

//clear car model's dropmenu
function clearDropmenu(selectElement) {
    var i, L = selectElement.options.length - 1;
    for (i = L; i >= 0; i--) selectElement.remove(i);
    var option = document.createElement("option");
    option.text = "Select a Model";
    selectElement.appendChild(option);
}

function submit() {
    carBrand = document.getElementById("brands").value;
    carModel = document.getElementById("models").value;
    licenseNum = document.getElementById("license").value;
    carColor = document.getElementById("colors").value;
    firebase.database().ref('users/' + firebase.auth().currentUser.uid + "/cars").push().set({
        brand: carBrand,
        model: carModel,
        licenseNumber: licenseNum,
        color: carColor
    });
    alert('Your Car was Registered Successfully!');
    window.location.replace('../profile');
}



