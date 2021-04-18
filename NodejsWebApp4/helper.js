const fs = require('fs');

const https = require('https');

const { admin } = require('./routes/firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

const calculate = require('./build/Release/indexc');
const miniList = require('./build/Release/check');


const { Worker, parentPort, workerData } = require("worker_threads");
const { isUndefined } = require('util');

//const n = workerData.n; //take the variables from workerData in profile.js

//parentPort.postMessage(result); //send to the parent thread the result
//parentPort.close();

var sum;
var url;
const key = '&key=AIzaSyAeScJ1dc_tF6kCU0_K7px8N86p9QQ9Djg';
var pid;
var lat, long;
let myPromise = new Promise(function (myResolve, myReject) {
    process.on('message', async (msg) => {
        pid = msg.pid;
        var points = '';//save coords here for distnace matrix api
        //create file ID
        // console.log("helper: pid is " + msg.pid);
        var filename = "c" + msg.pid + ".txt";   //since the process id is unique, it will be part of the file name


        //get the requesters information from the database
        var snapshot = await db.ref('activeRequests/issued/').once('value');
        var req = snapshot.val();
        var keys = Object.keys(req);
        var contents = "";
        //for each consumer
        for (let k of keys) {
            console.log(req[k]);
            //get the consumption rate of the car model used

            snapshot = await db.ref('carList/' + req[k].requester.car.brand + "/" + req[k].requester.car.model).once('value');
            var car = snapshot.val();


            //location coords
            lat = 24.312099359348398;//fake location coords
            long = 54.61871417089011;
            snapshot = await db.ref('users/' + req[k].requester.uid + '/location').once('value');
            let location = snapshot.val();

            let consumptionRate = car.avgConsumption;
            //requesters: id, latitude, longiture, needed Energy, maxDistance, consumptionRate
            contents = contents.concat(req[k].requester.uid + " " + location.latitude + " " + location.longitude + " " + req[k].amount + " " + req[k].requester.maxDistance + " " + consumptionRate + "\n");
            points = points.concat(location.latitude + '%2C' + location.longitude + '%7C');


        }//loop end

        //fs.writeFile('./IOs/' + filename, contents, function (err) {//write the contents on the txt located in IOs
        //    if (err) return console.log(err);
        //});
        fs.writeFileSync('./IOs/' + filename, contents);

        points = points.concat('&destinations=');
        filename = './IOs/MPFile.txt';
        var data = fs.readFileSync(filename, "utf8");
        var lines = data.split('\r\n');
        first = true;
        for (let i of lines) {
            if (!first)
                points = points.concat('%7C');
            sindex = i.lastIndexOf(" ");//find the second's space index
            lat = i.substring(2, sindex);
            long = i.substring(sindex + 1, i.length);
            points = points.concat(lat + '%2C' + long);
            first = false;
        }


        url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=' + points + key;

        var cdata = '';
        //find the distance and duration between the consumer and meeting points only
        https.get(url, async (resp) => {
            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                cdata += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', async () => {
                filename = "c" + msg.pid + ".txt"; //SAVE IT IN c

                try {//try and catch for json.parse

                    let json = JSON.parse(cdata);

                    var newData;
                    var fdata = fs.readFileSync('./IOs/' + filename, "utf8");


                    var lines = fdata.split('\n');
                    for (var i = 0; i < json.rows.length; i++) {
                        var index = lines[i].lastIndexOf('\n'); //finds the \n that indicates the new line'
                        lines[i] = lines[i].substring(index + 1, lines[i].length);
                        for (let k of json.rows[i].elements) {//k is element[count]
                            lines[i] = lines[i].concat(" " + k.distance.value + " " + k.duration.value);
                        }
                    }

                    // join the array back into a single string
                    newData = lines.join('\n');
                    //fs.writeFile('./IOs/' + filename, newData, function (err) {
                    //    if (err) return console.log(err);
                    //});
                    fs.writeFileSync('./IOs/' + filename, newData);


                } catch (error) {
                    console.error(error.message);
                };

                //run the minimizing code
                miniList.check(msg.pid);

                //the consumer file will contain all 4 distances/durations

                //----------------------------------------------------------------------------------------------------------------------------

                //find the distance and duration between the provider and chosen meeting points
                points = '';

                //providers: id, latitude, longitude, unitprice, consumptionRate
                //get all the providers that have their status available
                lat = 24.464952348134563;//fake coords for provider
                long = 54.364803009584996;

                filename = "p" + pid + ".txt";   //since the process id is unique, it will be part of the file name
                contents = "";
                snapshot = await db.ref('users').once('value');
                const users = snapshot.val();
                var keys2 = Object.keys(users); //ids of the tokens
                var availableUsers = [];
                var k;
                var first = true;
                for (i = 0; i < keys2.length; i++) {//also check the user status  ADD that the provider does't have a request
                    if (!first)
                        points = points.concat('%7C');
                    k = keys2[i];
                    if (users[k].status != "Available") continue;
                    if (users[k].activeRequest != null) continue//check if the user has a request
                    if ((Date.now() - users[k].location.timestamp) > 900000) continue; //check if the location had passed 15 mins
                    if (users[k].cars != null) {
                        var keys3 = Object.keys(users[k].cars); //ids of the tokens

                        for (j = 0; j < keys3.length; j++) {
                            if (keys3[j] == users[k].currentCar) {
                                snapshot = await db.ref('carList/' + users[k].cars[keys3[j]].brand + "/" + users[k].cars[keys3[j]].model).once('value');
                                let car = snapshot.val();

                                availableUsers.push(users[k]);
                                contents = contents.concat(k + " " + users[k].location.latitude + " " + users[k].location.longitude + " " + users[k].unitPrice + " " + car.avgConsumption + "\n");
                                points = points.concat(users[k].location.latitude + '%2C' + users[k].location.longitude);
                                first = false;
                            }
                        }

                    }

                }

                //fs.writeFile('./IOs/' + filename, contents, function (err) {//write the contents on the txt located in IOs
                //    if (err) return console.log(err);
                //});
                fs.writeFileSync('./IOs/' + filename, contents);


                points = points.concat('&destinations=');
                filename = './IOs/MP' + pid + '.txt';//file does not contain the coords only the number
                var data1 = fs.readFileSync(filename, "utf8");//read the new mp file
                var meetingIds = data1.split("\n");
                var mId;
                var countmId = 0; //also used to know the number of chosen meeting points
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
                    if (mId.trim() != meetingIds[countmId].trim()) continue;
                    //console.log("this will be saved");
                    countmId++;
                    lat = i.substring(2, sindex);
                    long = i.substring(sindex + 1, i.length);
                    points = points.concat(lat + '%2C' + long);
                    first = false;
                }

                //%2C means , and %7C means |
                url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=' + points + key;

                // console.log("helper: url is :" + url);

                https.get(url, (resp) => {
                    let data = '';
                    // A chunk of data has been received.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on('end', async () => {
                        filename = "p" + pid + ".txt"; //SAVE IT IN p
                        try {//try and catch for json.parse

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
                                console.log("helper: totalMeetingPoints: " + totalMeetingPoints);
                                console.log("helper: countmId: " + countmId);
                                for (var j = countmId; j < totalMeetingPoints; j++)
                                    lines[i] = lines[i].concat(" -1 -1");
                            }

                            // join the array back into a single string
                            newData = lines.join('\n');
                            //fs.writeFile('./IOs/' + filename, newData, function (err) {
                            //    if (err) return console.log(err);
                            //});
                            fs.writeFileSync('./IOs/' + filename, newData);



                        } catch (error) {
                            console.error(error.message);
                        };
                        sum = calculate.calc(15, 24.3, pid);
                        //send the results to database
                        filename = "FinalFile" + pid + ".txt";
                        fdata = fs.readFileSync('./IOs/' + filename, "utf8");
                        var lines2 = fdata.split('\r\n');
                        for (let a of lines2) {
                            if (a == '') continue;
                            //let w1 = a.lastIndexOf(" ");
                            //let p = a.substring(w1 + 1, a.length-1) //start is included end is not included
                            let v = a.split(" ");
                            console.log("results are " + v[0] + " " + v[1] + " " + v[2] + " " + v[3]);
                            snapshot = await db.ref('users/' + v[1] + '/activeRequest').once('value');
                            var users1 = snapshot.val();
                            db.ref('activeRequests/issued/' + users1.id + "/match/").set({
                                provider: v[2],
                                location: v[0],
                                estAmount: v[3],
                                matchMadeAt: Date.now()
                            });

                            //move request to matched
                            let oldRef = db.ref('activeRequests/issued/' + users1.id);
                            let newRef = db.ref('activeRequests/matched/' + users1.id);
                            snapshot = await oldRef.once('value');
                            await newRef.set(snapshot.val());
                            await oldRef.remove();

                            //change requester's reference status to matched
                            await db.ref('users/' + v[1]).child('activeRequest').update({ dbref: "matched" });

                            //change provider status to matched
                            await db.ref('users/' + v[2]).update({ status: "matched" });
                            await db.ref('users/' + v[2]).update({ matchedReq: users1.id });

                            //find the tokens
                            snapshot = await db.ref('tokens').once('value');
                            const t = snapshot.val();
                            var keys = Object.keys(t); //ids of the tokens
                            var k;
                            var id;
                            var registrationToken;
                            //console.log("keys: " + keys);
                            for (i = 0; i < keys.length; i++) {//also check the user status
                                k = keys[i];
                                //console.log("key: " + keys[i]);
                                id = t[k].uid;
                                if (id == v[2]) {
                                    registrationToken = t[k].token;
                                    break;
                                }
                            }

                            var payload = {
                                notification: {
                                    title: 'There is a nearby user in need of charge',
                                    body: 'User: ' + v[1]
                                }
                            };


                            await admin.messaging().sendToDevice(registrationToken, payload)
                                .then(function (response) {
                                    console.log("Successfully sent message:", response);
                                })
                                .catch(function (error) {
                                    console.log("Error sending message:", error);
                                });



                        }
                        if (!isUndefined(sum))//that the algorithm is done
                            myResolve(); // when successful

                    });

                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });


            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });


        //-------------------------------------------------------------------------------------------------------------



    });

    //myReject();  // when error
});

// "Consuming Code" (Must wait for a fulfilled Promise)
myPromise.then(
    function (value) {
        process.send(sum);
    },
    //function (error) { /* code if some error */ }
);





//function test(n) {//O(n^10) algorithm
//    var num=0;
//    for (let a = 0; a < n; a++)
//        for (let b = 0; b < n; b++)
//            for (let c = 0; c < n; c++)
//                for (let d = 0; d < n; d++)
//                    for (let e = 0; e < n; e++)
//                        for (let f = 0; f < n; f++)
//                            for (let g = 0; g < n; g++)
//                                for (let h = 0; h < n; h++)
//                                    for (let i = 0; i < n; i++)
//                                        for (let j = 0; j < n; j++)
//                                            num++;
//    console.log('Child: computation done ' + num);
//    return num;
//}