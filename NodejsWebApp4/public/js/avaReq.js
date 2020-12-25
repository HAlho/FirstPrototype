//const avReq = document.getElementById('avReq');
//avReq.addEventListener('click', listRequests);

var canAccept = true;
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        var userId = firebase.auth().currentUser.uid; //current user
        firebase.database().ref('users/' + userId + '/activeRequest').on('value', function (snapshot) {
            //Check if user has an active request
            if (snapshot.exists()) canAccept = false;
        });

        firebase.database().ref('activeRequests/issued').on('value', function (snapshot) {

            var data = snapshot.val(); //get all request info
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

                (function (index) {
                    button.addEventListener("click", function () {
                        if (canAccept == false) {
                            alert("Active Request is Already in Progress!");
                            return;
                        }
                        //Store request info under supplier's user info
                        firebase.database().ref('users/' + userId).child("activeRequest").set({ id: index, dbref: "accepted", role: "supplier" });
                        //Update request info under requester's user info
                        firebase.database().ref('users/' + data[k].requester.uid).child("activeRequest").update({ dbref: "accepted" });

                        //Move request from issued to accepted
                        reqAccepted = new Date().toString();
                        console.log(reqAccepted);
                        firebase.database().ref('activeRequests/accepted').child(index).set({
                            amount: data[index].amount,
                            requester: data[index].requester,
                            supplier: {
                                uid: userId
                            },
                            timestamp: reqAccepted
                        });
                        firebase.database().ref('activeRequests/issued/' + index).remove();
                        window.location.replace('../profile');
                    });
                })(k)
            }
        });


    } else window.location.assign('../');
});



