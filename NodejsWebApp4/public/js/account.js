// JavaScript source code
unitPrice, creditScore;

const auth = firebase.auth();

document.getElementById("logout").addEventListener('click', () => {
    //signOut() is a built in firebase function responsible for signing a user out
    auth.signOut()
        .then(() => {
            window.location.assign('../');
        }).catch(error => {
            console.error(error);
        });
});

document.getElementById("reqHistory").addEventListener('click', () => {
    window.location.assign('../requestHistory');
});

document.getElementById("cars").addEventListener('click', () => {
    window.location.assign('../viewCars');
});

document.getElementById("settings").addEventListener('click', () => {
    window.location.assign('../settings');
});

document.getElementById("home").addEventListener('click', () => {
    window.location.assign('../profile');
});

var unitPrice, creditScore;

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var user = firebase.auth().currentUser;
        var userId = user.uid; //current user
        var name = user.displayName;
        var email = user.email;

        document.getElementById("name").innerHTML = "Hi, " + name;
        document.getElementById("email").innerHTML = email;

        const sdata = { userId };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };

        const response = await fetch('/getUser', options);
        const json = await response.json();
        console.log(json);
        unitPrice = json.user.unitPrice;
        creditScore = json.user.creditScore;

        document.getElementById("unitPrice").innerHTML = unitPrice;
        document.getElementById("creditScore").innerHTML = creditScore;

        document.getElementById("unitPriceVal").value = unitPrice;
        if (document.getElementById("unitPriceVal").value == 0.74) document.getElementById("increment").style.color = "#aaa";
        else if (document.getElementById("unitPriceVal").value == 0.37) document.getElementById("decrement").style.color = "#aaa";
        
        showStatus(userId); //show user status in main menu (function is found in status.js)

    } else window.location.assign('../');
});

function cancel() {
    document.getElementById("dimContent").classList.remove("dimVisible");
    var prompts = document.getElementsByClassName("windowPrompt");
    for (var i = 0; i < prompts.length; i++) {
        prompts[i].style.display = 'none';
    }
}

document.getElementById("viewCreditScore").addEventListener('click', () => {
    document.getElementById("dimContent").classList.add("dimVisible");
    document.getElementById('creditScorePercent').style.strokeDasharray = "0px 367px";
    setTimeout(function () {
        document.getElementById("creditScorePopUp").style.display = "block";
        document.getElementById('creditScoreVal').innerHTML = creditScore;
    }, 250);
    setTimeout(function () {
        percent = 367 * creditScore / 100;
        document.getElementById('creditScorePercent').style.strokeDasharray = percent + "px 367px";
    }, 500);
    
});

document.getElementById("editUnitPrice").addEventListener('click', () => {
    document.getElementById("dimContent").classList.add("dimVisible");
    setTimeout(function () { document.getElementById("windowPromptUnitPrice").style.display = "block"; }, 250);
});

var timer;
var touched = 0;
function increment() {
    document.getElementById("unitPriceVal").stepUp(1);
    if (document.getElementById("unitPriceVal").value == 0.74) stop();
    timer = setInterval(function () {
        document.getElementById("unitPriceVal").stepUp(1);
        if (document.getElementById("unitPriceVal").value == 0.74) stop();
    }, 100);
}
function decrement() {
    document.getElementById("unitPriceVal").stepDown(1);
    if (document.getElementById("unitPriceVal").value == 0.37) stop();
    timer = setInterval(function () {
        document.getElementById("unitPriceVal").stepDown(1);
        if (document.getElementById("unitPriceVal").value == 0.37) stop();
    }, 100); // the above code is executed every 100 ms
}

function stop() {
    if (document.getElementById("unitPriceVal").value == 0.74) document.getElementById("increment").style.color = "#aaa";
    if (document.getElementById("unitPriceVal").value > 0.37) document.getElementById("decrement").style.color = "#6dbec3";
    if (document.getElementById("unitPriceVal").value == 0.37) document.getElementById("decrement").style.color = "#aaa";
    if (document.getElementById("unitPriceVal").value < 0.74) document.getElementById("increment").style.color = "#6dbec3";
    if (timer) clearInterval(timer);
}

async function updateUnitPrice() {
    var user = firebase.auth().currentUser;
    var userId = user.uid; //current user

    let newUnitPrice = document.getElementById("unitPriceVal").value;
    if (newUnitPrice != null && newUnitPrice != '' && newUnitPrice != unitPrice) {


        const sdata = { userId, newUnitPrice };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };

        const response = await fetch('/updateUnitPrice', options);
        const json = await response.json();
        console.log(json);

        location.reload();
    } else cancel();
}


