const express = require('express');
const cors = require('cors');
const path = require('path');
const { client: db, initDatabase } = require('./database'); // Destructure client as db
require('dotenv').config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('./middleware/auth');

// --- HELPER FUNCTIONS ---
const logAction = async (action, entity, entity_id, details) => {
    try {
        await db.execute({
            sql: "INSERT INTO audit_logs (action, entity, entity_id, details) VALUES (?, ?, ?, ?)",
            args: [action, entity, entity_id, details]
        });
    } catch (err) {
        console.error("Failed to log action:", err);
    }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow resources to be loaded
app.use(cors());
app.use(express.json());

// Rate Limiting (Brute Force Protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter); // Apply to all API routes

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- HEALTH CHECK ROUTE ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const APP_PASSWORD = process.env.VITE_APP_PASSWORD || 'Smart2026';

    if (password === APP_PASSWORD) {
        // Generate Token
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Contraseña incorrecta' });
    }
});

// Protect all API routes except login
// NOTE: We apply auth middleware to specific routes or globally below login
// For simplicity in this structure, we'll wrap critical routes or apply globally after public ones if any.
// Let's apply it to all /api routes except login, but since login is already defined above, we can apply it now for subsequent routes.
// However, waiting to confirm if there are public routes. Assuming all /api/ needs protection for now.

app.use('/api', (req, res, next) => {
    // Public Routes
    if (req.path === '/login') return next();

    // Allow Patient Portal access (GET appointment details, PATCH status)
    // Regex for /appointments/:id and /appointments/:id/status
    if (req.method === 'GET' && req.path.match(/^\/appointments\/\d+$/)) return next();
    if (req.method === 'PATCH' && req.path.match(/^\/appointments\/\d+\/status$/)) return next();

    authenticateToken(req, res, next);
});

// --- ROUTES ---

// Helper function to handle database errors
const handleDbError = (res, err) => {
    console.error("Database Error:", err);
    res.status(500).json({ error: err.message });
};

