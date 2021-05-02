const fs = require('fs');

const https = require('https');

const { admin } = require('./routes/firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

const calculate = require('./build/Release/indexc');
const miniList = require('./build/Release/check');


//if result 0 -> no issued requests
//if result 1 -> algorithm run successfuly
//if result 4 -> error occured
var result = 0;
var url;
const key = '&key=AIzaSyAeScJ1dc_tF6kCU0_K7px8N86p9QQ9Djg';
var lat, long;

//create a promise to exit the process, promise is fullfilled by calling myResolve
let myPromise = new Promise(function (myResolve, myReject) {
    //listen for a message from the main process, if message received excute code
    process.on('message', async (msg) => {

        
        var points = '';//variable to store origin and destination coordinates for distnace matrix api in url form

        //consumer part-------

        //since the process id is unique, it will be part of the file name
        var filename = "c" + msg.pid + ".txt";

        //get the requesters information from the database
        var snapshot = await db.ref('activeRequests/issued/').once('value');
        var req = snapshot.val();

        //if there isn't any request, exit the process
        if (req == null)
            myResolve();

        else {
            var keys = Object.keys(req);//store IDs of issed requests
            var contents = "";

            //process is repeated for each issued request
            for (let k of keys) {

                //get the consumption rate of the car model used
                snapshot = await db.ref('carList/' + req[k].requester.car.brand + "/" + req[k].requester.car.model).once('value');
                var car = snapshot.val();
                let consumptionRate = car.avgConsumption;

                //get location coordinates from the database
                snapshot = await db.ref('users/' + req[k].requester.uid + '/location').once('value');
                let location = snapshot.val();

                try {
                    //consumers file: id, latitude, longiture, needed Energy, maxDistance, consumptionRate
                    contents = contents.concat(req[k].requester.uid + " " + location.latitude + " " + location.longitude + " " + req[k].amount + " " + req[k].requester.maxDistance + " " + consumptionRate + "\n");

                    points = points.concat(location.latitude + '%2C' + location.longitude + '%7C');
                } catch (e) {
                    console.log(e);
                }


            }
            //write the contents of consumer file and store it in IOs
            fs.writeFileSync('./IOs/' + filename, contents);

            points = points.concat('&destinations=');

            //change file name and read file from IOs
            filename = './IOs/MPFile.txt';
            var data = fs.readFileSync(filename, "utf8");

            //split the file contents into an array based on the lines
            var lines = data.split('\r\n');
            first = true;

            //take the longitude and latitude and append it to points
            for (let i of lines) {
                if (!first)
                    points = points.concat('%7C');  //%2C means , and %7C means |
                sindex = i.lastIndexOf(" ");//find the second's space index
                lat = i.substring(2, sindex);
                long = i.substring(sindex + 1, i.length);
                points = points.concat(lat + '%2C' + long);
                first = false;
            }

            //complete the url to find the distance and duration between the consumer and meeting points only
            url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=' + points + key;

            var cdata = '';//variable to store the result of the api request

            //make a get request then excute code when response received
            https.get(url, async (resp) => {

                // A chunk of data has been received.
                resp.on('data', (chunk) => {
                    cdata += chunk;
                });

                // After the whole response has been received excute code
                resp.on('end', async () => {
                    filename = "c" + msg.pid + ".txt"; //change file name to c+pid

                    try {//try and catch for json.parse

                        let json = JSON.parse(cdata);//turn response (text) into json

                        var newData;
                        var fdata = fs.readFileSync('./IOs/' + filename, "utf8");//read consumer file

                        //split file data into lines
                        var lines = fdata.split('\n');
                        for (var i = 0; i < json.rows.length; i++) {

                            var index = lines[i].lastIndexOf('\n'); //finds the position of \n that indicates the new line'
                            lines[i] = lines[i].substring(index + 1, lines[i].length);//remove the end line

                            //append distance&duration of each meeting point to the consumer line
                            for (let k of json.rows[i].elements) {//k is element[count]
                                lines[i] = lines[i].concat(" " + k.distance.value + " " + k.duration.value);
                            }
                        }

                        // join the array back into a single string then store it
                        newData = lines.join('\n');
                        fs.writeFileSync('./IOs/' + filename, newData);

                    } catch (error) {
                        console.log("caught error");
                        console.error(error.message);
                    };

                    //run the minimizing code to decrease the number of meeting points reached
                    miniList.check(msg.pid);

                    //provider part------------

                    //find the distance and duration between the provider and chosen meeting points
                    points = '';

                    //providers: id, latitude, longitude, unitprice, consumptionRate
                    filename = "p" + msg.pid + ".txt";   //since the process id is unique, it will be part of the file name
                    contents = "";

                    //get all users from the database
                    snapshot = await db.ref('users').once('value');
                    const users = snapshot.val();
                    var keys2 = Object.keys(users); //store their ids in keys

                    var k;
                    var first = true;

                    //get all the providers that have their status available, without requests, have car, and have an unexpired location
                    for (i = 0; i < keys2.length; i++) {
                        if (!first)
                            points = points.concat('%7C');

                        //select provider then add to contents
                        k = keys2[i];
                        try {
                            if (users[k].status != "Available") continue;
                            if (users[k].activeRequest != null) continue//check if the user has a request
                            if ((Date.now() - users[k].location.timestamp) > 900000) continue; //check if the location had passed 15 mins
                            if (users[k].cars != null) {
                                if (users[k].creditScore == 0) continue; //check if user is banned
                                var keys3 = Object.keys(users[k].cars); //store ids of the provider's cars

                                for (j = 0; j < keys3.length; j++) {
                                    if (keys3[j] == users[k].currentCar) {
                                        snapshot = await db.ref('carList/' + users[k].cars[keys3[j]].brand + "/" + users[k].cars[keys3[j]].model).once('value');
                                        let car = snapshot.val();

                                        contents = contents.concat(k + " " + users[k].location.latitude + " " + users[k].location.longitude + " " + users[k].unitPrice + " " + car.avgConsumption + "\n");
                                        //append user location to points
                                        points = points.concat(users[k].location.latitude + '%2C' + users[k].location.longitude);
                                        first = false;
                                    }
                                }

                            }
                        } catch (e) {
                            console.log("caught error");
                            console.log(e)
                        }

                    }

                    //write contents to provider file
                    fs.writeFileSync('./IOs/' + filename, contents);
                    points = points.concat('&destinations=');

                    //read file created from minimizing code then split contents
                    filename = './IOs/MP' + msg.pid + '.txt';//file does not contain the coords only the number
                    var data1 = fs.readFileSync(filename, "utf8");//read the new mp file
                    var meetingIds = data1.split("\n");
                    var mId;
                    var countmId = 0; //Indicate the number of selected meeting points

                    filename = './IOs/MPFile.txt';
                    var data = fs.readFileSync(filename, "utf8");
                    var lines = data.split('\r\n');
                    var totalMeetingPoints = 0;
                    first = true;

                    for (let i of lines) {
                        if (!first)
                            points = points.concat('%7C');
                        sindex = i.lastIndexOf(" ");//find the second's space index
                        mId = i.substring(0, 1);//take the id from MPFile
                        totalMeetingPoints++;
                        if (mId.trim() != meetingIds[countmId].trim()) continue;//if MP id is not selected continue
                        countmId++;
                        lat = i.substring(2, sindex);
                        long = i.substring(sindex + 1, i.length);
                        points = points.concat(lat + '%2C' + long);
                        first = false;
                    }

                    //update url to the specified provider's locations and meeting points
                    url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=' + points + key;

                    //make a get request then excute code when response received
                    https.get(url, (resp) => {

                        let data = '';//variable to store the result of the api request
                        resp.on('data', (chunk) => {
                            data += chunk;
                        });

                        // After the whole response has been received excute code
                        resp.on('end', async () => {

                            filename = "p" + msg.pid + ".txt"; //change filename to p+pid

                            try {
                                let json = JSON.parse(data);

                                var newData;
                                var fdata = fs.readFileSync('./IOs/' + filename, "utf8");
                                var lines = fdata.split('\n');
                                for (var i = 0; i < json.rows.length; i++) {
                                    var index = lines[i].lastIndexOf('\n'); //finds the \n that indicates the new line'
                                    lines[i] = lines[i].substring(index + 1, lines[i].length);
                                    for (let k of json.rows[i].elements) {//k is element[count]
                                        lines[i] = lines[i].concat(" " + k.distance.value + " " + k.duration.value);
                                    }
                                    for (var j = countmId; j < totalMeetingPoints; j++)
                                        lines[i] = lines[i].concat(" -1 -1");
                                }

                                // join the array back into a single string and replace the provider file
                                newData = lines.join('\n');
                                fs.writeFileSync('./IOs/' + filename, newData);

                            } catch (error) {
                                console.error(error.message);
                            };


                            result = calculate.calc(15, 24.3, msg.pid);
                            //send the results to database
                            filename = "FinalFile" + msg.pid + ".txt";
                            fdata = fs.readFileSync('./IOs/' + filename, "utf8");
                            var lines2 = fdata.split('\r\n');
                            for (let a of lines2) {
                                if (a == '') continue;
                                let v = a.split(" ");
                                console.log("results are " + v[0] + " " + v[1] + " " + v[2] + " " + v[3]);

                                var stop = false;
                                var cancelQueue = fs.readFileSync('cancelQueue.txt', "utf8");
                                var lines = cancelQueue.split('\n');
                                for (i = 0; i < lines.length; i++) {
                                    //if user is not there
                                    if (lines[i] == v[1]) {
                                        stop = true;
                                        break;
                                    }
                                }

                                if (stop)
                                    continue;

                                //add userid to cancelQueue in order to prevent data bugs
                                fs.writeFileSync('./cancelQueue.txt', v[1]);

                                snapshot = await db.ref('users/' + v[1] + '/activeRequest').once('value');
                                var cReq = snapshot.val();

                                //change requester's reference status to matched
                                await db.ref('users/' + v[1]).child('activeRequest').update({ dbref: "matched" });

                                //change provider status to matched
                                await db.ref('users/' + v[2]).update({ status: "matched" });
                                await db.ref('users/' + v[2]).update({ matchedReq: cReq.id });

                                if (cReq != null) {

                                    db.ref('activeRequests/issued/' + cReq.id + "/match/").set({
                                        provider: v[2],
                                        location: v[0],
                                        estAmount: v[3],
                                        matchMadeAt: Date.now()
                                    });

                                    //move request to matched
                                    let oldRef = db.ref('activeRequests/issued/' + cReq.id);
                                    let newRef = db.ref('activeRequests/matched/' + cReq.id);
                                    snapshot = await oldRef.once('value');
                                    await newRef.set(snapshot.val());
                                    await oldRef.remove();



                                    //find the tokens of the matched providers
                                    snapshot = await db.ref('tokens').once('value');
                                    const t = snapshot.val();
                                    var keys = Object.keys(t); //ids of the tokens
                                    var k;
                                    var id;
                                    var registrationToken;
                                    for (i = 0; i < keys.length; i++) {//also check the user status
                                        k = keys[i];
                                        id = t[k].uid;
                                        if (id == v[2]) {
                                            registrationToken = t[k].token;
                                            break;
                                        }
                                    }

                                    //define the title and body of the notification
                                    var payload = {
                                        notification: {
                                            title: 'There is a nearby user in need of charge',
                                            body: 'User: ' + v[1]
                                        }
                                    };

                                    //send the message using FCM to the specified token
									try{
                                    await admin.messaging().sendToDevice(registrationToken, payload)
                                        .then(function (response) {
                                            console.log("Successfully sent message:", response);
                                        })
                                        .catch(function (error) {
                                            console.log("Error sending message:", error);
                                        });
									}catch(e){
										//console.log("error caught");
										//console.log(e);
									}
                                    fs.writeFileSync('./cancelQueue.txt', '');

                                }

                            }

                            //delete files
                            fs.unlinkSync('./IOs/p' + msg.pid + '.txt');
                            fs.unlinkSync('./IOs/c' + msg.pid + '.txt');
                            fs.unlinkSync('./IOs/FinalFile' + msg.pid + '.txt');
                            fs.unlinkSync('./IOs/MP' + msg.pid + '.txt');

                            myResolve(); // when successful

                        });

                    }).on("error", (err) => {
                        console.log("Error: " + err.message);
                    });


                });

            }).on("error", (err) => {
                console.log("Error: " + err.message);
            });
        }
      
    });

});

// "Consuming Code" (Must wait for a fulfilled Promise)
myPromise.then(() => {
    process.send(result); //send done instead
}
);



