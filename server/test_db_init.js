const db = require('./database');

async function testInit() {
    console.log("Testing DB Init Loop...");
    // Just importing it triggers the init because it's at module level in index.js usually, 
    // but here it exports `initDatabase` or runs it.
    // Wait, `server/database.js` exports { client, initDatabase }.
    // `server/index.js` imports it and calls initDatabase likely?
    // Let me check database.js again to see if it runs on import or needs call.

    // Checked file: It exports { client, initDatabase }. `server/index.js` line 4 is `const db = require('./database');`. 
    // And actually `server/index.js` does NOT seem to call `initDatabase` explicitly in the lines I saw?
    // Wait, let me check `server/index.js` fully.
    try {
        await db.initDatabase();
        console.log("✅ Init called successfully.");
    } catch (e) {
        console.error("❌ Init failed:", e);
    }
}

testInit();
