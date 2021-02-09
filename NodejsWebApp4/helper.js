const fs = require('fs');

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
    //create file ID
   // console.log("helper: pid is " + msg.pid);
    const filename = "r" + msg.pid + ".txt";   //since the process id is unique, it will be part of the file name
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
    const long = 24.312099359348398;
    const lat = 54.61871417089011;
    const consumptionRate = car.avgConsumption;
    const contents = msg.uid+" "+long + " " + lat + " " + req.amount + " " + req.requester.maxDistance + " " + consumptionRate + "\n";  //requesters: id, latitude, longiture, needed Energy, maxDistance, consumptionRate
    //providers: id, latitude, longitude, unitprice, consumptionRate

    fs.writeFile('./IOs/'+filename, contents, function (err) {//write the contents on the txt located in IOs
        if (err) return console.log(err);
    });



    console.log("n is " + msg.n);
    const sum = calculate.calc(msg.n, 24.3);
    process.send(sum);
    //MP id, consumer id, provider id

    
});

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