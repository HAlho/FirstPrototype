// JavaScript source code
statusButton = document.getElementById("status"); //status button in main menu
statusMenu = document.getElementById("statusMenu"); //status menu

//display status menu when status button is clicked
function openStatusMenu() {
    document.getElementById("dimContent").classList.add("dimVisible"); //dim screen
    setTimeout(function () { statusMenu.style.display = "block"; }, 250); //show menu
}

//hide status menu when screen is clicked
function closeStatusMenu() {
    if (statusMenu.style.display == "block") {
        statusMenu.style.display = "none"; //hide menu
        document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
    }
}

//show and set user status
async function showStatus(userId, status) {
    if (status == null) {
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
    }

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
    closeStatusMenu(); //close status menu
}