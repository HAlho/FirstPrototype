var carBrand, carModel, carColor, licenseNum;

//if the user just signed up, the user can press the skip button to go to the home page
document.getElementById('skip').addEventListener('click', () => {
    window.location.replace('../home');
});

//function that check if user is authenticated then calls other functions
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        const userId = firebase.auth().currentUser.uid; //current user ID

        if (document.referrer.includes('signup')) {
            document.getElementById('skip').style.display = "block"; //user just signed up and can skip this page
            document.getElementById('back').style.display = "none"; //user just signed up and can skip this page
        }

        //get brands from the server
        const sdata = { userId };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/getBrands', options);
        const json = await response.json(); //server response
        brands = Object.keys(json.brands);

        //Brands dropmenu
        for (var i = 0; i < brands.length; i++) {
            let option = document.createElement("option");
            option.text = brands[i];
            option.value = brands[i];
            document.getElementById("brands").appendChild(option);
        }
        showPage();
    }
    else window.location.assign('../mainpage'); //user is not authenticated. forward user to the welcome page
});

//check selected brand
document.getElementById("brands").addEventListener('change', async (event) => {
    clearDropmenu(document.getElementById("models")); //clear models
    let carBrand = event.target.value; //check if there is a selected brand
    if (carBrand != "Select a Brand") { //if there is a selected brand

        //get the brand models from the server
        const sdata = { carBrand };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/getModels', options);
        const json = await response.json(); //server response
        models = Object.keys(json.models);

        //models dropmenu
        for (var i = 0; i < models.length; i++) {
            let option = document.createElement("option");
            option.text = models[i];
            option.value = models[i];
            document.getElementById("models").appendChild(option);
        }
        document.getElementById("models").disabled = false; //enable models
    } else //if no selected brand
        document.getElementById("models").disabled = true; //disable models
});

//check models
document.getElementById("models").addEventListener('change', (event) => {
    if (document.getElementById("models").value != "Select a Model" && document.getElementById("license").value != '') //check if user entered all info
        document.getElementById("submit").classList.remove('disabled'); //enable submit
    else document.getElementById("submit").classList.add('disabled'); //disable submit
});

//check license
document.getElementById("license").addEventListener('input', (event) => {
    if (document.getElementById("models").value != "Select a Model" && document.getElementById("license").value != '') //check if user entered all info
        document.getElementById("submit").classList.remove('disabled'); //enable submit
    else document.getElementById("submit").classList.add('disabled'); //disable submit

});

//clear car model's dropmenu
function clearDropmenu(selectElement) {
    var i, L = selectElement.options.length - 1;
    for (i = L; i >= 0; i--) selectElement.remove(i);
    var option = document.createElement("option");
    option.text = "Select a Model";
    selectElement.appendChild(option);

    document.getElementById("submit").classList.add('disabled');
}

async function submit() {
    carBrand = document.getElementById("brands").value; //get selected brand
    carModel = document.getElementById("models").value; //get selected model
    licenseNum = document.getElementById("license").value; //get entered license
    carColor = document.getElementById("colors").value; //get selected color

    if (carBrand == "Select a Brand" || carModel == "Select a Model" || licenseNum == '') return; //if no info entered

    const userId = firebase.auth().currentUser.uid; //current user id

    //send new car info to server to save it into the db
    const sdata = { carBrand, carModel, licenseNum, carColor, userId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/saveCar', options);
    const json = await response.json();
    //successfully registered
    alert('Your Car was Registered Successfully!');
    window.location.replace('../carSelect');
}


