var pay = document.getElementById('pay');//<-------------------

var reqId = localStorage.getItem("reqid");

pay.addEventListener("click", async function () {//
    console.log("I am here");
    const p1 = { req: reqId };
    const poptions1 = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(p1)
    };
    const presponse1 = await fetch('/pay', poptions1);
    const pj1 = await presponse1.json();
    console.log(pj1.req);
    window.location = pj1.forwardLink;

});

