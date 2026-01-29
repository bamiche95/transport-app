
const mysql = require('mysql2/promise');
async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'transport_app'
    });

    // 1. Add Relocate if missing
    const [rows] = await connection.execute('SELECT * FROM jobtype WHERE job_type_name = "Relocate"');
    if (rows.length === 0) {
        await connection.execute('INSERT INTO jobtype (job_type_name) VALUES ("Relocate")');
        console.log('Added Relocate');
    }

    // 2. Fix casing for Tip and Return
    await connection.execute('UPDATE jobtype SET job_type_name = "Tip And Return" WHERE job_type_name = "Tip and Return"');
    console.log('Updated Tip And Return casing');

    await connection.end();
}
run();
