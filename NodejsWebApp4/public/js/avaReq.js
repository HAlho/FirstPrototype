//const avReq = document.getElementById('avReq');
//avReq.addEventListener('click', listRequests);

var canAccept = true;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

firebase.auth().onAuthStateChanged( async function (user) {
    if (user) {

        var userId = firebase.auth().currentUser.uid; //current user

        const data = { userId };
        console.log(data);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
        const response = await fetch('/check', options);
        const json = await response.json();
        console.log(json);

        canAccept = json.canAccept;

        getReq(userId);

    } else window.location.assign('../');
});


async function getReq(userId) {
    while (1) {
        console.log("repeat");

        const response = await fetch('/getReq');
        const json = await response.json();
        console.log(json);
        data = json.Req;

        if (data == null) {
            document.getElementById("p2").innerHTML = "No available Requests";
            return;
        } else document.getElementById("p2").innerHTML = "";
        var keys = Object.keys(data); //get request ids
        const list = document.getElementById('list'); //get ul element
        while (list.firstChild) list.removeChild(list.firstChild);

        for (var i = 0; i < keys.length; i++) {
            //get request information
            var k = keys[i];

            let requesterId = data[k].requester.uid;
            if (requesterId == userId) continue;

            var amount = data[k].amount;

            //append request information to list
            var li = document.createElement("li");
            var amt = document.createTextNode(amount + " kW");
            var button = document.createElement("button");
            button.innerHTML = "Accept";
            li.appendChild(amt);
            li.appendChild(button);
            list.appendChild(li);

            ( async function (index) {
                button.addEventListener("click", async function () {
                    if (canAccept == false) {
                        alert("Active Request is Already in Progress!");
                        return;
                    }

                    reqAccepted = new Date().toString();
                    const reqId = data[k].requester.uid;
                    const amount = data[index].amount;
                    const reqInfo = data[index].requester;

                    const sendData = { userId, index, reqId , amount , reqInfo , reqAccepted };
                    console.log(sendData);

                    const options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sendData)
                    };
                    const response = await fetch('/change', options);
                    const json = await response.json();
                    console.log(json);
                    window.location.replace('../profile');
                });
            })(k)
        }
        await sleep(5000);
    }
}