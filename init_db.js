const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
    try {
        const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', multipleStatements: true });
        
        let sql = fs.readFileSync('config/unibite_db.sql', 'utf8');
        await conn.query('DROP DATABASE IF EXISTS unibite_db');
        await conn.query(sql);
        console.log('Tables created and admin inserted with plain text password.');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
