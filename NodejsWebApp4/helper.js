const fs = require('fs');

const https = require('https');

const { admin } = require('./routes/firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

const calculate = require('./build/Release/indexc');

const { Worker, parentPort, workerData } = require("worker_threads");

//const n = workerData.n; //take the variables from workerData in profile.js

//console.log("n is : " + n);

//const result = test(n);

//const result = calculate.calc(100);

//parentPort.postMessage(result); //send to the parent thread the result
//parentPort.close();

   

process.on('message', async (msg) => {
    var points = '';//save coords here for distnace matrix api
    //create file ID
   // console.log("helper: pid is " + msg.pid);
    var filename = "r" + msg.pid + ".txt";   //since the process id is unique, it will be part of the file name
    //get the requesters information from the database
    console.log("helper: id is " + msg.uid);
    var snapshot = await db.ref('users/' + msg.uid+'/activeRequest').once('value');
    var u = snapshot.val();
    snapshot = await db.ref('activeRequests/issued/' + u.id).once('value');
    var req = snapshot.val();
    //get the consumption rate of the car model used
    snapshot = await db.ref('carList/' + req.requester.car.brand +"/"+ req.requester.car.model).once('value');
    var car = snapshot.val();
    //fake location coords
    var long = 24.312099359348398;
    var lat = 54.61871417089011;
    var consumptionRate = car.avgConsumption;
    //requesters: id, latitude, longiture, needed Energy, maxDistance, consumptionRate
    var contents = msg.uid + " " + long + " " + lat + " " + req.amount + " " + req.requester.maxDistance + " " + consumptionRate + "\n"; 
    points = points.concat(long + '%2C' + lat +'&destinations=');
    fs.writeFile('./IOs/'+filename, contents, function (err) {//write the contents on the txt located in IOs
        if (err) return console.log(err);
    });

     //providers: id, latitude, longitude, unitprice, consumptionRate
    //get all the providers that have their status available
    long = 24.464952348134563;
    lat = 54.364803009584996;
    filename = "p" + msg.pid + ".txt";   //since the process id is unique, it will be part of the file name
    consumptionRate = 0.70;
    contents = "";
    snapshot = await db.ref('users').once('value');
    const users = snapshot.val();
    var keys = Object.keys(users); //ids of the tokens
    var availableUsers = [];
    var k;
    var first = true;
    //console.log("keys: " + keys);
    for (i = 0; i < keys.length; i++) {//also check the user status
        if (!first)
            points = points.concat('%7C');
        k = keys[i];
        //console.log("key: " + keys[i]);
        if (users[k].status != "Available") continue;
        //console.log("user pushed is: " + users[k]);
        availableUsers.push(users[k]);
        contents = contents.concat(k + " " + long + " " + lat + " " + users[k].unitPrice + " " + consumptionRate + "\n");
        points = points.concat(long + '%2C' + lat);
        first = false;

    }
    //console.log("helper: available users are: " + availableUsers);
    fs.writeFile('./IOs/' + filename, contents, function (err) {//write the contents on the txt located in IOs
        if (err) return console.log(err);
    });

    const key = '&key=AIzaSyAeScJ1dc_tF6kCU0_K7px8N86p9QQ9Djg';
    //%2C means , and %7C means |
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=' + points + key;
    console.log("helper: url is :" + url);

    
    

    console.log("n is " + msg.n);
    const sum = calculate.calc(msg.n, 24.3);
    fs.readFile('output.txt', "utf8", (err, data) => {
        if (err) throw err;
        //turn it into json structure

    });
    process.send(sum);
    //MP id, consumer id, provider id

    
});


async function distanceMatrix() {
    await https.get('https://www.google.ae/', (resp) => {
        let data = '';
        console.log("Helper: I am here!!!!!!");
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(JSON.parse(data).explanation);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

function test(n) {//O(n^10) algorithm
    var num=0;
    for (let a = 0; a < n; a++)
        for (let b = 0; b < n; b++)
            for (let c = 0; c < n; c++)
                for (let d = 0; d < n; d++)
                    for (let e = 0; e < n; e++)
                        for (let f = 0; f < n; f++)
                            for (let g = 0; g < n; g++)
                                for (let h = 0; h < n; h++)
                                    for (let i = 0; i < n; i++)
                                        for (let j = 0; j < n; j++)
                                            num++;
    console.log('Child: computation done ' + num);
    return num;
}