// 7. AUDIT LOGS
app.get('/api/audit_logs', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100");
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

// 1. PATIENTS
app.get('/api/patients', async (req, res) => {
    const { search } = req.query;
    let query = "SELECT * FROM patients";
    let args = [];

    // Filter soft deleted? User didn't ask for patients, but good practice if we added column.
    // For now, sticking to Doctors/Appointments as requested.

    if (search) {
        query += " WHERE (name LIKE ? OR phone LIKE ?)";
        args = [`%${search}%`, `%${search}%`];
    }
    query += " ORDER BY name ASC";

    try {
        const result = await db.execute({ sql: query, args });
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.post('/api/patients', async (req, res) => {
    const { name, phone, email, notes } = req.body;
    const sql = "INSERT INTO patients (name, phone, email, notes) VALUES (?, ?, ?, ?)";

    try {
        const result = await db.execute({ sql, args: [name, phone, email, notes] });
        const id = parseInt(result.lastInsertRowid);
        await logAction('CREATE', 'PATIENT', id, `Created patient: ${name}`);
        res.json({ id, name, phone, email, notes });
    } catch (err) {
        handleDbError(res, err);
    }
});

app.put('/api/patients/:id', async (req, res) => {
    const { name, phone, email, notes } = req.body;
    const sql = "UPDATE patients SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?";

    try {
        const result = await db.execute({ sql, args: [name, phone, email, notes, req.params.id] });
        await logAction('UPDATE', 'PATIENT', req.params.id, `Updated patient: ${name}`);
        res.json({ message: "Patient updated", changes: result.rowsAffected });
    } catch (err) {
        handleDbError(res, err);
    }
});

app.delete('/api/patients/:id', async (req, res) => {
    try {
        const result = await db.execute({ sql: "DELETE FROM patients WHERE id = ?", args: [req.params.id] });
        await logAction('DELETE', 'PATIENT', req.params.id, "Deleted patient");
        res.json({ message: "Patient deleted", changes: result.rowsAffected });
    } catch (err) {
        handleDbError(res, err);
    }
});

// 2. APPOINTMENTS
app.get('/api/appointments', async (req, res) => {
    const { date, start_date, end_date } = req.query;
    let query = `
        SELECT a.*, p.name as patient_name, p.phone as patient_phone, d.name as doctor_name, d.color as doctor_color, 
               t.name as type_name, t.color as type_color, t.follow_up_rule_days
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN appointment_types t ON a.type_id = t.id
        WHERE a.deleted_at IS NULL
    `;

    let args = [];
    if (start_date && end_date) {
        query += " AND a.start_time BETWEEN ? AND ?";
        args.push(start_date, end_date);
    } else if (date) {
        query += " AND a.start_time BETWEEN ? AND ?";
        args.push(`${date}T00:00:00`, `${date}T23:59:59`);
    }

    query += " ORDER BY a.start_time ASC";

    try {
        const result = await db.execute({ sql: query, args });
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.post('/api/appointments', async (req, res) => {
    const { patient_id, doctor_id, start_time, end_time, type_id, notes } = req.body;

    if (!patient_id || !start_time || !end_time || !type_id) {
        return res.status(400).json({ error: "Missing required fields: patient_id, start_time, end_time, type_id" });
    }

    const sql = `INSERT INTO appointments (patient_id, doctor_id, start_time, end_time, type_id, notes) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    try {
        const result = await db.execute({ sql, args: [patient_id, doctor_id, start_time, end_time, type_id, notes] });
        const id = parseInt(result.lastInsertRowid);
        await logAction('CREATE', 'APPOINTMENT', id, `Scheduled appointment for patient ID ${patient_id} with doctor ID ${doctor_id}`);
        res.json({ id, ...req.body });
    } catch (err) {
        handleDbError(res, err);
    }
});

// 6. HISTORY & CHARTS
app.get('/api/appointments/history', async (req, res) => {
    const { doctor_id, range = 'week' } = req.query;
    const doctorFilter = doctor_id ? ` AND a.doctor_id = ${doctor_id}` : "";

    let daysToAdd = 7;
    if (range === 'month') daysToAdd = 30;
    if (range === '3months') daysToAdd = 90;
    if (range === '6months') daysToAdd = 180;

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
            a.deleted_at IS NULL AND
            a.start_time >= ? AND 
            a.start_time <= ?
            ${doctorFilter}
        GROUP BY date, d.id
        ORDER BY date ASC
    `;

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        const result = await db.execute({ sql: query, args: [today, endDate] });
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.get('/api/appointments/:id', async (req, res) => {
    const query = `
        SELECT a.*, p.name as patient_name, d.name as doctor_name, t.name as type_name, t.duration_minutes
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN appointment_types t ON a.type_id = t.id
        LEFT JOIN appointment_types t ON a.type_id = t.id
        WHERE a.id = ? AND a.deleted_at IS NULL
    `;
    try {
        const result = await db.execute({ sql: query, args: [req.params.id] });
        if (result.rows.length === 0) return res.status(404).json({ error: "Appointment not found" });
        res.json(result.rows[0]);
    } catch (err) {
        handleDbError(res, err);
    }
});

// 3. DOCTORS
app.get('/api/doctors', async (req, res) => {
    try {
        const query = `
            SELECT d.*, COUNT(a.id) as pending_appointments_count
            FROM doctors d
            LEFT JOIN appointments a ON d.id = a.doctor_id AND a.status != 'cancelled' AND a.deleted_at IS NULL AND a.start_time >= date('now')
            WHERE d.deleted_at IS NULL
            GROUP BY d.id
        `;
        const result = await db.execute(query);
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.post('/api/doctors', async (req, res) => {
    const { name, color, phone } = req.body;
    try {
        const result = await db.execute({
            sql: "INSERT INTO doctors (name, color, phone) VALUES (?, ?, ?)",
            args: [name, color, phone || null]
        });
        const id = parseInt(result.lastInsertRowid);
        await logAction('CREATE', 'DOCTOR', id, `Added doctor: ${name}`);
        res.json({ id, name, color, phone });
    } catch (err) {
        handleDbError(res, err);
    }
});

app.put('/api/doctors/:id', async (req, res) => {
    const { name, color, phone } = req.body;
    try {
        await db.execute({
            sql: "UPDATE doctors SET name = ?, color = ?, phone = ? WHERE id = ?",
            args: [name, color, phone || null, req.params.id]
        });
        await logAction('UPDATE', 'DOCTOR', req.params.id, `Updated doctor: ${name}`);
        res.json({ message: "Doctor updated" });
    } catch (err) {
        handleDbError(res, err);
    }
});

app.delete('/api/doctors/:id', async (req, res) => {
    const { force } = req.query;
    const id = req.params.id;
    const now = new Date().toISOString();

    try {
        // Check for active appointments
        // Only count appointments that are NOT already soft-deleted
        const checkRes = await db.execute({
            sql: "SELECT count(*) as count FROM appointments WHERE doctor_id = ? AND deleted_at IS NULL",
            args: [id]
        });
        const appointmentCount = checkRes.rows[0].count;

        if (force === 'true') {
            // Soft delete appointments
            await db.execute({
                sql: "UPDATE appointments SET deleted_at = ? WHERE doctor_id = ?",
                args: [now, id]
            });
            // Soft delete doctor
            await db.execute({
                sql: "UPDATE doctors SET deleted_at = ? WHERE id = ?",
                args: [now, id]
            });
            await logAction('DELETE', 'DOCTOR', id, "Soft deleted doctor and all assigned appointments (FORCE)");
            res.json({ message: "Doctor and appointments soft deleted" });

        } else {
            if (appointmentCount > 0) {
                return res.status(400).json({ error: "No se puede eliminar el doctor porque tiene citas asignadas." });
            }

            // Soft delete doctor
            await db.execute({
                sql: "UPDATE doctors SET deleted_at = ? WHERE id = ?",
                args: [now, id]
            });
            await logAction('DELETE', 'DOCTOR', id, "Soft deleted doctor");
            res.json({ message: "Doctor soft deleted" });
        }
    } catch (err) {
        handleDbError(res, err);
    }
});

// 4. APPOINTMENT TYPES
app.get('/api/appointment_types', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM appointment_types");
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.post('/api/appointment_types', async (req, res) => {
    const { name, duration_minutes, price, color, follow_up_rule_days } = req.body;
    try {
        const result = await db.execute({
            sql: "INSERT INTO appointment_types (name, duration_minutes, price, color, follow_up_rule_days) VALUES (?, ?, ?, ?, ?)",
            args: [name, duration_minutes, price, color, follow_up_rule_days]
        });
        await logAction('CREATE', 'TREATMENT', parseInt(result.lastInsertRowid), `Created treatment type: ${name}`);
        res.json({ id: parseInt(result.lastInsertRowid), ...req.body });
    } catch (err) {
        handleDbError(res, err);
    }
});

app.put('/api/appointment_types/:id', async (req, res) => {
    const { name, duration_minutes, price, color, follow_up_rule_days } = req.body;
    try {
        await db.execute({
            sql: "UPDATE appointment_types SET name = ?, duration_minutes = ?, price = ?, color = ?, follow_up_rule_days = ? WHERE id = ?",
            args: [name, duration_minutes, price, color, follow_up_rule_days, req.params.id]
        });
        await logAction('UPDATE', 'TREATMENT', req.params.id, `Updated treatment type: ${name}`);
        res.json({ message: "Type updated" });
    } catch (err) {
        handleDbError(res, err);
    }
});

app.delete('/api/appointment_types/:id', async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM appointment_types WHERE id = ?", args: [req.params.id] });
        await logAction('DELETE', 'TREATMENT', req.params.id, "Deleted treatment type");
        res.json({ message: "Type deleted" });
    } catch (err) {
        handleDbError(res, err);
    }
});

// Update Appointment Status
app.patch('/api/appointments/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.execute({ sql: "UPDATE appointments SET status = ? WHERE id = ?", args: [status, req.params.id] });
        await logAction('UPDATE', 'APPOINTMENT', req.params.id, `Changed status to ${status}`);
        res.json({ message: "Status updated" });
    } catch (err) {
        handleDbError(res, err);
    }
});

// 5. STATS & ANALYTICS
app.get('/api/stats', async (req, res) => {
    const { doctor_id, range = 'week' } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let daysToAdd = 7;
    if (range === 'month') daysToAdd = 30;
    if (range === '3months') daysToAdd = 90;
    if (range === '6months') daysToAdd = 180;

    const endDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const doctorFilter = doctor_id ? ` AND doctor_id = ${doctor_id}` : "";
    const doctorFilterAlias = doctor_id ? ` AND a.doctor_id = ${doctor_id}` : "";

    const queries = {
        total_patients: "SELECT COUNT(*) as count FROM patients",
        appointments_today: `SELECT COUNT(*) as count FROM appointments WHERE start_time >= '${today}' AND start_time <= '${endDate}' AND status != 'cancelled' ${doctorFilter}`,
        cancelled_appointments: `SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled' ${doctorFilter}`,
        top_treatments: `
            SELECT t.name, COUNT(a.id) as count 
            FROM appointments a 
            JOIN appointment_types t ON a.type_id = t.id 
            WHERE a.status != 'cancelled' ${doctorFilterAlias}
            AND a.start_time >= '${today}' AND a.start_time <= '${endDate}'
            GROUP BY t.name 
            ORDER BY count DESC 
            LIMIT 3
        `
    };

    // Calculate dates for reminders (Tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Queries for widgets
    const pendingQuery = `
        SELECT a.id, a.start_time, p.name as patient_name, p.phone as patient_phone, t.name as type_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN appointment_types t ON a.type_id = t.id
        WHERE a.status = 'pending' 
        AND a.start_time >= '${today}'
        AND a.deleted_at IS NULL
        ${doctorFilterAlias}
        ORDER BY a.start_time ASC
        LIMIT 10
    `;

    const remindersQuery = `
        SELECT a.id, a.start_time, p.name as patient_name, p.phone as patient_phone, t.name as type_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN appointment_types t ON a.type_id = t.id
        WHERE date(a.start_time) = '${tomorrowStr}'
        AND a.status != 'cancelled'
        AND a.deleted_at IS NULL
        ${doctorFilterAlias}
        ORDER BY a.start_time ASC
        LIMIT 10
    `;

    const stats = {
        whatsapp_response_time: "12 min"
    };

    try {
        // Run queries in parallel
        const [totalPatientsRes, appointmentsTodayRes, cancelledRes, topTreatmentsRes, pendingRes, remindersRes] = await Promise.all([
            db.execute(queries.total_patients),
            db.execute(queries.appointments_today),
            db.execute(queries.cancelled_appointments),
            db.execute(queries.top_treatments),
            db.execute(pendingQuery),
            db.execute(remindersQuery)
        ]);

        stats.total_patients = totalPatientsRes.rows[0].count;
        stats.appointments_today = appointmentsTodayRes.rows[0].count;
        stats.cancelled_appointments = cancelledRes.rows[0].count;
        stats.top_treatments = topTreatmentsRes.rows;
        stats.pending_confirmations = pendingRes.rows;
        stats.upcoming_reminders = remindersRes.rows;

        // Fetch detailed list (existing logic)
        const appointmentsQuery = `
            SELECT a.id, a.start_time, p.name as patient_name, d.name as doctor_name, d.color as doctor_color, t.name as type_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN appointment_types t ON a.type_id = t.id
            WHERE a.start_time >= ? AND a.start_time <= ? AND a.status != 'cancelled' ${doctorFilterAlias}
            ORDER BY a.start_time ASC
            LIMIT 50
        `;

        const listRes = await db.execute({ sql: appointmentsQuery, args: [today, endDate] });
        stats.appointments_list = listRes.rows;

        res.json(stats);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.get('/api/patients/:id/history', async (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT a.*, t.name as type_name, d.name as doctor_name 
        FROM appointments a
        LEFT JOIN appointment_types t ON a.type_id = t.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = ?
        ORDER BY a.start_time DESC
    `;

    try {
        const result = await db.execute({ sql: query, args: [id] });
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

app.get('/api/appointments_filter', async (req, res) => {
    const { date, doctor_id } = req.query;
    let query = `
        SELECT a.id, a.start_time, p.name as patient_name, d.name as doctor_name, t.name as type_name, a.status, a.notes
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN appointment_types t ON a.type_id = t.id
        WHERE 1=1
    `;
    const args = [];

    if (date) {
        query += " AND strftime('%Y-%m-%d', a.start_time) = ?";
        args.push(date);
    }
    if (doctor_id) {
        query += " AND a.doctor_id = ?";
        args.push(doctor_id);
    }

    query += " ORDER BY a.start_time ASC";

    try {
        const result = await db.execute({ sql: query, args });
        res.json(result.rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

// Catch-all handler for any request that doesn't match the API
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Initialize DB then start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});
