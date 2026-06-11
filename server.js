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
    database: 'releaf_db',
    charset: 'utf8mb4'
};

// ==========================================
// 1. ΣΥΣΤΗΜΑ ΛΟΓΑΡΙΑΣΜΩΝ (LOGIN, REGISTER & PROFILE)
// ==========================================

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        
        const [users] = await conn.execute(`
            SELECT u.id, u.username, u.email, u.password, p.full_name, p.account_type, vp.skills, vp.resources
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN volunteer_profiles vp ON p.id = vp.profile_id
            WHERE u.email = ? AND u.password = ?
        `, [email, password]);
        await conn.end();

        if (users.length > 0) {
            const user = users[0];
            // Map db ENUM 'organisation' to frontend-friendly 'organization'
            if (user.account_type === 'organisation') {
                user.account_type = 'organization';
            }
            res.json({ status: 'success', user });
        } else {
            res.status(401).json({ detail: 'Λάθος email ή κωδικός πρόσβασης.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα βάσης δεδομένων.' });
    }
});

app.post('/register', async (req, res) => {
    let conn;
    try {
        const { username, email, password, full_name, account_type, skills, resources } = req.body;
        conn = await mysql.createConnection(dbConfig);
        
        // Έλεγχος αν υπάρχει ήδη το username
        const [existingUser] = await conn.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Το username χρησιμοποιείται ήδη.' });
        }

        // Έλεγχος αν υπάρχει ήδη το email
        const [existingEmail] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Το email χρησιμοποιείται ήδη.' });
        }

        await conn.beginTransaction();

        // 1. Δημιουργία Χρήστη στον πίνακα users
        const [userResult] = await conn.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        const userId = userResult.insertId;

        // Map 'organization' (frontend) σε 'organisation' (database ENUM)
        const dbAccountType = account_type === 'organization' ? 'organisation' : account_type;

        // 2. Δημιουργία Προφίλ στον πίνακα profiles
        const [profileResult] = await conn.execute(
            'INSERT INTO profiles (user_id, full_name, account_type) VALUES (?, ?, ?)',
            [userId, full_name, dbAccountType]
        );
        const profileId = profileResult.insertId;

        // 3. Δημιουργία συμπληρωματικών στοιχείων ανάλογα με τον τύπο
        if (dbAccountType === 'volunteer') {
            await conn.execute(
                'INSERT INTO volunteer_profiles (profile_id, skills, resources) VALUES (?, ?, ?)',
                [profileId, skills || '', resources || '']
            );
        } else if (dbAccountType === 'organisation') {
            await conn.execute(
                'INSERT INTO organisations (user_id, name) VALUES (?, ?)',
                [userId, full_name]
            );
        }

        await conn.commit();
        await conn.end();
        
        res.json({ status: 'success', message: 'Η εγγραφή ολοκληρώθηκε επιτυχώς!' });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την εγγραφή στη βάση.' });
    }
});

