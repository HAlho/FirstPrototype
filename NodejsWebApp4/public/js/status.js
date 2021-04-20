// JavaScript source code
statusButton = document.getElementById("status"); //status button in main menu
statusMenu = document.getElementById("statusMenu"); //status menu

var userStatus; //store user's status

//get status from the server
async function getStatus() {
    const userId = firebase.auth().currentUser.uid; //current user ID

    //get status from the server
    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getStat', options);
    const json = await response.json();

    status = json.stat; //user status

    return status;
}

//display status menu when status button is clicked
function openStatusMenu() {
    getStatus().then(status => {//once async function is done excute

        if (status == 'Busy') {
            //pop up
            alert('Your account is connected to a request. Your status is set to Busy by default. Cancel or reject request to change your status.');
        }
        else {
            document.getElementById("dimContent").classList.add("dimVisible"); //dim screen
            setTimeout(function () { statusMenu.style.display = "block"; }, 250); //show menu
        }

    });



}

//hide status menu when screen is clicked
function closeStatusMenu() {
    if (statusMenu.style.display == "block") {
        statusMenu.style.display = "none"; //hide menu
        document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
    }
}

//show and set user status
async function showStatus(status) {
    if (status == null) {

        //get status from the server
        await getStatus().then(value => {//once the value is retrieved 
            status = value;
        });
    }

    userStatus = status; //store status

    //update status icon depending on status
    switch (status) {
        case 'Available': //user is available
            statusButton.style.background = "#afe3e2";
            statusButton.innerHTML = '<img src="./img/status-available.png" height="22">';
            break;
        case 'Do Not Disturb': //user is not available
            statusButton.style.background = "#e74e4e";
            statusButton.innerHTML = '<img src="./img/status-busy.png" height="20">';
            break;
        default: //user has a request in progress
            statusButton.style.background = "lightgray";
            statusButton.innerHTML = '<img src="./img/status-unavailable.png" height="30">';
    }


}

//change user changed status
async function setStatus(status) {
    if (userStatus != status) { //if user changed status
        const userId = firebase.auth().currentUser.uid; //current user ID

        //send user ID and status to the server to update it
        const data = { userId, status };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
        const response = await fetch('/setStat', options);
        const json = await response.json();

        showStatus(userId, status); //show the updated status on the main menu
    }

    closeStatusMenu(); //close status menu
}
