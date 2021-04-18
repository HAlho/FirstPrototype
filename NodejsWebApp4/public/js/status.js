// JavaScript source code
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var user = firebase.auth().currentUser;
        var userId = user.uid; //current user
        showStatus(userId);
    } else window.location.assign('../');
});

function openStatusMenu() {
    document.getElementById("dimContent").classList.add("dimVisible");
    setTimeout(function () { document.getElementById("statusMenu").style.display = "block"; }, 250);
}

function closeStatusMenu() {
    if (document.getElementById("statusMenu").style.display == "block") {
        document.getElementById("statusMenu").style.display = "none";
        document.getElementById("dimContent").classList.remove("dimVisible");
    }
}

//show and set user status
async function showStatus(userId) {
    statusButton = document.getElementById("status");

    const sdata = { userId };
    console.log(sdata);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/getStat', options);
    const json = await response.json();
    console.log(json);
    stat = json.stat;

    if (stat == "Available") {
        statusButton.style.background = "#afe3e2";
        statusButton.innerHTML = '<img src="./img/status-available.png" height="22">';
    }
    else if (stat == "Do Not Disturb") {
        statusButton.style.background = "#e74e4e";

        statusButton.innerHTML = '<img src="./img/status-busy.png" height="20">';
    }
    else {
        statusButton.style.background = "lightgray";
        statusButton.innerHTML = '<img src="./img/status-unavailable.png" height="30">';
    }

}

async function setStatus(stat) {
    var userId = firebase.auth().currentUser.uid; //current user

    const data = { userId, stat };
    console.log(data);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/setStat', options);
    const json = await response.json();
    console.log(json);


    showStatus(userId, stat);

    closeStatusMenu();
}