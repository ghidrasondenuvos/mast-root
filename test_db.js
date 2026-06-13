const mysql = require('mysql2/promise');

async function test() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'unibite',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const [users] = await pool.execute('SELECT * FROM users');
        console.log('Users:', users.length);
        process.exit(0);
    } catch (error) {
        console.error('DB Error:', error.message);
        process.exit(1);
    }
}
test();
