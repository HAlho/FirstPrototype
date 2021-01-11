const http = require('http');
const { Worker, isMainThread, parentPort } = require('worker_threads')
const LIMIT = 4000000000;
const PORT = 5000;

if (isMainThread) {
    console.log('Hey im the main thread');
    const server = http.createServer((req, res) => {
        console.log('Received request');
        res.end(`Done ${+ new Date()}`);
    });

    const worker = new Worker(__filename, {});
    worker.on('message', msg => {
        console.log(msg);
        worker.terminate();
    })

    server.listen(PORT);
    console.log(`started server at ${PORT}`);
} //else {
//  console.log('Hey im in the worker thread!')
if (!isMainThread) {
    setInterval(() => {
        let i = 0;
        while (i < LIMIT) {
            i++;
        }
        console.log('computation done');
        parentPort.postMessage({ foo: 'bar' });
    }
    );
}
//}
