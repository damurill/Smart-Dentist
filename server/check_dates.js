const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dental.db');

db.all("SELECT start_time FROM appointments ORDER BY start_time", [], (err, rows) => {
    if (err) throw err;
    console.log("Total appointments:", rows.length);
    if (rows.length > 0) {
        console.log("Earliest:", rows[0].start_time);
        console.log("Latest:", rows[rows.length - 1].start_time);
        console.log("Sample (first 5):", rows.slice(0, 5));
    }
    db.close();
});
