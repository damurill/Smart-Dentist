const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dental.db');

db.serialize(() => {
    db.run("ALTER TABLE appointment_types ADD COLUMN price REAL DEFAULT 0", (err) => {
        if (err) {
            console.log("Column 'price' might already exist or error:", err.message);
        } else {
            console.log("Column 'price' added successfully.");
        }
    });
});

db.close();
