// JavaScript source code
window.onbeforeunload = function () { //user changed page/refreshed/left website
    setOffline(); //set the user's status to offline
};

//function to set the user's status to offline
async function setOffline() {
    userId = firebase.auth().currentUser.uid; //current user ID

    //send user ID to the server to set the user as offline
    const data = { userId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/setOffline', options);
    const json = await response.json();
}

//function to remove offline from the user's status
async function setOnline() {
    userId = firebase.auth().currentUser.uid; //current user ID

    //send user ID to the server to set the user as offline
    const data = { userId };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetch('/setOnline', options);
    const json = await response.json();
}

//function to call when the page is loaded
function showPage() {
    document.getElementById('loading').classList.add('hidden'); //hide the loading icon
    document.getElementById('content').classList.remove('hidden'); //display page content
}

//get the user's location periodically
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) { //if user is authenticated
        var userId = firebase.auth().currentUser.uid; //current user ID

        //if the user was offline, remove 'offline' from his/her status
        setOnline();

        //keep updating the user's location
        locTimer = setInterval(async function () {
            //get user's location and send it to the server. server will store location in the database
            if ('geolocation' in navigator && localStorage.getItem('locationPermission') == 'granted') { //if location access is allowed
                navigator.geolocation.getCurrentPosition(async position => {
                    //get current latitude, longitude and time
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const tim = position.timestamp;

                    //send user's location to the server to save location
                    const d1 = { userId, lat, lon, tim };
                    options1 = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(d1)
                    };
                    const response1 = await fetch('/storeGeolocation', options1);
                    const json2 = await response1.json();
                });
            }
        }, 5000); //repeat every 5 seconds
    } else window.location.assign('../mainpage'); //forward user to the welcome page
});