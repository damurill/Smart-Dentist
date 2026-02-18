const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dental.db');

db.serialize(() => {
    db.all("SELECT id, start_time, status FROM appointments ORDER BY start_time DESC LIMIT 10", (err, rows) => {
        if (err) console.error(err);
        console.log("Recent appointments:", rows);
    });

    // Check today's date
    console.log("Current server date:", new Date().toISOString());
});

db.close();
