const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dental.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

db.all("SELECT * FROM doctors", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log(rows);
    db.close();
});
