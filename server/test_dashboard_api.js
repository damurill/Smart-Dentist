const http = require('http');

console.log("Testing API Stats...");
http.get('http://localhost:3000/api/stats', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
        console.log("Stats Response Code:", resp.statusCode);
        console.log("Stats Response Body:", data);
    });
}).on("error", (err) => {
    console.log("Stats Error: " + err.message);
});

console.log("Testing API History...");
http.get('http://localhost:3000/api/appointments/history', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
        console.log("History Response Code:", resp.statusCode);
        console.log("History Response Body:", data);
    });
}).on("error", (err) => {
    console.log("History Error: " + err.message);
});
