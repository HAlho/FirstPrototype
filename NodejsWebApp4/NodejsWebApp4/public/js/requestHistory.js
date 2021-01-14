
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

            var keys = Object.keys(data); //get request ids
            console.log(keys);

            if (data == null) {
                document.getElementById("p2").innerHTML = "No History";
                return;
            } else document.getElementById("p2").innerHTML = "";

            var table = document.createElement('table');

            let r = document.createElement('tr');

            let thReqId = document.createElement('th');
            let thRole = document.createElement('th');
            let thStatus = document.createElement('th');
            let thAmount = document.createElement('th');
            let thReqCar = document.createElement('th');

            let h1 = document.createTextNode("Request ID");
            let h2 = document.createTextNode("Role");
            let h5 = document.createTextNode("Status");
            let h3 = document.createTextNode("Charge Amount");
            let h4 = document.createTextNode("Requester's Car");

            thReqId.appendChild(h1); thRole.appendChild(h2); thStatus.appendChild(h5); thAmount.appendChild(h3); thReqCar.appendChild(h4);
            r.appendChild(thReqId); r.appendChild(thRole); r.appendChild(thStatus); r.appendChild(thAmount); r.appendChild(thReqCar);
            table.appendChild(r);

            var reqCompleted = 0;
            var provCompleted = 0;
            var reqCancelled = 0;

            for (var i = 0; i < keys.length; i++) { //need to show only the associated requests with the user
                //get request information


                var k = keys[i];
                console.log(data[k].requester.uid);
                var role;
                if (data[k].requester.uid == userId) role = "requester";
                else if (data[k].supplier.uid == userId) role = "supplier";

                var car = data[k].requester.car;
                var status = data[k].status;

                if (status == "completed" && role == "requester") reqCompleted = reqCompleted + 1;
                if (status == "completed" && role == "supplier") provCompleted++;
                if (status == "canceled" && role == "requester") reqCancelled++;
                console.log(reqCompleted);


                let tr = document.createElement('tr');

                let tdReqId = document.createElement('td');
                let tdRole = document.createElement('td');
                let tdStatus = document.createElement('td');
                let tdAmount = document.createElement('td');
                let tdReqCar = document.createElement('td');

                let ReqId = document.createTextNode(k);
                let Role = document.createTextNode(role);
                let Status = document.createTextNode(status);
                let Amount = document.createTextNode(String(data[k].amount));
                let ReqCar = document.createTextNode(car.brand + ' ' + car.model);

                tdReqId.appendChild(ReqId); tdRole.appendChild(Role); tdStatus.appendChild(Status); tdAmount.appendChild(Amount); tdReqCar.appendChild(ReqCar);

                tr.appendChild(tdReqId); tr.appendChild(tdRole); tr.appendChild(tdStatus); tr.appendChild(tdAmount); tr.appendChild(tdReqCar);

                table.appendChild(tr);
            }
            console.log("Requests completed as a requester: " + reqCompleted + "<br><br> Requests completed as a provider: " + provCompleted + " <br><br>Cancelled requests: " + reqCancelled);
            document.getElementById("p2").innerHTML = "Requests completed as a requester: " + reqCompleted + "<br><br> Requests completed as a provider: " + provCompleted + " <br><br>Cancelled requests: " + reqCancelled;
            document.getElementById("mydiv").appendChild(table);



    } else {
        console.log("user is not signed")
        window.location.replace('../signup'); //redirect user to main page

    }
});
