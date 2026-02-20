const BASE_URL = 'http://localhost:3000/api';
let token = '';
let patientId = '';
let doctorId = '';
let typeId = '';
let appointmentId = '';

const request = async (url, method, body, authToken) => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(url, options);
    const text = await res.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error(`\nRequest Failed: ${method} ${url}`);
        console.error(`Status: ${res.status} ${res.statusText}`);
        console.error("Response Body (First 500 chars):", text.substring(0, 500));
        throw new Error("Invalid JSON response");
    }

    if (!res.ok) {
        throw new Error(JSON.stringify(data));
    }
    return data;
};

const runTest = async () => {
    try {
        console.log("Starting QA Test (Fetch Version)...");

        // 1. LOGIN
        console.log("1. Testing Login...");
        try {
            const loginRes = await request(`${BASE_URL}/login`, 'POST', { password: 'Smart2026' });
            token = loginRes.token;
            console.log("   Login Successful. Token received.");
        } catch (e) {
            console.error("   Login Failed:", e.message);
            process.exit(1);
        }

        // 2. CREATE PATIENT
        console.log("2. Testing Create Patient...");
        const patientData = {
            name: "QA Test Patient",
            phone: "88888888",
            email: "qa@test.com",
            province: "San José",
            district: "San José",
            notes: "Created by QA Script"
        };
        const patRes = await request(`${BASE_URL}/patients`, 'POST', patientData, token);
        patientId = patRes.id;
        console.log(`   Patient Created. ID: ${patientId}`);

        // 3. CREATE DOCTOR
        console.log("3. Testing Create Doctor...");
        const docRes = await request(`${BASE_URL}/doctors`, 'POST', {
            name: "Dr. QA",
            color: "#000000",
            province: "Heredia",
            district: "Heredia"
        }, token);
        doctorId = docRes.id;
        console.log(`   Doctor Created. ID: ${doctorId}`);

        // 4. CREATE APPOINTMENT TYPE
        console.log("4. Testing Create Treatment...");
        const typeRes = await request(`${BASE_URL}/appointment_types`, 'POST', {
            name: "QA Treatment",
            duration_minutes: 30,
            price: 100,
            color: "#FF0000",
            follow_up_rule_days: 0
        }, token);
        typeId = typeRes.id;
        console.log(`   Treatment Created. ID: ${typeId}`);

        // 5. CREATE APPOINTMENT
        console.log("5. Testing Create Appointment...");
        const apptDate = new Date();
        apptDate.setHours(apptDate.getHours() + 24); // Tomorrow
        const startTime = apptDate.toISOString();
        const endTime = new Date(apptDate.getTime() + 30 * 60000).toISOString();

        const apptRes = await request(`${BASE_URL}/appointments`, 'POST', {
            patient_id: patientId,
            doctor_id: doctorId,
            type_id: typeId,
            start_time: startTime,
            end_time: endTime,
            notes: "QA Appointment"
        }, token);
        appointmentId = apptRes.id;
        console.log(`   Appointment Created. ID: ${appointmentId}`);

        // 6. VERIFY DASHBOARD STATS
        console.log("6. Testing Dashboard Stats...");
        const statsRes = await request(`${BASE_URL}/stats?range=week`, 'GET', null, token);
        if (statsRes.total_patients > 0 && statsRes.upcoming_reminders) {
            console.log("   Stats retrieved successfully.");
        } else {
            console.warn("   Stats retrieval empty or unexpected format.");
        }

        // 7. CLEANUP
        console.log("7. Cleaning up (Deleting data)...");
        await request(`${BASE_URL}/appointments/${appointmentId}/status`, 'PATCH', { status: 'cancelled' }, token);
        // Using soft delete endpoints effectively
        await request(`${BASE_URL}/patients/${patientId}`, 'DELETE', null, token);
        await request(`${BASE_URL}/doctors/${doctorId}`, 'DELETE', null, token);
        await request(`${BASE_URL}/appointment_types/${typeId}`, 'DELETE', null, token);
        console.log("   Cleanup complete.");

        console.log("\n✅ QA TEST PASSED SUCCESSFULLY");
    } catch (error) {
        console.error("\n❌ QA TEST FAILED");
        console.error(error.message);
        process.exit(1);
    }
};

runTest();
