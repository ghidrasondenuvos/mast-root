const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const crypto = require('crypto'); // Για τη δημιουργία τυχαίων κωδικών αποδείξεων (αντί για το uuid της Python)

const app = express();
const PORT = 8000; // Κρατάμε το 8000 που χρησιμοποιούσε το FastAPI για ευκολία

// Επιτρέπουμε CORS (αν χρειαστεί) και JSON parsing
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Εδώ θα μπούνε τα Vanilla JS αρχεία μας

// === ΣΥΝΔΕΣΗ ΜΕ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ ===
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'releaf_db'
};

// ==========================================
// 1. ENDPOINTS ΧΡΗΣΤΩΝ (Auth & Profile)
// ==========================================
app.post('/register', async (req, res) => {
    const { username, email, password, full_name, account_type, skills, resources } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Δημιουργία User
        const [userResult] = await connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        const userId = userResult.insertId;

        // 2. Δημιουργία Profile
        const [profileResult] = await connection.execute(
            'INSERT INTO profiles (user_id, full_name, account_type) VALUES (?, ?, ?)',
            [userId, full_name, account_type || 'volunteer']
        );
        const profileId = profileResult.insertId;

        // 3. Δημιουργία Volunteer Profile
        await connection.execute(
            'INSERT INTO volunteer_profiles (profile_id, skills, resources) VALUES (?, ?, ?)',
            [profileId, skills || '', resources || '']
        );

        await connection.commit();
        res.json({ status: 'success', message: 'Επιτυχής εγγραφή!' });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ detail: 'Σφάλμα εγγραφής. Το email ή username ίσως υπάρχει ήδη.' });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute(`
            SELECT u.id, u.username, u.email, u.password, p.full_name, p.account_type, v.skills, v.resources 
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN volunteer_profiles v ON p.id = v.profile_id
            WHERE u.email = ? AND u.password = ?
        `, [email, password]);
        await connection.end();

        if (users.length === 0) return res.status(401).json({ detail: 'Λάθος email ή κωδικός.' });
        
        res.json({
            message: 'Επιτυχής σύνδεση',
            user: users[0]
        });
    } catch (error) {
        res.status(500).json({ detail: 'Σφάλμα διακομιστή' });
    }
});

app.put('/update-profile', async (req, res) => {
    const { user_id, username, email, password, full_name, account_type, skills, resources } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        await connection.execute('UPDATE users SET username=?, email=?, password=? WHERE id=?', [username, email, password, user_id]);
        
        const [profiles] = await connection.execute('SELECT id FROM profiles WHERE user_id=?', [user_id]);
        if (profiles.length > 0) {
            const profileId = profiles[0].id;
            await connection.execute('UPDATE profiles SET full_name=?, account_type=? WHERE id=?', [full_name, account_type, profileId]);
            await connection.execute('UPDATE volunteer_profiles SET skills=?, resources=? WHERE profile_id=?', [skills, resources, profileId]);
        }

        await connection.commit();
        res.json({ status: 'success', message: 'επιτυχής τροποποίηση!', user: req.body });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ detail: 'Σφάλμα Βάσης Δεδομένων' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
// 2. ENDPOINTS ΔΡΑΣΕΩΝ & ΑΝΑΖΗΤΗΣΗΣ
// ==========================================
app.post('/actions', async (req, res) => {
    const { title, description, max_participants, location_name, action_type_name, creator_user_id } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Location
        let [locs] = await connection.execute('SELECT id FROM locations WHERE name = ?', [location_name]);
        let location_id = locs.length > 0 ? locs[0].id : (await connection.execute('INSERT INTO locations (name) VALUES (?)', [location_name]))[0].insertId;

        // Action Type
        let [types] = await connection.execute('SELECT id FROM action_types WHERE name = ?', [action_type_name]);
        let action_type_id = types.length > 0 ? types[0].id : (await connection.execute('INSERT INTO action_types (name) VALUES (?)', [action_type_name]))[0].insertId;

        // Organisation
        let [orgs] = await connection.execute('SELECT id FROM organisations WHERE user_id = ?', [creator_user_id]);
        let org_id;
        if (orgs.length > 0) { org_id = orgs[0].id; } 
        else {
            const [profs] = await connection.execute('SELECT full_name FROM profiles WHERE user_id = ?', [creator_user_id]);
            const orgName = profs.length > 0 ? profs[0].full_name : `Οργανισμός ${creator_user_id}`;
            const [newOrg] = await connection.execute('INSERT INTO organisations (user_id, name) VALUES (?, ?)', [creator_user_id, orgName]);
            org_id = newOrg.insertId;
        }

        await connection.execute(
            'INSERT INTO environmental_actions (title, description, max_participants, location_id, action_type_id, organisation_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, max_participants, location_id, action_type_id, org_id]
        );

        await connection.commit();
        res.json({ message: `Η δράση '${title}' καταχωρήθηκε επιτυχώς!` });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ detail: 'Σφάλμα δημιουργίας δράσης' });
    } finally {
        if (connection) await connection.end();
    }
});

