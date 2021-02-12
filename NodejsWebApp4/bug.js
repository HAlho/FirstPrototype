const fs = require('fs');
var points = '';
points = points.concat('&destinations=');
//console.log("points is now: " + points);
var data = fs.readFileSync('./IOs/MPFile.txt', "utf8");
var lines = data.split('\r\n');//\r\n for Windows(CRLF)
var first = true;
var sindex;
console.log(lines);
for (let i of lines) {
    if (!first)
        points = points.concat('%7C');
    sindex = i.lastIndexOf(" ");//find the second's space index
    long = i.substring(2, sindex);
    lat = i.substring(sindex + 1, i.length);
    points = points.concat(long + '%2C' + lat);
  //  console.log("points is now: " + points);
    first = false;
}
console.log("poyints are " + points);
      