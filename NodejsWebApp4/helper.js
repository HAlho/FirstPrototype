const { Worker, parentPort, workerData } = require("worker_threads");

const n = workerData.n;

console.log("n is : " + n);

const result = test(n);

parentPort.postMessage(result);
parentPort.close();

function test(n) {
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
    console.log('computation done ' + num);
    return num;
}