app.put('/update-profile', async (req, res) => {
    let conn;
    try {
        const { user_id, username, email, password, full_name, account_type, skills, resources } = req.body;
        conn = await mysql.createConnection(dbConfig);
        
        // Έλεγχος αν το username χρησιμοποιείται από άλλον
        const [existingUser] = await conn.execute('SELECT * FROM users WHERE username = ? AND id != ?', [username, user_id]);
        if (existingUser.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Το username χρησιμοποιείται ήδη.' });
        }

        // Έλεγχος αν το email χρησιμοποιείται από άλλον
        const [existingEmail] = await conn.execute('SELECT * FROM users WHERE email = ? AND id != ?', [email, user_id]);
        if (existingEmail.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Το email χρησιμοποιείται ήδη.' });
        }

        await conn.beginTransaction();

        // 1. Ενημέρωση πίνακα users
        await conn.execute(
            'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?',
            [username, email, password, user_id]
        );

        // Map 'organization' σε 'organisation'
        const dbAccountType = account_type === 'organization' ? 'organisation' : account_type;

        // 2. Ενημέρωση πίνακα profiles
        await conn.execute(
            'UPDATE profiles SET full_name = ?, account_type = ? WHERE user_id = ?',
            [full_name, dbAccountType, user_id]
        );

        // Λήψη id από profiles
        const [profiles] = await conn.execute('SELECT id FROM profiles WHERE user_id = ?', [user_id]);
        const profileId = profiles[0].id;

        // 3. Ενημέρωση συμπληρωματικών πινάκων
        if (dbAccountType === 'volunteer') {
            await conn.execute('DELETE FROM organisations WHERE user_id = ?', [user_id]);
            const [vps] = await conn.execute('SELECT id FROM volunteer_profiles WHERE profile_id = ?', [profileId]);
            if (vps.length > 0) {
                await conn.execute(
                    'UPDATE volunteer_profiles SET skills = ?, resources = ? WHERE profile_id = ?',
                    [skills || '', resources || '', profileId]
                );
            } else {
                await conn.execute(
                    'INSERT INTO volunteer_profiles (profile_id, skills, resources) VALUES (?, ?, ?)',
                    [profileId, skills || '', resources || '']
                );
            }
        } else if (dbAccountType === 'organisation') {
            await conn.execute('DELETE FROM volunteer_profiles WHERE profile_id = ?', [profileId]);
            const [orgs] = await conn.execute('SELECT id FROM organisations WHERE user_id = ?', [user_id]);
            if (orgs.length > 0) {
                await conn.execute(
                    'UPDATE organisations SET name = ? WHERE user_id = ?',
                    [full_name, user_id]
                );
            } else {
                await conn.execute(
                    'INSERT INTO organisations (user_id, name) VALUES (?, ?)',
                    [user_id, full_name]
                );
            }
        } else {
            // Sponsor
            await conn.execute('DELETE FROM volunteer_profiles WHERE profile_id = ?', [profileId]);
            await conn.execute('DELETE FROM organisations WHERE user_id = ?', [user_id]);
        }

        await conn.commit();

        // Λήψη του ανανεωμένου χρήστη
        const [users] = await conn.execute(`
            SELECT u.id, u.username, u.email, u.password, p.full_name, p.account_type, vp.skills, vp.resources
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN volunteer_profiles vp ON p.id = vp.profile_id
            WHERE u.id = ?
        `, [user_id]);
        await conn.end();

        const user = users[0];
        if (user.account_type === 'organisation') {
            user.account_type = 'organization';
        }

        res.json({ status: 'success', user });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την τροποποίηση του προφίλ.' });
    }
});

// ==========================================
// 2. DB ADMIN PANEL (Δεδομένα με SQL JOINs)
// ==========================================

app.get('/api/db-view', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [users] = await conn.execute(`
            SELECT u.id, u.username, u.password, u.email, p.full_name, p.account_type, 
                   COALESCE(vp.skills, '') AS skills, COALESCE(vp.resources, '') AS resources
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN volunteer_profiles vp ON p.id = vp.profile_id
        `);
        await conn.end();
        users.forEach(u => {
            if (u.account_type === 'organisation') u.account_type = 'organization';
        });
        res.json(users);
    } catch (err) { 
        console.error(err);
        res.json([]); 
    }
});

app.get('/api/db-actions', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [actions] = await conn.execute(`
            SELECT ea.id, ea.title, ea.description, ea.max_participants, 
                   l.name AS location, at.name AS action_type, o.name AS organisation
            FROM environmental_actions ea
            LEFT JOIN locations l ON ea.location_id = l.id
            LEFT JOIN action_types at ON ea.action_type_id = at.id
            LEFT JOIN organisations o ON ea.organisation_id = o.id
        `);
        await conn.end();
        res.json(actions);
    } catch (err) { 
        console.error(err);
        res.json([]); 
    }
});

app.get('/api/db-requests', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [requests] = await conn.execute(`
            SELECT pr.id, p.full_name AS volunteer_name, ea.title AS action_title, pr.status
            FROM participation_requests pr
            LEFT JOIN users u ON pr.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN environmental_actions ea ON pr.action_id = ea.id
        `);
        await conn.end();
        res.json(requests);
    } catch (err) { 
        console.error(err);
        res.json([]); 
    }
});

// ==========================================
// 3. ΔΙΑΧΕΙΡΙΣΗ ΔΡΑΣΕΩΝ & ΣΥΜΜΕΤΟΧΩΝ
// ==========================================

