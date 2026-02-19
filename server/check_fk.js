const db = require('./database');

async function checkFK() {
    try {
        console.log("Checking Foreign Key Enforcement...");

        // 1. Create a temp doctor
        const docRes = await db.execute({
            sql: "INSERT INTO doctors (name, color) VALUES (?, ?)",
            args: ['Temp Doc FK Test', '#000000']
        });
        const docId = docRes.lastInsertRowid;
        console.log(`Created temp doctor ID: ${docId}`);

        // 2. Create a temp patient (needed for appointment)
        const patRes = await db.execute({
            sql: "INSERT INTO patients (name) VALUES (?)",
            args: ['Temp Patient FK Test']
        });
        const patId = patRes.lastInsertRowid;

        // 3. Create a temp appointment
        // We need a valid type_id too, let's assume 1 exists or fetch one
        const typeRes = await db.execute("SELECT id FROM appointment_types LIMIT 1");
        const typeId = typeRes.rows[0].id;

        await db.execute({
            sql: "INSERT INTO appointments (patient_id, doctor_id, start_time, end_time, type_id) VALUES (?, ?, ?, ?, ?)",
            args: [patId, docId, '2025-01-01T10:00:00', '2025-01-01T11:00:00', typeId]
        });
        console.log("Created temp appointment linked to doctor.");

        // 4. Try to delete the doctor
        console.log("Attempting to delete doctor...");
        try {
            await db.execute({
                sql: "DELETE FROM doctors WHERE id = ?",
                args: [docId]
            });
            console.log("❌ DELETE SUCCESSFUL (Bad! FKs are NOT enforced!)");
        } catch (err) {
            console.log("✅ DELETE FAILED (Good! FKs are enforced)");
            console.log("Error:", err.message);
            console.log("Code:", err.code);
        }

        // Cleanup
        console.log("Cleaning up...");
        await db.execute({ sql: "DELETE FROM appointments WHERE doctor_id = ?", args: [docId] });
        await db.execute({ sql: "DELETE FROM doctors WHERE id = ?", args: [docId] });
        await db.execute({ sql: "DELETE FROM patients WHERE id = ?", args: [patId] });

    } catch (err) {
        console.error("Test script error:", err);
    }
}

checkFK();
