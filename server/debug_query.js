const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dental.db');

const range = 'week';
let daysToAdd = 7; // Default week
// Simulate the query logic
const query = `
    SELECT 
        strftime('%Y-%m-%d', a.start_time) as date, 
        d.name as doctor_name, 
        d.color as doctor_color, 
        COUNT(*) as count
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE 
        a.status != 'cancelled' AND 
        a.start_time >= date('now') AND 
        a.start_time <= date('now', '+${daysToAdd} days')
    GROUP BY date, d.id
    ORDER BY date ASC
`;

console.log("Query:", query);

db.all(query, [], (err, rows) => {
    if (err) throw err;
    console.log("Result rows:", rows);

    // Also check raw dates to compare
    db.all("SELECT start_time, date('now') as now, date('now', '+7 days') as next_week FROM appointments WHERE status != 'cancelled' LIMIT 10", [], (err, rawRequest) => {
        console.log("Raw Date Check:", rawRequest);
        db.close();
    });
});
