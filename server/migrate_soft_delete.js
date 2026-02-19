const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_URL || `file:${path.join(__dirname, 'dental.db')}`;
const authToken = process.env.DB_TOKEN;

const client = createClient({
    url: dbPath,
    authToken: authToken,
});

async function migrate() {
    try {
        console.log("Migrating database for Soft Deletes...");

        // Add deleted_at to doctors
        try {
            await client.execute("ALTER TABLE doctors ADD COLUMN deleted_at TEXT DEFAULT NULL");
            console.log("Added deleted_at to doctors.");
        } catch (err) {
            if (err.message.includes('duplicate column')) {
                console.log("Column deleted_at already exists in doctors.");
            } else {
                console.error("Error altering doctors:", err);
            }
        }

        // Add deleted_at to appointments
        try {
            await client.execute("ALTER TABLE appointments ADD COLUMN deleted_at TEXT DEFAULT NULL");
            console.log("Added deleted_at to appointments.");
        } catch (err) {
            if (err.message.includes('duplicate column')) {
                console.log("Column deleted_at already exists in appointments.");
            } else {
                console.error("Error altering appointments:", err);
            }
        }

        console.log("Migration completed.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
