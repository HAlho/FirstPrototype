const fs = require('fs');
const { fork } = require('child_process');
const { Worker, parentPort, workerData } = require("worker_threads");
const LineReaderSync = require('line-reader-sync');

const maxProc = 2;
var numProc=0;
var threadId;

const n = workerData.n; //take the variables from workerData in home.js / newRequest.js




parentPort.on('message', message => {
    threadId = message;
   // console.log("thread: threadid:" + threadId);

    const dataToAppend = threadId + "\n";

    //add threadId to list
    fs.appendFile('queue.txt', dataToAppend, function (err) {
        if (err) return console.log(err);
    });


    var isMyTurn = false;
    var slotAvailable = false;
    

    const interval = setInterval(() => {
        if (!isMyTurn) {
            //read first line
            const subInterval=setInterval(() => {
            
                var lrs = new LineReaderSync("queue.txt");
                var line = lrs.readline();
                console.log("Thread: line :" + line);
                    if (line == threadId) {      //if value matches threadId change turn to true
                        isMyTurn = true;
                        clearInterval(subInterval);
                    }


            }, 2000);//the time should depend on the algorithms speed
        } else {//if it is the thread's turn
            if (!slotAvailable) {
                //getFilledSlots (number of processes running)
                console.log("Thread: getFilledSlots start");
                var lrs = new LineReaderSync("procInfo.txt");
                var lines = lrs.toLines();
                numProc = lines.length;
                console.log("Thread: current processes count : " + numProc);
                if (numProc < maxProc) {
                    slotAvailable = true;
                    console.log("Thread: there is a slot available: numProc is " + numProc);
                }
                else numProc = 0;
               
                    
 
            }else {//was 30
                console.log("Thread: creating a child");
                //top stack
                fs.appendFile('procInfo.txt', "1\n", function (err) {//write the number of running proccesses to procInfo.txt
                    if (err) return console.log(err);
                });
                console.log("Thread: A child process will be created");
                const compute = fork('helper.js');
         
                compute.send({ n: 17, uid: workerData.uid, pid: compute.pid }); //send to the child process
                compute.on('message', sum => {//get the value from the child process
                    console.log("Thread: result is: " + sum);
                    compute.kill();
                    //pop stack
                    var newData;
                    fs.readFile('procInfo.txt', "utf8", (err, data) => {
                        if (err) throw err;
                        // break the textblock into an array of lines
                        var lines = data.split('\n');
                        // remove one line, starting at the first position
                        lines.splice(0, 1);
                        // join the array back into a single string
                        newData = lines.join('\n');
                       // console.log("new data is :" + newData);
                        fs.writeFile('procInfo.txt', newData, function (err) {
                            if (err) return console.log(err);
                            console.log('proc now:' + numProc);
                        });
                    });
                    parentPort.postMessage("done:)"); //send to the parent thread the result
                    parentPort.close();
                });
                fs.readFile('queue.txt', "utf8", (err, data) => {
                    if (err) throw err;
                    // break the textblock into an array of lines
                    var lines = data.split('\n');
                    // remove one line, starting at the first position
                    lines.splice(0, 1);
                    // join the array back into a single string
                   // newData = lines.join('\n');
                    console.log("new data is :" + newData);
                    fs.writeFile('queue.txt', newData, function (err) {
                        if (err) return console.log(err);
                    });
                });
                clearInterval(interval);//exit the interval

            }
        }
    }, 2000);
}); 

