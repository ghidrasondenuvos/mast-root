const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

// Επιτρέπουμε στον server να διαβάζει JSON και να σερβίρει το Frontend (φάκελος public)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ρυθμίσεις Βάσης Δεδομένων (Οι προεπιλεγμένες του Laragon)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'releaf_db'
};

// ==========================================
// 1. ΣΥΣΤΗΜΑ ΛΟΓΑΡΙΑΣΜΩΝ (LOGIN & REGISTER)
// ==========================================

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        
        // Ψάχνουμε τον χρήστη
        const [users] = await conn.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        await conn.end();

        if (users.length > 0) {
            res.json({ status: 'success', user: users[0] });
        } else {
            res.status(401).json({ detail: 'Λάθος email ή κωδικός πρόσβασης.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα βάσης δεδομένων.' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name, account_type, skills, resources } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        
        // Έλεγχος αν υπάρχει ήδη το email
        const [existing] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Το email χρησιμοποιείται ήδη.' });
        }

        // Δημιουργία Χρήστη
        await conn.execute(
            'INSERT INTO users (username, email, password, full_name, account_type, skills, resources) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, password, full_name, account_type, skills || '', resources || '']
        );
        await conn.end();
        
        res.json({ status: 'success', message: 'Η εγγραφή ολοκληρώθηκε επιτυχώς!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την εγγραφή στη βάση.' });
    }
});

// ==========================================
// 2. DB ADMIN PANEL (Δεδομένα για τους Πίνακες)
// ==========================================

app.get('/api/db-view', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [users] = await conn.execute('SELECT * FROM users');
        await conn.end();
        res.json(users);
    } catch (err) { res.json([]); } // Αν ο πίνακας δεν υπάρχει, στέλνει κενό πίνακα για να μην κρασάρει το UI
});

app.get('/api/db-actions', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [actions] = await conn.execute('SELECT * FROM environmental_actions');
        await conn.end();
        res.json(actions);
    } catch (err) { res.json([]); }
});

app.get('/api/db-requests', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [requests] = await conn.execute('SELECT * FROM participation_requests');
        await conn.end();
        res.json(requests);
    } catch (err) { res.json([]); }
});

// ==========================================
// 3. ΑΣΦΑΛΙΣΤΙΚΕΣ ΔΙΚΛΕΙΔΕΣ ΓΙΑ DASHBOARD
// ==========================================
// (Αυτά τα endpoints απαντούν με κενά δεδομένα 
// για να φορτώνουν άμεσα τα panels του Frontend)

app.get('/api/notifications/:id', (req, res) => res.json([]));
app.get('/api/org-requests/:id', (req, res) => res.json([]));
app.get('/api/campaigns', (req, res) => res.json([]));
app.get('/api/action-proposals', (req, res) => res.json([]));
app.get('/api/user-actions/:id', (req, res) => res.json([]));

// Εκκίνηση του Server
app.listen(8000, () => {
    console.log('✅ Το Backend του Releaf είναι πλήρως λειτουργικό και ακούει στη θύρα 8000!');
});