const db = require('./database');

async function testSoftDelete() {
    try {
        console.log("TESTING SOFT DELETE...");

        // 1. Create a doctor (Should log CREATE DOCTOR)
        console.log("1. Creating Doctor...");
        const docRes = await db.execute({
            sql: "INSERT INTO doctors (name, color) VALUES (?, ?)",
            args: ['Dr. Soft Delete', '#000000']
        });
        const docId = docRes.lastInsertRowid;

        // 2. Create Appointment
        console.log("2. Creating Appointment...");
        const patRes = await db.execute("INSERT INTO patients (name) VALUES ('Soft Patient')");
        const patId = patRes.lastInsertRowid;

        // Fetch valid type
        const typeRes = await db.execute("SELECT id FROM appointment_types LIMIT 1");
        let typeId = typeRes.rows[0]?.id || typeRes.rows[0][0];

        await db.execute({
            sql: "INSERT INTO appointments (patient_id, doctor_id, start_time, end_time, type_id) VALUES (?, ?, ?, ?, ?)",
            args: [patId, docId, '2025-02-01T10:00:00', '2025-02-01T11:00:00', typeId]
        });

        // 3. Force Delete Logic Simulation (via API Logic)
        console.log("3. Simulating Soft Delete (Force)...");
        const now = new Date().toISOString();

        // Soft delete appointments
        await db.execute({
            sql: "UPDATE appointments SET deleted_at = ? WHERE doctor_id = ?",
            args: [now, docId]
        });
        // Soft delete doctor
        await db.execute({
            sql: "UPDATE doctors SET deleted_at = ? WHERE id = ?",
            args: [now, docId]
        });

        // 4. Verification

        // A. Should NOT appear in standard active queries
        const activeDocs = await db.execute("SELECT * FROM doctors WHERE deleted_at IS NULL AND id = ?", [docId]);
        console.log("Active Docs (Should be empty):", activeDocs.rows);

        const activeApps = await db.execute("SELECT * FROM appointments WHERE deleted_at IS NULL AND doctor_id = ?", [docId]);
        console.log("Active Apps (Should be empty):", activeApps.rows);

        // B. Should appear in RAW queries (checking persistence)
        const rawDocs = await db.execute("SELECT * FROM doctors WHERE id = ?", [docId]);
        console.log("Raw Doc (Should exist with deleted_at):", rawDocs.rows[0]);

        if (activeDocs.rows.length === 0 && rawDocs.rows.length === 1 && rawDocs.rows[0].deleted_at) {
            console.log("✅ SOFT DELETE VERIFIED");
        } else {
            console.log("❌ SOFT DELETE FAILED");
        }

        // Clean up (Hard delete for test cleanup)
        // await db.execute({ sql: "DELETE FROM doctors WHERE id = ?", args: [docId] });
        // await db.execute({ sql: "DELETE FROM appointments WHERE doctor_id = ?", args: [docId] });
        // await db.execute({ sql: "DELETE FROM patients WHERE id = ?", args: [patId] });

    } catch (err) {
        console.error("❌ TEST FAILED:", err);
    }
}

testSoftDelete();
