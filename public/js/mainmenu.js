// JavaScript source code
//append main menu to the html page
const menuCodeBlock = '<div class="mainMenu">' +
    '<table style="border-bottom:none;"><tr>' +
    '<td><button class="circle" id="status" onclick="openStatusMenu()"></button></td>' +
    '<td><button class="circle" id="home"><img src="./img/home.png" height="30"></button>' +
    '<i class="fas fa-circle" id="notification" style="display:none; color: #f23c3c; -webkit-text-stroke-width: 2px; -webkit-text-stroke-color: #fff; position: absolute; margin: 3px 0 0 -42px; font-size: 13px;"></i></button></td >' +
    '<td><button class="circle" id="account"><img src="./img/account.png" height="30"></button></td>' +
    '</tr><tr style="text-align:center;">' +
    '<td><small>STATUS</small></td>' +
    '<td><small id="homeText">HOME</small></td>' +
    '<td><small id="accountText">ACCOUNT</small></td>' +
    '</tr></table>' +
    '</div>' +
    '<div id="statusMenu" class="statusMenu tail">' +
    '<a onclick="setStatus(\'Available\'); showStatus()"><button class="statusCircle"><img src="./img/status-available.png" height="15px"></button>Available</a><hr />' +
    '<a onclick="setStatus(\'Do Not Disturb\'); showStatus()"><button class="statusCircle" style="background-color:#f08066;"><img src="./img/status-busy.png" height="15px"></button>Block incoming requests</small></a>' +
    '</div>' +
    '<div id="dimContent" class="dimContent" onclick="closeStatusMenu()"></div>';
var div = document.createElement('div');
div.innerHTML = menuCodeBlock;
document.getElementById('content').appendChild(div); //append menu

//make current page's button active
if (window.location.pathname == '/home') {
    document.getElementById('home').classList.add('active');
    document.getElementById('homeText').innerHTML = document.getElementById('homeText').innerHTML.bold();
} else {
    document.getElementById('account').classList.add('active');
    document.getElementById('accountText').innerHTML = document.getElementById('accountText').innerHTML.bold();
}

//html elements event listeners
//main menu account button event listeners
document.getElementById('home').addEventListener('click', () => {
    if (window.location.pathname != '/home')
        window.location.assign('../home'); //main menu account button to forward the user to the account page
});
document.getElementById('account').addEventListener('click', () => {
    if(window.location.pathname != '/account')
        window.location.assign('../account'); //main menu account button to forward the user to the account page
});

//get status elements
statusButton = document.getElementById("status"); //status button in main menu
statusMenu = document.getElementById("statusMenu"); //status menu

var userStatus; //store user's status

//function that check if user is authenticated then calls other functions
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {//if user is authenticated
        var status, previousStatus = null; //if there's an active request, store the status of the request, otherwise store the status of the user

        showStatus(); //show the usr's status

        if (window.location.pathname != '/home') {
            //keep updating the user's status
            statTimer = setInterval(async function () {
                //get user information from the server
                const d = { userId };
                const options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(d)
                };
                const response = await fetch('/getUser', options);
                const j1 = await response.json();
                user = j1.user; //store user information

                status = user.status;

                if (status == 'Busy' && user.activeRequest != null) //if status is 'Busy', status is set to be the request's status instead of the user's
                    status = user.activeRequest.dbref; // status is set to be the request's status instead of the user's

                if (status != previousStatus || user.messages != null) {
                    if ((status == 'matched' && user.matchedReq != null) || (status == 'pending' && user.activeRequest.role == 'requester') || status == 'Pay' || user.messages != null)
                        document.getElementById('notification').style.display = "inline";
                    previousStatus = status;
                    showStatus(status);
                }
            }, 2000); //repeat every 2 seconds
        }
    }
});

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
        if (status != 'Available' && status != 'Do Not Disturb') {//pop up
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
            if (status.includes('Offline')) {
                status = status.substring(status.indexOf('-') + 1);
                setStatus(status);
            }
        });
    }

    userStatus = status; //store status

    //update status icon depending on status
    switch (status) {
        case 'Available': //user is available
            statusButton.style.background = "#99d9d8";
            statusButton.innerHTML = '<img src="./img/status-available.png" height="22">';
            break;
        case 'Do Not Disturb': //user is not available
            statusButton.style.background = "#f08066";
            statusButton.innerHTML = '<i class="fas fa-times" style="color: white; font-size: 25px;"></i>';//<img src="./img/status-busy.png" height="20">';
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
    }

    closeStatusMenu(); //close status menu
}