app.post('/actions', async (req, res) => {
    let conn;
    try {
        const { title, description, max_participants, location_name, action_type_name, creator_user_id } = req.body;
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();

        // 1. Εύρεση ή δημιουργία organisation id για τον οργανισμό
        let [orgs] = await conn.execute('SELECT id FROM organisations WHERE user_id = ?', [creator_user_id]);
        let orgId;
        if (orgs.length > 0) {
            orgId = orgs[0].id;
        } else {
            const [profs] = await conn.execute('SELECT full_name FROM profiles WHERE user_id = ?', [creator_user_id]);
            const orgName = profs.length > 0 ? profs[0].full_name : 'Default Org';
            const [newOrg] = await conn.execute('INSERT INTO organisations (user_id, name) VALUES (?, ?)', [creator_user_id, orgName]);
            orgId = newOrg.insertId;
        }

        // 2. Εύρεση ή δημιουργία τοποθεσίας (location_id)
        let [locs] = await conn.execute('SELECT id FROM locations WHERE name = ?', [location_name]);
        let locationId;
        if (locs.length > 0) {
            locationId = locs[0].id;
        } else {
            const [newLoc] = await conn.execute('INSERT INTO locations (name) VALUES (?)', [location_name]);
            locationId = newLoc.insertId;
        }

        // 3. Εύρεση ή δημιουργία κατηγορίας δράσης (action_type_id)
        let [types] = await conn.execute('SELECT id FROM action_types WHERE name = ?', [action_type_name]);
        let actionTypeId;
        if (types.length > 0) {
            actionTypeId = types[0].id;
        } else {
            const [newType] = await conn.execute('INSERT INTO action_types (name) VALUES (?)', [action_type_name]);
            actionTypeId = newType.insertId;
        }

        // 4. Εισαγωγή της περιβαλλοντικής δράσης
        await conn.execute(`
            INSERT INTO environmental_actions (title, description, max_participants, location_id, action_type_id, organisation_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, description, max_participants || 0, locationId, actionTypeId, orgId]);

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Η δράση δημιουργήθηκε με επιτυχία!' });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά τη δημιουργία της δράσης.' });
    }
});

app.get('/api/search-actions', async (req, res) => {
    try {
        const { location, action_type, keyword } = req.query;
        const conn = await mysql.createConnection(dbConfig);
        
        let query = `
            SELECT ea.id, ea.title, ea.description, ea.max_participants, 
                   l.name AS location, at.name AS action_type, o.name AS organisation
            FROM environmental_actions ea
            LEFT JOIN locations l ON ea.location_id = l.id
            LEFT JOIN action_types at ON ea.action_type_id = at.id
            LEFT JOIN organisations o ON ea.organisation_id = o.id
            WHERE 1=1
        `;
        const params = [];

        if (location) {
            query += ' AND l.name LIKE ?';
            params.push(`%${location}%`);
        }
        if (action_type) {
            query += ' AND at.name LIKE ?';
            params.push(`%${action_type}%`);
        }
        if (keyword) {
            query += ' AND (ea.title LIKE ? OR ea.description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        const [results] = await conn.execute(query, params);
        await conn.end();
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την αναζήτηση δράσεων.' });
    }
});

app.post('/actions/:id/participate', async (req, res) => {
    let conn;
    try {
        const actionId = req.params.id;
        const { user_id } = req.body;
        conn = await mysql.createConnection(dbConfig);

        // Έλεγχος αν υπάρχει ήδη εκκρεμής ή εγκεκριμένη αίτηση
        const [existing] = await conn.execute(
            'SELECT * FROM participation_requests WHERE user_id = ? AND action_id = ?',
            [user_id, actionId]
        );
        if (existing.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Έχετε ήδη δηλώσει συμμετοχή σε αυτή τη δράση.' });
        }

        await conn.beginTransaction();

        // 1. Δημιουργία της αίτησης
        await conn.execute(
            'INSERT INTO participation_requests (user_id, action_id, status) VALUES (?, ?, ?)',
            [user_id, actionId, 'pending']
        );

        // 2. Ειδοποίηση του οργανισμού που διοργανώνει τη δράση
        const [actions] = await conn.execute(`
            SELECT ea.title, o.user_id AS org_user_id
            FROM environmental_actions ea
            JOIN organisations o ON ea.organisation_id = o.id
            WHERE ea.id = ?
        `, [actionId]);

        if (actions.length > 0) {
            const { title, org_user_id } = actions[0];
            const [vols] = await conn.execute('SELECT full_name FROM profiles WHERE user_id = ?', [user_id]);
            const volName = vols.length > 0 ? vols[0].full_name : 'Κάποιος εθελοντής';

            await conn.execute(
                'INSERT INTO notifications (user_id, text) VALUES (?, ?)',
                [org_user_id, `Νέα αίτηση συμμετοχής από τον/την ${volName} για τη δράση: ${title}`]
            );
        }

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Η αίτηση συμμετοχής καταχωρήθηκε επιτυχώς!' });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά τη δήλωση συμμετοχής.' });
    }
});

app.get('/api/org-requests/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const conn = await mysql.createConnection(dbConfig);
        const [requests] = await conn.execute(`
            SELECT pr.id AS request_id, p.full_name AS volunteer_name, 
                   ea.title AS action_title, COALESCE(vp.skills, '') AS volunteer_skills, 
                   COALESCE(vp.resources, '') AS volunteer_resources
            FROM participation_requests pr
            JOIN users u ON pr.user_id = u.id
            JOIN profiles p ON u.id = p.user_id
            LEFT JOIN volunteer_profiles vp ON p.id = vp.profile_id
            JOIN environmental_actions ea ON pr.action_id = ea.id
            JOIN organisations o ON ea.organisation_id = o.id
            WHERE o.user_id = ? AND pr.status = 'pending'
        `, [userId]);
        await conn.end();
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.post('/api/requests/:request_id/decision', async (req, res) => {
    let conn;
    try {
        const requestId = req.params.request_id;
        const { status } = req.body; // 'approved' η 'rejected'
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();

        // 1. Ενημέρωση της αίτησης
        await conn.execute(
            'UPDATE participation_requests SET status = ? WHERE id = ?',
            [status, requestId]
        );

        // 2. Ειδοποίηση του εθελοντή
        const [reqDetails] = await conn.execute(`
            SELECT pr.user_id AS volunteer_id, ea.title AS action_title
            FROM participation_requests pr
            JOIN environmental_actions ea ON pr.action_id = ea.id
            WHERE pr.id = ?
        `, [requestId]);

        if (reqDetails.length > 0) {
            const { volunteer_id, action_title } = reqDetails[0];
            const statusTextGreek = status === 'approved' ? 'εγκρίθηκε' : 'απορρίφθηκε';
            
            await conn.execute(
                'INSERT INTO notifications (user_id, text) VALUES (?, ?)',
                [volunteer_id, `Η αίτησή σας για τη δράση "${action_title}" ${statusTextGreek}!`]
            );
        }

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Η απόφαση καταχωρήθηκε με επιτυχία!' });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την επεξεργασία της αίτησης.' });
    }
});

// ==========================================
// 4. ΕΙΔΟΠΟΙΗΣΕΙΣ
// ==========================================

app.get('/api/notifications/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const conn = await mysql.createConnection(dbConfig);
        const [notifications] = await conn.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        await conn.end();
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await conn.end();
        res.json({ status: 'success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ detail: 'Σφάλμα διαγραφής ειδοποιήσεων.' });
    }
});

// ==========================================
// 5. ΚΑΜΠΑΝΙΕΣ ΧΡΗΜΑΤΟΔΟΤΗΣΗΣ & ΔΩΡΕΕΣ
// ==========================================

app.get('/api/user-actions/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const conn = await mysql.createConnection(dbConfig);
        const [actions] = await conn.execute(`
            SELECT ea.id, ea.title
            FROM environmental_actions ea
            JOIN organisations o ON ea.organisation_id = o.id
            WHERE o.user_id = ?
        `, [userId]);
        await conn.end();
        res.json(actions);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.post('/api/campaigns', async (req, res) => {
    try {
        const { title, description, goal_amount, action_id, creator_user_id } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(`
            INSERT INTO fundraising_campaigns (title, description, goal_amount, current_amount, action_id, creator_user_id)
            VALUES (?, ?, ?, 0, ?, ?)
        `, [title, description, goal_amount, action_id, creator_user_id]);
        await conn.end();
        res.json({ status: 'success', message: 'Η καμπάνια χρηματοδότησης ξεκίνησε επιτυχώς!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά τη δημιουργία καμπάνιας.' });
    }
});

app.get('/api/campaigns', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [campaigns] = await conn.execute(`
            SELECT fc.id, fc.title, fc.description, fc.goal_amount, fc.current_amount, fc.action_id, fc.creator_user_id,
                   ea.title AS action_title
            FROM fundraising_campaigns fc
            JOIN environmental_actions ea ON fc.action_id = ea.id
        `);
        await conn.end();
        res.json(campaigns);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.post('/api/donate', async (req, res) => {
    let conn;
    try {
        const { sponsor_id, campaign_id, amount } = req.body;
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();

        // 1. Καταγραφή δωρεάς
        const [donResult] = await conn.execute(
            'INSERT INTO donations (sponsor_id, campaign_id, amount) VALUES (?, ?, ?)',
            [sponsor_id, campaign_id, amount]
        );
        const donationId = donResult.insertId;

        // 2. Καταγραφή πληρωμής
        await conn.execute(
            'INSERT INTO payments (donation_id, status) VALUES (?, ?)',
            [donationId, 'completed']
        );

        // 3. Δημιουργία απόδειξης
        const receiptNo = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await conn.execute(
            'INSERT INTO receipts (donation_id, receipt_number) VALUES (?, ?)',
            [donationId, receiptNo]
        );

        // 4. Αύξηση του συγκεντρωθέντος ποσού της καμπάνιας
        await conn.execute(
            'UPDATE fundraising_campaigns SET current_amount = current_amount + ? WHERE id = ?',
            [amount, campaign_id]
        );

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Ευχαριστούμε πολύ για τη δωρεά σας!', receipt: receiptNo });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την ολοκλήρωση της δωρεάς.' });
    }
});

// ==========================================
// 6. ΠΕΡΙΒΑΛΛΟΝΤΙΚΕΣ ΑΝΑΓΚΕΣ & ΠΡΟΤΑΣΕΙΣ
// ==========================================

app.get('/api/action-proposals', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [proposals] = await conn.execute(`
            SELECT ap.id, ap.title, ap.description, ap.status, en.severity, 
                   l.name AS location, at.name AS action_type
            FROM action_proposals ap
            JOIN environmental_needs en ON ap.need_id = en.id
            JOIN locations l ON en.location_id = l.id
            JOIN action_types at ON ap.action_type_id = at.id
            WHERE ap.status = 'proposed'
        `);
        await conn.end();
        res.json(proposals);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.post('/api/analyze-needs', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.beginTransaction();

        // Seeding τοποθεσιών αν είναι κενές
        const [locs] = await conn.execute('SELECT COUNT(*) AS count FROM locations');
        if (locs[0].count === 0) {
            await conn.execute("INSERT INTO locations (name) VALUES ('Αθήνα'), ('Πάτρα'), ('Θεσσαλονίκη'), ('Βόλος'), ('Χανιά')");
        }

        // Λήψη τοποθεσιών
        const [locations] = await conn.execute('SELECT id, name FROM locations');
        const patraId = locations.find(l => l.name === 'Πάτρα')?.id || locations[0].id;
        const athensId = locations.find(l => l.name === 'Αθήνα')?.id || locations[0].id;

        // Seeding κατηγοριών αν είναι κενές
        const [types] = await conn.execute('SELECT id, name FROM action_types');
        const treePlantingId = types.find(t => t.name === 'Δενδροφύτευση')?.id || types[0].id;
        const beachCleanId = types.find(t => t.name === 'Καθαρισμός Παραλίας')?.id || types[0].id;

        // Δημιουργία δοκιμαστικών αναγκών αν δεν υπάρχουν
        const [needsCount] = await conn.execute('SELECT COUNT(*) AS count FROM environmental_needs');
        if (needsCount[0].count === 0) {
            const [need1] = await conn.execute(
                "INSERT INTO environmental_needs (location_id, description, severity) VALUES (?, 'Σοβαρή διάβρωση εδάφους και έλλειψη πρασίνου στο δασικό ιστό.', 'high')",
                [athensId]
            );
            await conn.execute(
                "INSERT INTO action_proposals (need_id, action_type_id, title, description, status) VALUES (?, ?, 'Επείγουσα Δενδροφύτευση Υμηττού', 'Φύτευση 500 νέων δενδρυλλίων για συγκράτηση του εδάφους.', 'proposed')",
                [need1.insertId, treePlantingId]
            );

            const [need2] = await conn.execute(
                "INSERT INTO environmental_needs (location_id, description, severity) VALUES (?, 'Μεγάλη συσσώρευση πλαστικών απορριμμάτων που απειλεί το θαλάσσιο οικοσύστημα.', 'medium')",
                [patraId]
            );
            await conn.execute(
                "INSERT INTO action_proposals (need_id, action_type_id, title, description, status) VALUES (?, ?, 'Καθαρισμός Παραλίας Ρίου', 'Απομάκρυνση πλαστικών και ευαισθητοποίηση των πολιτών.', 'proposed')",
                [need2.insertId, beachCleanId]
            );
        } else {
            // Δημιουργία νέας ανάγκης για επίδειξη
            const [newNeed] = await conn.execute(
                "INSERT INTO environmental_needs (location_id, description, severity) VALUES (?, 'Αυξημένος κίνδυνος πυρκαγιάς λόγω συσσώρευσης ξηρών κλαδιών.', 'high')",
                [athensId]
            );
            const fireTypeId = types.find(t => t.name === 'Πυροπροστασία / Δασοπροστασία')?.id || types[0].id;
            await conn.execute(
                "INSERT INTO action_proposals (need_id, action_type_id, title, description, status) VALUES (?, ?, 'Δασοπροστασία στο Τατόι', 'Απομάκρυνση καύσιμης ύλης και διάνοιξη αντιπυρικών ζωνών.', 'proposed')",
                [newNeed.insertId, fireTypeId]
            );
        }

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Η σάρωση ολοκληρώθηκε! Ανακαλύφθηκαν νέες περιβαλλοντικές ανάγκες προς αντιμετώπιση.' });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Αποτυχία κατά την ανάλυση αναγκών.' });
    }
});

app.post('/api/action-proposals/:id/convert', async (req, res) => {
    let conn;
    try {
        const proposalId = req.params.id;
        const { user_id } = req.body;
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();

        // 1. Λήψη στοιχείων της πρότασης
        const [props] = await conn.execute(`
            SELECT ap.title, ap.description, ap.action_type_id, en.location_id
            FROM action_proposals ap
            JOIN environmental_needs en ON ap.need_id = en.id
            WHERE ap.id = ?
        `, [proposalId]);

        if (props.length === 0) {
            await conn.end();
            return res.status(404).json({ detail: 'Η πρόταση δεν βρέθηκε.' });
        }

        const proposal = props[0];

        // 2. Εύρεση ή δημιουργία organisation id για τον οργανισμό
        let [orgs] = await conn.execute('SELECT id FROM organisations WHERE user_id = ?', [user_id]);
        let orgId;
        if (orgs.length > 0) {
            orgId = orgs[0].id;
        } else {
            const [profs] = await conn.execute('SELECT full_name FROM profiles WHERE user_id = ?', [user_id]);
            const orgName = profs.length > 0 ? profs[0].full_name : 'Default Org';
            const [newOrg] = await conn.execute('INSERT INTO organisations (user_id, name) VALUES (?, ?)', [user_id, orgName]);
            orgId = newOrg.insertId;
        }

        // 3. Δημιουργία επίσημης δράσης
        await conn.execute(`
            INSERT INTO environmental_actions (title, description, max_participants, location_id, action_type_id, organisation_id)
            VALUES (?, ?, 50, ?, ?, ?)
        `, [proposal.title, proposal.description, proposal.location_id, proposal.action_type_id, orgId]);

        // 4. Αλλαγή κατάστασης της πρότασης
        await conn.execute(
            "UPDATE action_proposals SET status = 'converted_to_action' WHERE id = ?",
            [proposalId]
        );

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Η πρόταση μετατράπηκε σε επίσημη Δράση με επιτυχία!' });
    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch(e) {}
            try { await conn.end(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά τη μετατροπή της πρότασης.' });
    }
});

// ==========================================
// 7. ΠΙΣΤΟΠΟΙΗΤΙΚΑ (Mock Endpoints)
// ==========================================
app.get('/api/user-actions/:id', (req, res) => res.json([]));

// Εκκίνηση του Server
app.listen(8000, () => {
    console.log('✅ Το Backend του Releaf είναι πλήρως λειτουργικό και ακούει στη θύρα 8000!');
});