app.get('/api/search-actions', async (req, res) => {
    const { location, action_type, keyword } = req.query;
    try {
        const connection = await mysql.createConnection(dbConfig);
        let query = `
            SELECT e.id, e.title, e.description, e.max_participants, l.name as location, a.name as action_type, o.name as organisation
            FROM environmental_actions e
            LEFT JOIN locations l ON e.location_id = l.id
            LEFT JOIN action_types a ON e.action_type_id = a.id
            LEFT JOIN organisations o ON e.organisation_id = o.id
            WHERE 1=1
        `;
        const params = [];

        if (location) { query += ` AND l.name LIKE ?`; params.push(`%${location}%`); }
        if (action_type) { query += ` AND a.name LIKE ?`; params.push(`%${action_type}%`); }
        if (keyword) { query += ` AND e.title LIKE ?`; params.push(`%${keyword}%`); }

        const [rows] = await connection.execute(query, params);
        await connection.end();

        if (rows.length === 0) return res.status(404).json({ detail: "Δεν βρέθηκαν δράσεις." });
        res.json(rows);
    } catch (error) {
        res.status(500).json({ detail: 'Σφάλμα αναζήτησης' });
    }
});

app.post('/actions/:action_id/participate', async (req, res) => {
    const action_id = req.params.action_id;
    const { user_id } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [users] = await connection.execute('SELECT account_type FROM profiles WHERE user_id = ?', [user_id]);
        if (users.length === 0 || users[0].account_type !== 'volunteer') throw new Error('Μόνο εγγεγραμμένοι εθελοντές μπορούν να δηλώσουν συμμετοχή.');

        const [existing] = await connection.execute('SELECT id FROM participation_requests WHERE user_id = ? AND action_id = ?', [user_id, action_id]);
        if (existing.length > 0) throw new Error('Έχετε ήδη δηλώσει συμμετοχή.');

        const [actions] = await connection.execute(`
            SELECT e.max_participants, o.user_id as creator_id 
            FROM environmental_actions e JOIN organisations o ON e.organisation_id = o.id WHERE e.id = ?
        `, [action_id]);
        if (actions.length === 0) throw new Error('Η δράση δεν βρέθηκε.');

        const [participants] = await connection.execute('SELECT COUNT(*) as count FROM participation_requests WHERE action_id = ? AND status = "approved"', [action_id]);
        if (participants[0].count >= actions[0].max_participants) throw new Error('Η δράση είναι πλήρης.');

        const [creators] = await connection.execute('SELECT account_type FROM profiles WHERE user_id = ?', [actions[0].creator_id]);
        const isOrg = creators.length > 0 && creators[0].account_type === 'organisation';
        
        const status = isOrg ? 'pending' : 'approved';
        await connection.execute('INSERT INTO participation_requests (user_id, action_id, status) VALUES (?, ?, ?)', [user_id, action_id, status]);

        await connection.commit();
        res.json({ message: isOrg ? "Επιτυχής δήλωση! Υπό έλεγχο." : "Επιτυχής δήλωση! Εγκριθήκατε." });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ detail: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
// 3. ΔΙΑΧΕΙΡΙΣΗ ΑΙΤΗΣΕΩΝ & ΕΙΔΟΠΟΙΗΣΕΙΣ
// ==========================================
app.get('/api/org-requests/:user_id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT pr.id as request_id, e.title as action_title, p.full_name as volunteer_name, v.skills as volunteer_skills, v.resources as volunteer_resources
            FROM participation_requests pr
            JOIN environmental_actions e ON pr.action_id = e.id
            JOIN organisations o ON e.organisation_id = o.id
            JOIN profiles p ON pr.user_id = p.user_id
            JOIN volunteer_profiles v ON p.id = v.profile_id
            WHERE o.user_id = ? AND pr.status = 'pending'
        `, [req.params.user_id]);
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json([]); }
});

app.post('/api/requests/:request_id/decision', async (req, res) => {
    const { org_user_id, status } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [reqs] = await connection.execute(`
            SELECT pr.user_id, e.title 
            FROM participation_requests pr JOIN environmental_actions e ON pr.action_id = e.id WHERE pr.id = ?
        `, [req.params.request_id]);
        
        await connection.execute('UPDATE participation_requests SET status = ? WHERE id = ?', [status, req.params.request_id]);
        
        const notifMsg = `Η αίτησή σας για τη δράση '${reqs[0].title}' μόλις ${status === 'approved' ? 'ΕΓΚΡΙΘΗΚΕ! 🎉' : 'απορρίφθηκε.'}`;
        await connection.execute('INSERT INTO notifications (user_id, text) VALUES (?, ?)', [reqs[0].user_id, notifMsg]);

        await connection.commit();
        res.json({ message: "Επιτυχής ενημέρωση!" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ detail: "Σφάλμα" });
    } finally {
        if (connection) await connection.end();
    }
});

app.get('/api/notifications/:user_id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, text FROM notifications WHERE user_id = ?', [req.params.user_id]);
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json([]); }
});
app.delete('/api/notifications/:user_id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM notifications WHERE user_id = ?', [req.params.user_id]);
        await connection.end();
        res.json({ message: "Cleared" });
    } catch (error) { res.status(500).json({}); }
});

// ==========================================
// 4. ΚΑΜΠΑΝΙΕΣ ΚΑΙ ΔΩΡΕΕΣ
// ==========================================
app.get('/api/user-actions/:user_id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT e.id, e.title FROM environmental_actions e JOIN organisations o ON e.organisation_id = o.id WHERE o.user_id = ?', [req.params.user_id]);
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json([]); }
});

app.post('/api/campaigns', async (req, res) => {
    const { title, description, goal_amount, action_id, creator_user_id } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO fundraising_campaigns (title, description, goal_amount, action_id, creator_user_id) VALUES (?, ?, ?, ?, ?)',
            [title, description, goal_amount, action_id, creator_user_id]
        );
        await connection.end();
        res.json({ message: "Η καμπάνια καταχωρήθηκε επιτυχώς!" });
    } catch (error) { res.status(500).json({ detail: "Σφάλμα" }); }
});

app.get('/api/campaigns', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT c.id, c.title, c.description, c.goal_amount, c.current_amount, e.title as action_title, o.name as organisation
            FROM fundraising_campaigns c
            LEFT JOIN environmental_actions e ON c.action_id = e.id
            LEFT JOIN organisations o ON e.organisation_id = o.id
        `);
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json([]); }
});

