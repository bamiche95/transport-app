
const mysql = require('mysql2/promise');
async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'transport_app'
    });
    const [rows] = await connection.execute('SELECT job_type_id, job_type_name FROM jobtype');
    for (const row of rows) {
        console.log(`${row.job_type_id}:${row.job_type_name}`);
    }
    await connection.end();
}
run();
