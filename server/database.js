const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_URL || `file:${path.join(__dirname, 'dental.db')}`;
const authToken = process.env.DB_TOKEN; // Needed for Turso production

console.log(`Connecting to database at: ${dbPath}`);

const client = createClient({
    url: dbPath,
    authToken: authToken,
});

async function initDatabase() {
    try {
        // Patients Table
        await client.execute(`CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            birth_date TEXT,
            notes TEXT,
            tags TEXT
        )`);

        // Doctors/Resources Table
        await client.execute(`CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#3b82f6'
        )`);

        // Appointment Types Table
        await client.execute(`CREATE TABLE IF NOT EXISTS appointment_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            price REAL DEFAULT 0,
            color TEXT,
            follow_up_rule_days INTEGER
        )`);

        // Appointments Table
        await client.execute(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            type_id INTEGER,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id),
            FOREIGN KEY (type_id) REFERENCES appointment_types(id)
        )`);

        // Audit Logs Table
        await client.execute(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            entity TEXT NOT NULL,
            entity_id INTEGER,
            details TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        await seedData();
        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
}

async function seedData() {
    const rs = await client.execute("SELECT count(*) as count FROM appointment_types");
    const count = rs.rows[0].count || rs.rows[0][0]; // Handle different result formats

    if (count === 0) {
        console.log("Seeding appointment types...");
        const types = [
            { sql: "INSERT INTO appointment_types (name, duration_minutes, price, color, follow_up_rule_days) VALUES (?, ?, ?, ?, ?)", args: ['Limpieza General', 45, 50, '#34d399', 180] },
            { sql: "INSERT INTO appointment_types (name, duration_minutes, price, color, follow_up_rule_days) VALUES (?, ?, ?, ?, ?)", args: ['Consulta General', 30, 30, '#60a5fa', 0] },
            { sql: "INSERT INTO appointment_types (name, duration_minutes, price, color, follow_up_rule_days) VALUES (?, ?, ?, ?, ?)", args: ['Ortodoncia (Control)', 20, 40, '#f472b6', 30] },
            { sql: "INSERT INTO appointment_types (name, duration_minutes, price, color, follow_up_rule_days) VALUES (?, ?, ?, ?, ?)", args: ['Blanqueamiento', 60, 150, '#fbbf24', 365] }
        ];

        for (const t of types) {
            await client.execute(t);
        }
    }

    const rsDoc = await client.execute("SELECT count(*) as count FROM doctors");
    const countDoc = rsDoc.rows[0].count || rsDoc.rows[0][0];

    if (countDoc === 0) {
        console.log("Seeding doctors...");
        await client.execute({ sql: "INSERT INTO doctors (name, color) VALUES (?, ?)", args: ['Dr. Principal', '#818cf8'] });
    }
}

// Initialize on require (or call explicitly)
initDatabase();

module.exports = client;