app.post('/api/donate', async (req, res) => {
    const { sponsor_id, campaign_id, amount, card_number } = req.body;
    let connection;
    try {
        if (card_number.length < 16) throw new Error("Μη έγκυρος αριθμός κάρτας.");
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [donations] = await connection.execute('INSERT INTO donations (sponsor_id, campaign_id, amount) VALUES (?, ?, ?)', [sponsor_id, campaign_id, amount]);
        const donation_id = donations.insertId;

        await connection.execute('INSERT INTO payments (donation_id, status) VALUES (?, "completed")', [donation_id]);
        
        const receipt_no = `REC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await connection.execute('INSERT INTO receipts (donation_id, receipt_number) VALUES (?, ?)', [donation_id, receipt_no]);

        await connection.execute('UPDATE fundraising_campaigns SET current_amount = current_amount + ? WHERE id = ?', [amount, campaign_id]);

        await connection.commit();
        res.json({ message: "Επιτυχής δωρεά! Σας ευχαριστούμε.", receipt: receipt_no });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ detail: error.message || "Σφάλμα" });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
// 5. ΑΝΑΛΥΣΗ ΚΑΙ ΠΙΣΤΟΠΟΙΗΤΙΚΑ
// ==========================================
app.post('/api/analyze-needs', async (req, res) => {
    res.json({ status: "success", message: "Επιτυχής καταχώρηση. Εντοπίστηκε νέα ανάγκη (Mocked)." });
});
app.get('/api/action-proposals', async (req, res) => { res.json([]); });
app.get('/api/user-approved-actions/:user_id', async (req, res) => { res.json([]); });
app.get('/api/certificates/:user_id', async (req, res) => { res.json([]); });
app.get('/api/db-view', async (req, res) => { res.json([]); });
app.get('/api/db-actions', async (req, res) => { res.json([]); });
app.get('/api/db-requests', async (req, res) => { res.json([]); });

app.listen(PORT, () => {
    console.log(`🚀 Ο Releaf Server τρέχει στο http://localhost:${PORT}`);
});