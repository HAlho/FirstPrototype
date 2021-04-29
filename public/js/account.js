// JavaScript source code
const MAX_UNITPRICE = 0.74; //max unit price constant
const MIN_UNITPRICE = 0.37; //min unit price constant
var locTimer; //used to get the user's location every 500ms
var timer; //when user holds the + or - button set timer. when user lets go, clear timer.

//global variables
var unitPrice, creditScore; //store user unit price and credit score

//html elements event listeners
//forward user to 'payment' page when 'payment' button is clicked
document.getElementById("payment").addEventListener('click', () => {
    window.location.assign('../payment');
});

//forward user to 'viewCars' page when 'cars' button is clicked
document.getElementById("cars").addEventListener('click', () => {
    window.location.assign('../viewCars');
});

//forward user to 'settings' page when 'settings' button is clicked
document.getElementById("settings").addEventListener('click', () => {
    window.location.assign('../settings');
});

//forward user to 'requestHistory' page when 'reqHistory' button is clicked
document.getElementById("reqHistory").addEventListener('click', () => {
    window.location.assign('../requestHistory');
});

//credit score section is clicked, user wants to view their credit score
document.getElementById("viewCreditScore").addEventListener('click', () => {
    document.getElementById("dimScreen").classList.add("dimVisible"); //dim screen
    document.getElementById('creditScorePercent').style.strokeDasharray = "0px 367px"; //set credit score = 0 in credit score SVG figure

    //display credit score window with 250ms delay
    setTimeout(function () {
        document.getElementById("creditScorePopUp").style.display = "block"; //show window
        document.getElementById('creditScoreVal').innerHTML = creditScore; //show credit score value
    }, 250);

    //show credit score in SVG figure with 500ms delay
    setTimeout(function () {
        percent = 367 * creditScore / 100; //get credit score percent
        document.getElementById('creditScorePercent').style.strokeDasharray = percent + "px 367px"; //show user's credit score in SVG figure
    }, 500);
});

//unit price section is clicked, user wants to edit their unit price
document.getElementById("editUnitPrice").addEventListener('click', () => {
    document.getElementById("dimScreen").classList.add("dimVisible"); //dim screen
    setTimeout(function () { document.getElementById("windowPromptUnitPrice").style.display = "block"; }, 250); //show window prompt
});

//'logout' button event listener
document.getElementById("logout").addEventListener('click', () => {
    //user wants to logout
    firebase.auth().signOut() //signOut() is a built in firebase function responsible for signing a user out
        .then(() => {
            window.location.assign('../mainpage'); //forward user to the welcome page
        }).catch(error => { //error logging user out
            console.error(error);
        });
});



//main function
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        var user = firebase.auth().currentUser; //current user
        var userId = user.uid; //user ID
        var name = user.displayName; //user name
        var email = user.email; //user email address

        //get user info from the server
        const sdata = { userId };
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/getUser', options);
        const json = await response.json(); //server response
        unitPrice = json.user.unitPrice; //user unit price
        creditScore = json.user.creditScore; //user credit score

        //display user information on page
        document.getElementById("name").innerHTML = "Hi, " + name; //user name
        document.getElementById("email").innerHTML = email; //user email address
        document.getElementById("unitPrice").innerHTML = unitPrice; //unit price
        document.getElementById("creditScore").innerHTML = creditScore; //user credit score

        //set unit price input spinner
        document.getElementById("unitPriceVal").value = unitPrice;
        if (document.getElementById("unitPriceVal").value == MAX_UNITPRICE) document.getElementById("increment").style.color = "#aaa"; //user's unit price is max, disable increment button
        else if (document.getElementById("unitPriceVal").value == MIN_UNITPRICE) document.getElementById("decrement").style.color = "#aaa"; //unit unit price is min, disable decrement button

        showPage();
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});


//when any window prompt's cancel button is clicked
function cancel() {
    var prompts = document.getElementsByClassName("windowPrompt"); //gete all window prompts
    for (var i = 0; i < prompts.length; i++) prompts[i].style.display = 'none'; //hide all window prompts
    document.getElementById("dimScreen").classList.remove("dimVisible"); //brighten screen
}



//user wants to increase their unit price
function increment() { //increment unit price in the unitPrice input spinner
    document.getElementById("unitPriceVal").stepUp(1); //increment unit price by 1 step (1 step = 0.01)
    if (document.getElementById("unitPriceVal").value == MAX_UNITPRICE) stop(); //if user reached max unit price, call stop()

    //if user held the increment button down, increment unit price by 1 step every 100ms
    timer = setInterval(function () {
        document.getElementById("unitPriceVal").stepUp(1); //increment by 1 step
        if (document.getElementById("unitPriceVal").value == MAX_UNITPRICE) stop(); //if user reached max unit price, call stop()
    }, 100);
}

//user wants to decrease their unit price
function decrement() { //decrement unit price in the unitPrice input spinner
    document.getElementById("unitPriceVal").stepDown(1);//decrement unit price by 1 step (1 step = 0.01)
    if (document.getElementById("unitPriceVal").value == MIN_UNITPRICE) stop(); //if user reached min unit price, call stop()

    //if user held the decrement button down, decrement unit price by 1 step every 100ms
    timer = setInterval(function () {
        document.getElementById("unitPriceVal").stepDown(1); //decrement by 1 step
        if (document.getElementById("unitPriceVal").value == MIN_UNITPRICE) stop(); //if user reached min unit price, call stop()
    }, 100); // the above code is executed every 100 ms
}

//user either let go of the increment/decrement button or reached max/min unit price
function stop() {
    //check if user reached min/max unit price
    if (document.getElementById("unitPriceVal").value == MAX_UNITPRICE) document.getElementById("increment").style.color = "#aaa"; //user reached max unit price, disable increment button
    if (document.getElementById("unitPriceVal").value == MIN_UNITPRICE) document.getElementById("decrement").style.color = "#aaa"; //user reached min unit price, disable decrement button
    if (document.getElementById("unitPriceVal").value < MAX_UNITPRICE) document.getElementById("increment").style.color = "#6dbec3"; //user can increase unit price, enable increment button
    if (document.getElementById("unitPriceVal").value > MIN_UNITPRICE) document.getElementById("decrement").style.color = "#6dbec3"; //user can decrease unit price, enable decrement button

    if (timer) clearInterval(timer); //clear timer to stop unit price from increasing / decreasing
}

//user changed their unit price and wants to save changes
async function updateUnitPrice() {
    var userId = firebase.auth().currentUser.uid; //user ID
    let newUnitPrice = document.getElementById("unitPriceVal").value; //get new unit price value

    if (newUnitPrice != null && newUnitPrice != '' && newUnitPrice != unitPrice) { //if unit price value is valid
        //send new unit price value to the server
        const sdata = { userId, newUnitPrice };
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/updateUnitPrice', options);
        const json = await response.json();

        location.reload(); //reload page
    } else cancel(); //hide window prompt
}
