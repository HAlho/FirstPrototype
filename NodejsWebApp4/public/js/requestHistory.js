
const auth = firebase.auth();

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        console.log(user);
        // User is signed in.
        var userId = auth.currentUser.uid;

        const sdata = { userId };
        console.log(sdata);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sdata)
        };
        const response = await fetch('/getHistory', options);
        const json = await response.json();
        console.log(json);
        data = json.hist;



        if (data != null) {


            var keys = Object.keys(data); //get request ids
            console.log(keys);

            for (var i = 0; i < keys.length; i++) { //need to show only the associated requests with the user
                //get request information
                let k = keys[i];
                let timestamp = data[k].timestamp;
                let date = timestamp.substr(4, 11);
                let amount = data[k].amount + " kWh";
                let status = data[k].status;
                let cost = data[k].cost + " AED";
                let role;
                data[k].requester.uid == userId ? role = "requester" : role = "provider";

                appendRequest(k, role, date, amount, status, cost);
                appendRequestToAll(k, role, date, amount, status, cost);
            }
        }

        if (document.getElementById("allDiv").innerHTML == "") {
            let tAll = document.createElement('p');
            tAll.innerHTML = "No requests to show.";
            tAll.classList.add('noRequests');
            document.getElementById("allDiv").appendChild(tAll);
        }
        if (document.getElementById("requestedDiv").innerHTML == "") {
            let tRequested = document.createElement('p');
            tRequested.innerHTML = "You have not made any charge requests yet.";
            tRequested.classList.add('noRequests');
            document.getElementById("requestedDiv").appendChild(tRequested);
        }
        if (document.getElementById("acceptedDiv").innerHTML == "") {
            let tAccepted = document.createElement('p');
            tAccepted.innerHTML = "You have not accepted any requests yet.";
            tAccepted.classList.add('noRequests');
            document.getElementById("acceptedDiv").appendChild(tAccepted);
        }



    } else {
        window.location.replace('../signup'); //redirect user to main page
    }
});

function appendRequest(k, role, date, amount, status, cost) {
    let request = document.createElement('table');

    let dateTd = document.createElement('td');
    dateTd.colSpan = "3";
    let dateText = document.createTextNode(date);
    dateTd.appendChild(dateText);
    dateTd.classList.add('date');

    let arrowTd = document.createElement('td');
    arrowTd.rowSpan = "3";

    arrowTd.innerHTML = '<i class="fas fa-chevron-right" style="color:darkgray; font-size:1.1em;"></i>';
    arrowTd.style.textAlign = "right";
    arrowTd.style.width = "20px";
    let tr1 = document.createElement('tr');
    tr1.appendChild(dateTd); tr1.appendChild(arrowTd);


    let emptyTdTr2 = document.createElement('td');
    emptyTdTr2.style.width = "10px";

    let amountTd = document.createElement('td');
    let amountText = document.createTextNode(amount);
    amountTd.appendChild(amountText);

    let costTd = document.createElement('td');
    costTd.style.textAlign = "right"; costTd.style.width = "100px";
    if (status == 'completed') {
        let costText = document.createTextNode(cost);
        costTd.appendChild(costText);
    }

    let tr2 = document.createElement('tr');
    tr2.appendChild(emptyTdTr2); tr2.appendChild(amountTd); tr2.appendChild(costTd);

    let emptyTdTr3 = document.createElement('td');
    let statusTd = document.createElement('td');
    statusTd.colSpan = "2";

    let statusText = document.createTextNode(status);
    statusTd.appendChild(statusText);

    if (status == 'completed') statusTd.classList.add('statCompleted');
    else statusTd.classList.add('statCanceled');
    let tr3 = document.createElement('tr');
    tr3.appendChild(emptyTdTr3); tr3.appendChild(statusTd);

    document.getElementById("requested").appendChild(request);

    request.appendChild(tr1);
    request.appendChild(tr2);
    request.appendChild(tr3);

    let reqLink = document.createElement('a');
    reqLink.href = '../requestInfo?reqId=' + k;
    reqLink.appendChild(request);
    role == "requester" ? document.getElementById("requestedDiv").appendChild(reqLink) : document.getElementById("acceptedDiv").appendChild(reqLink);
}




function appendRequestToAll(k, role, date, amount, status, cost) {
    let request = document.createElement('table');

    let dateTd = document.createElement('td');
    dateTd.colSpan = "3";
    let dateText = document.createTextNode(date);
    dateTd.appendChild(dateText);
    dateTd.classList.add('date');

    let arrowTd = document.createElement('td');
    arrowTd.rowSpan = "3";

    arrowTd.innerHTML = '<i class="fas fa-chevron-right" style="color:darkgray; font-size:1.1em;"></i>';
    arrowTd.style.textAlign = "right";
    arrowTd.style.width = "20px";
    let tr1 = document.createElement('tr');
    tr1.appendChild(dateTd); tr1.appendChild(arrowTd);


    let emptyTdTr2 = document.createElement('td');
    emptyTdTr2.style.width = "10px";
    let amountTd = document.createElement('td');
    role == "requester" ? amount += " (requested)" : amount += " (provided)";
    let amountText = document.createTextNode(amount);
    amountTd.appendChild(amountText);

    let costTd = document.createElement('td');
    costTd.style.textAlign = "right";
    costTd.style.width = "100px";
    if (status == 'completed') {
        role == "requester" ? cost = '-' + cost : cost = '+' + cost;
        let costText = document.createTextNode(cost + " AED");
        costTd.appendChild(costText);
    }

    let tr2 = document.createElement('tr');
    tr2.appendChild(emptyTdTr2); tr2.appendChild(amountTd); tr2.appendChild(costTd);

    let emptyTdTr3 = document.createElement('td');

    let statusTd = document.createElement('td');
    statusTd.colSpan = "2";

    let statusText = document.createTextNode(status);
    statusTd.appendChild(statusText);

    if (status == 'completed') statusTd.classList.add('statCompleted');
    else statusTd.classList.add('statCanceled');
    let tr3 = document.createElement('tr');
    tr3.appendChild(emptyTdTr3); tr3.appendChild(statusTd);

    request.appendChild(tr1);
    request.appendChild(tr2);
    request.appendChild(tr3);

    let reqLink = document.createElement('a');
    reqLink.href = '../requestInfo?reqId=' + k;
    reqLink.appendChild(request);

    document.getElementById("allDiv").appendChild(reqLink);
}