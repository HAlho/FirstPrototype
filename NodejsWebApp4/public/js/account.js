// JavaScript source code
unitPrice, creditScore;

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {

        var user = firebase.auth().currentUser;
        var userId = user.uid; //current user
        var name = user.displayName;
        var email = user.email;

        document.getElementById("name").innerHTML = name;
        document.getElementById("email").innerHTML = email;

        const sdata = { userId };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };

        const response = await fetch('/getUserInfo', options);
        const json = await response.json();
        console.log(json);
        unitPrice = json.unitPrice;
        creditScore = json.creditScore;


        document.getElementById("unitPrice").innerHTML = "Unit Price: " + unitPrice;
        document.getElementById("creditScore").innerHTML = "Credit Score: " + creditScore;

    } else window.location.assign('../');
});

document.getElementById("unitPrice").addEventListener('click', () => {
    var user = firebase.auth().currentUser;
    var userId = user.uid; //current user

    var newUnitPrice = prompt("Please enter your unit price (0.37 - 0.74AED/kWh):\n(Recommended: 0.5AED/kWh)", unitPrice);

    if (newUnitPrice != null && newUnitPrice != '' && newUnitPrice != unitPrice) {
        updateUnitPrice(userId, newUnitPrice);
    }
});

async function updateUnitPrice(userId, newUnitPrice) {
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

    window.location.replace('../account');
}