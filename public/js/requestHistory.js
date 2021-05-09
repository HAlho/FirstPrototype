// JavaScript source code
var allDiv = document.getElementById('allDiv'); //section to display all requests
var requestedDiv = document.getElementById('requestedDiv'); //section to display all requests
var acceptedDiv = document.getElementById('acceptedDiv'); //section to display all requests
var allLabel = document.getElementById('allLabel'); //all label
var requestedLabel = document.getElementById('requestedLabel'); //requested label
var acceptedLabel = document.getElementById('acceptedLabel'); //accepted label

document.getElementById("all").checked = true; //display all requests initially

//when the 'all' button is clicked
document.getElementById("all").addEventListener('click', () => {
    //show 'allDiv' and hide the rest, give class 'labelSelected' to the div's label
    allDiv.style.display = "block"; allLabel.classList.add("labelSelected");
    requestedDiv.style.display = "none"; requestedLabel.classList.remove("labelSelected");
    acceptedDiv.style.display = "none"; acceptedLabel.classList.remove("labelSelected");
});

//when the 'requested' button is clicked
document.getElementById("requested").addEventListener('click', () => {
    //show 'requestedDiv' and hide the rest, give class 'labelSelected' to the div's label
    allDiv.style.display = "none"; allLabel.classList.remove("labelSelected");
    requestedDiv.style.display = "block"; requestedLabel.classList.add("labelSelected");
    acceptedDiv.style.display = "none"; acceptedLabel.classList.remove("labelSelected");
});

//when the 'accepted' button is clicked
document.getElementById("accepted").addEventListener('click', () => {
    //show 'acceptedDiv' and hide the rest, give class 'labelSelected' to the div's label
    allDiv.style.display = "none"; allLabel.classList.remove("labelSelected");
    requestedDiv.style.display = "none"; requestedLabel.classList.remove("labelSelected");   
    acceptedDiv.style.display = "block"; acceptedLabel.classList.add("labelSelected");
});

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        var userId = firebase.auth().currentUser.uid; //current user Id

        //get all previous requests from the server
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
        data = json.previousRequests; //previous requests
		console.log(data);
        if (data != null) { //if there are previous requests
            var keys = Object.keys(data); //get request ids
							console.log(keys);
            for (var i = keys.length-1; i >= 0; i--) {
                //get request information
                let k = keys[i]; //request ID
				console.log(k);
                let timestamp = data[k].timestamp; //request timestamp
                let date = timestamp.substr(4, 11); //get date from the timestamp
                let amount = data[k].amount + " kWh"; //requested charge amount
                let cost = data[k].match.estAmount + " AED"; //amount of money charged/payed
                let status = data[k].status; //request status (completed/canceled)
                let role; //user's role in the request (requester/provider)
                data[k].requester.uid == userId ? role = "requester" : role = "provider"; //set role

                appendRequest(k, role, date, amount, status, cost); //append request to 'requestedDiv' or 'acceptedDiv'
                appendRequestToAll(k, role, date, amount, status, cost); //append request to 'allDiv'
            }
        }

        //display text message if a div is empty (i.e. doesn't have requests)
        if (allDiv.innerHTML == "") { //allDiv is empty
            let text = document.createElement('p');
            text.innerHTML = "No requests to show.";
            text.classList.add('noInformation');
            allDiv.appendChild(text);
        } else allDiv.lastElementChild.style.marginBottom = "200px";

        if (requestedDiv.innerHTML == "") { //requestedDiv is empty
            let text = document.createElement('p');
            text.innerHTML = "You have not made any charge requests yet.";
            text.classList.add('noInformation');
            requestedDiv.appendChild(text);
        } else requestedDiv.lastElementChild.style.marginBottom = "200px";

        if (acceptedDiv.innerHTML == "") { //acceptedDiv is empty
            let text = document.createElement('p');
            text.innerHTML = "You have not accepted any requests yet.";
            text.classList.add('noInformation');
            acceptedDiv.appendChild(text);
        } else acceptedDiv.lastElementChild.style.marginBottom = "200px";

        showPage(); //page is set and loaded, show content

    } else window.location.assign('../mainpage'); //forward user to the welcome page
});


