const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { addDays, format } = require('date-fns');

const dbPath = path.resolve(__dirname, 'dental.db');
const db = new sqlite3.Database(dbPath);

const patients = [
    { name: 'Juan Pérez', phone: '5551234567', email: 'juan@example.com', notes: 'Alergia a la penicilina' },
    { name: 'María Garcia', phone: '5559876543', email: 'maria@example.com', notes: 'Prefiere tardes' },
    { name: 'Carlos López', phone: '5551112233', email: 'carlos@example.com', notes: '' },
    { name: 'Ana Torres', phone: '5554445566', email: 'ana@example.com', notes: 'Tratamiento de ortodoncia activo' },
    { name: 'Luis Rodríguez', phone: '5557778899', email: 'luis@example.com', notes: '' }
];

db.serialize(() => {
    console.log("Seeding Patients...");
    const stmt = db.prepare("INSERT INTO patients (name, phone, email, notes) VALUES (?, ?, ?, ?)");
    patients.forEach(p => stmt.run(p.name, p.phone, p.email, p.notes));
    stmt.finalize();

    console.log("Seeding Appointments...");
    // Get IDs to link
    db.all("SELECT id FROM patients", (err, patientRows) => {
        db.all("SELECT id FROM doctors", (err, doctorRows) => {
            db.all("SELECT id, duration_minutes FROM appointment_types", (err, typeRows) => {

                if (patientRows.length === 0 || doctorRows.length === 0 || typeRows.length === 0) {
                    console.log("Missing base data. Skipping appointments.");
                    return;
                }

                const today = new Date();
                const appointments = [];

                // Create some appointments for today and next few days
                for (let i = 0; i < 15; i++) { // Increased to 15 for better stats
                    const patient = patientRows[i % patientRows.length];
                    const doctor = doctorRows[0];
                    const type = typeRows[i % typeRows.length];

                    const date = addDays(today, (i % 5) - 1); // Spread over 5 days, starting yesterday
                    date.setHours(9 + (i % 8), 0, 0, 0);

                    const startStr = date.toISOString();
                    const endStr = new Date(date.getTime() + type.duration_minutes * 60000).toISOString();

                    // Random status
                    const statuses = ['confirmed', 'confirmed', 'pending', 'cancelled'];
                    const status = statuses[i % statuses.length];

                    appointments.push({
                        patient_id: patient.id,
                        doctor_id: doctor.id,
                        type_id: type.id,
                        start_time: startStr,
                        end_time: endStr,
                        status: status,
                        notes: 'Cita de prueba generada automáticamente'
                    });
                }

                const aptStmt = db.prepare("INSERT INTO appointments (patient_id, doctor_id, type_id, start_time, end_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
                appointments.forEach(a => aptStmt.run(a.patient_id, a.doctor_id, a.type_id, a.start_time, a.end_time, a.status, a.notes));
                aptStmt.finalize(() => {
                    console.log("Seeding Complete!");
                });
            });
        });
    });
});