//function to append request to 'requestedDiv' or 'acceptedDiv'
function appendRequest(k, role, date, amount, status, cost) {
    //create table to put request info in
    let requestTable = document.createElement('table');


    //td elements
    //create a td element to display request date (col span = 3)
    let dateTd = document.createElement('td'); dateTd.colSpan = "3"; dateTd.classList.add('date');
    let dateText = document.createTextNode(date);
    dateTd.appendChild(dateText);

    //create a td element to display an arrow (row span = 3)
    let arrowTd = document.createElement('td'); arrowTd.rowSpan = "3";
    arrowTd.innerHTML = '<i class="fas fa-chevron-right" style="color:darkgray; font-size:1.1em;"></i>';
    arrowTd.style.textAlign = "right"; arrowTd.style.width = "20px"; //style element

    //create a td element to display requested charge amount
    let amountTd = document.createElement('td');
    let amountText = document.createTextNode(amount);
    amountTd.appendChild(amountText);

    //create a td element to display cost
    let costTd = document.createElement('td');
    costTd.style.textAlign = "right"; costTd.style.width = "100px"; //style element
    if (status == 'completed') { //show cost if request was completed
        let costText = document.createTextNode(cost);
        costTd.appendChild(costText);
    }

    //create a td element to display request status (col span = 2)
    let statusTd = document.createElement('td'); statusTd.colSpan = "2";
    let statusText = document.createTextNode(status);
    statusTd.appendChild(statusText);
    status == 'completed' ? statusTd.classList.add('statCompleted') : statusTd.classList.add('statCanceled');

    //create empty tds to add space
    let emptyTdTr2 = document.createElement('td'); emptyTdTr2.style.width = "10px";
    let emptyTdTr3 = document.createElement('td');


    //tr elements
    //create row and append request date and an arrow
    let tr1 = document.createElement('tr');
    tr1.appendChild(dateTd); tr1.appendChild(arrowTd);

    //create row and append charge amount and cost
    let tr2 = document.createElement('tr');
    tr2.appendChild(emptyTdTr2); tr2.appendChild(amountTd); tr2.appendChild(costTd);

    //create row and append request status
    let tr3 = document.createElement('tr');
    tr3.appendChild(emptyTdTr3); tr3.appendChild(statusTd);


    //append rows to tha table
    requestTable.appendChild(tr1);
    requestTable.appendChild(tr2);
    requestTable.appendChild(tr3);

    //create link to take user to the request's detailed page
    let reqLink = document.createElement('a');
    reqLink.href = '../requestInfo?reqId=' + k;
    reqLink.appendChild(requestTable); //append table to link

    //append request to page
    role == "requester" ? document.getElementById("requestedDiv").appendChild(reqLink) : document.getElementById("acceptedDiv").appendChild(reqLink);
}




function appendRequestToAll(k, role, date, amount, status, cost) {
    //create table to put request info in
    let requestTable = document.createElement('table');


    //td elements
    //create a td element to display request date (col span = 3)
    let dateTd = document.createElement('td'); dateTd.colSpan = "3"; dateTd.classList.add('date');
    let dateText = document.createTextNode(date);
    dateTd.appendChild(dateText);

    //create a td element to display an arrow (row span = 3)
    let arrowTd = document.createElement('td'); arrowTd.rowSpan = "3";
    arrowTd.innerHTML = '<i class="fas fa-chevron-right" style="color:darkgray; font-size:1.1em;"></i>';
    arrowTd.style.textAlign = "right"; arrowTd.style.width = "20px"; //style element

    //create a td element to display requested charge amount
    let amountTd = document.createElement('td');
    role == "requester" ? amount += " (requested)" : amount += " (provided)";
    let amountText = document.createTextNode(amount);
    amountTd.appendChild(amountText);

    //create a td element to display cost
    let costTd = document.createElement('td');
    costTd.style.textAlign = "right"; costTd.style.width = "100px"; //style element
    if (status == 'completed') { //show cost if request was completed
        role == "requester" ? cost = '-' + cost : cost = '+' + cost;
        let costText = document.createTextNode(cost);
        costTd.appendChild(costText);
    }

    //create a td element to display request status (col span = 2)
    let statusTd = document.createElement('td'); statusTd.colSpan = "2";
    let statusText = document.createTextNode(status);
    statusTd.appendChild(statusText);
    status == 'completed' ? statusTd.classList.add('statCompleted') : statusTd.classList.add('statCanceled');

    //create empty tds to add space
    let emptyTdTr2 = document.createElement('td'); emptyTdTr2.style.width = "10px";
    let emptyTdTr3 = document.createElement('td');


    //tr elements
    //create row and append request date and an arrow
    let tr1 = document.createElement('tr');
    tr1.appendChild(dateTd); tr1.appendChild(arrowTd);

    //create row and append charge amount and cost
    let tr2 = document.createElement('tr');
    tr2.appendChild(emptyTdTr2); tr2.appendChild(amountTd); tr2.appendChild(costTd);

    //create row and append request status
    let tr3 = document.createElement('tr');
    tr3.appendChild(emptyTdTr3); tr3.appendChild(statusTd);


    //append rows to tha table
    requestTable.appendChild(tr1);
    requestTable.appendChild(tr2);
    requestTable.appendChild(tr3);

    //create link to take user to the request's detailed page
    let reqLink = document.createElement('a');
    reqLink.href = '../requestInfo?reqId=' + k;
    reqLink.appendChild(requestTable); //append table to link

    //append request to page
    document.getElementById("allDiv").appendChild(reqLink);
}