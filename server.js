const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DB Configuration for UniBite
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'unibite_db',
    charset: 'utf8mb4'
};

// ==========================================
// 1. AUTH & USERS (Student & Admin)
// ==========================================

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        
        const [users] = await conn.execute(
            'SELECT id, username, email, role, credits FROM users WHERE email = ? AND password = ?',
            [email, password]
        );
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
    let conn;
    try {
        const { username, email, password } = req.body;
        conn = await mysql.createConnection(dbConfig);
        
        const [existingUser] = await conn.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            await conn.end();
            return res.status(400).json({ detail: 'Το username ή το email χρησιμοποιείται ήδη.' });
        }

        // New students get 5 credits automatically
        await conn.execute(
            'INSERT INTO users (username, email, password, role, credits) VALUES (?, ?, ?, ?, ?)',
            [username, email, password, 'student', 5]
        );
        await conn.end();
        
        res.json({ status: 'success', message: 'Η εγγραφή ολοκληρώθηκε! Έχετε λάβει 5 credits ως δώρο καλωσορίσματος.' });
    } catch (error) {
        if (conn) try { await conn.end(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την εγγραφή.' });
    }
});

// Get user profile (credits etc)
app.get('/api/users/:id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [users] = await conn.execute('SELECT id, username, email, role, credits FROM users WHERE id = ?', [req.params.id]);
        await conn.end();
        if (users.length > 0) res.json(users[0]);
        else res.status(404).json({ detail: 'Δεν βρέθηκε χρήστης.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα βάσης δεδομένων.' });
    }
});


// ==========================================
// 2. COOK: POSTS (ΑΓΓΕΛΙΕΣ CRUD)
// ==========================================

// Create a new post
app.post('/api/posts', async (req, res) => {
    try {
        const { cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        
        await conn.execute(`
            INSERT INTO posts (cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions, available_portions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions, total_portions]);
        
        await conn.end();
        res.json({ status: 'success', message: 'Η αγγελία δημιουργήθηκε!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά τη δημιουργία αγγελίας.' });
    }
});

// Get active posts for Feed (<= 48 hours and available_portions > 0)
// Also get inactive/deleted for cooks dashboard depending on query
app.get('/api/posts', async (req, res) => {
    try {
        const { cook_id, feed } = req.query;
        const conn = await mysql.createConnection(dbConfig);
        
        let query = `
            SELECT p.*, u.username as cook_name 
            FROM posts p 
            JOIN users u ON p.cook_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        if (feed === 'true') {
            // Only active posts (created within 48h, not marked deleted)
            query += " AND p.status = 'active' AND TIMESTAMPDIFF(HOUR, p.created_at, NOW()) <= 48";
        }
        if (cook_id) {
            query += " AND p.cook_id = ?";
            params.push(cook_id);
        }

        query += " ORDER BY p.created_at DESC";

        const [posts] = await conn.execute(query, params);
        
        // Dynamic status calculation for the feed: grey out if portions = 0
        posts.forEach(post => {
            if (post.available_portions <= 0) post.status = 'inactive';
        });

        await conn.end();
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ανάκτησης αγγελιών.' });
    }
});

// Update Post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const { title, notes, allergens, pickup_location, pickup_time, available_portions } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(`
            UPDATE posts SET title=?, notes=?, allergens=?, pickup_location=?, pickup_time=?, available_portions=? WHERE id=?
        `, [title, notes, allergens, pickup_location, pickup_time, available_portions, req.params.id]);
        await conn.end();
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Delete Post (Soft Delete)
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute("UPDATE posts SET status='deleted' WHERE id=?", [req.params.id]);
        await conn.end();
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});


// ==========================================
// 3. CONSUMER: REQUESTS
// ==========================================

// Consumer requests a portion
app.post('/api/requests', async (req, res) => {
    let conn;
    try {
        const { consumer_id, post_id } = req.body;
        conn = await mysql.createConnection(dbConfig);
        
        // 1. Check if user has credits
        const [users] = await conn.execute('SELECT credits FROM users WHERE id = ?', [consumer_id]);
        if (users[0].credits < 1) {
            await conn.end();
            return res.status(400).json({ detail: 'Δεν έχετε αρκετούς πόντους (credits) για να ζητήσετε μερίδα.' });
        }

        // 2. Check if post has available portions
        const [posts] = await conn.execute('SELECT available_portions, cook_id FROM posts WHERE id = ?', [post_id]);
        if (posts[0].available_portions < 1) {
            await conn.end();
            return res.status(400).json({ detail: 'Οι μερίδες για αυτή την αγγελία εξαντλήθηκαν.' });
        }

        // Check if user is requesting their own food
        if (posts[0].cook_id === consumer_id) {
            await conn.end();
            return res.status(400).json({ detail: 'Δεν μπορείτε να ζητήσετε το δικό σας φαγητό.' });
        }

        await conn.beginTransaction();

        // Deduct 1 credit immediately
        await conn.execute('UPDATE users SET credits = credits - 1 WHERE id = ?', [consumer_id]);

        // Insert request
        await conn.execute('INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, ?)', [post_id, consumer_id, 'pending']);

        await conn.commit();
        await conn.end();

        res.json({ status: 'success', message: 'Το αίτημα στάλθηκε στον μάγειρα!' });
    } catch (error) {
        if (conn) try { await conn.rollback(); await conn.end(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Get requests for a Cook's posts
app.get('/api/cook-requests/:cook_id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [requests] = await conn.execute(`
            SELECT r.id, r.status, r.created_at, p.title as post_title, u.username as consumer_name, r.consumer_id
            FROM requests r
            JOIN posts p ON r.post_id = p.id
            JOIN users u ON r.consumer_id = u.id
            WHERE p.cook_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.cook_id]);
        await conn.end();
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Get requests made by a Consumer
app.get('/api/consumer-requests/:consumer_id', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [requests] = await conn.execute(`
            SELECT r.id, r.status, r.created_at, p.title as post_title, u.username as cook_name, p.cook_id
            FROM requests r
            JOIN posts p ON r.post_id = p.id
            JOIN users u ON p.cook_id = u.id
            WHERE r.consumer_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.consumer_id]);
        await conn.end();
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// ==========================================
// 4. REQUEST MANAGEMENT (Approve/Reject/Receive/No-Show)
// ==========================================

app.post('/api/requests/:id/decision', async (req, res) => {
    let conn;
    try {
        const request_id = req.params.id;
        const { status } = req.body; // 'approved' or 'rejected'
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();

        const [reqs] = await conn.execute('SELECT post_id, consumer_id, status FROM requests WHERE id = ?', [request_id]);
        if (reqs.length === 0 || reqs[0].status !== 'pending') {
            await conn.rollback();
            await conn.end();
            return res.status(400).json({ detail: 'Μη έγκυρο αίτημα.' });
        }
        
        const { post_id, consumer_id } = reqs[0];

        if (status === 'approved') {
            // Decrement available portions
            const [posts] = await conn.execute('SELECT available_portions FROM posts WHERE id = ?', [post_id]);
            if (posts[0].available_portions < 1) {
                await conn.rollback();
                await conn.end();
                return res.status(400).json({ detail: 'Δεν υπάρχουν πλέον διαθέσιμες μερίδες.' });
            }
            await conn.execute('UPDATE posts SET available_portions = available_portions - 1 WHERE id = ?', [post_id]);
            await conn.execute('UPDATE requests SET status = ? WHERE id = ?', ['approved', request_id]);
        } else if (status === 'rejected') {
            // Refund 1 credit to consumer
            await conn.execute('UPDATE users SET credits = credits + 1 WHERE id = ?', [consumer_id]);
            await conn.execute('UPDATE requests SET status = ? WHERE id = ?', ['rejected', request_id]);
        }

        await conn.commit();
        await conn.end();
        res.json({ status: 'success' });
    } catch (error) {
        if (conn) try { await conn.rollback(); await conn.end(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Cook marks as received OR no-show
app.post('/api/requests/:id/completion', async (req, res) => {
    let conn;
    try {
        const request_id = req.params.id;
        const { status } = req.body; // 'received' or 'no_show'
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();
        const [reqs] = await conn.execute('SELECT consumer_id FROM requests WHERE id = ?', [request_id]);
        const consumer_id = reqs[0].consumer_id;

        await conn.execute('UPDATE requests SET status = ? WHERE id = ?', [status, request_id]);

        if (status === 'no_show') {
            // Penalty: Deduct 1 additional credit
            await conn.execute('UPDATE users SET credits = credits - 1 WHERE id = ?', [consumer_id]);
        }

        await conn.commit();
        await conn.end();
        res.json({ status: 'success' });
    } catch (error) {
        if (conn) try { await conn.rollback(); await conn.end(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});


// ==========================================
// 5. REVIEWS & CREDITS
// ==========================================

app.post('/api/reviews', async (req, res) => {
    let conn;
    try {
        const { request_id, consumer_id, cook_id, rating } = req.body;
        conn = await mysql.createConnection(dbConfig);

        await conn.beginTransaction();
        
        await conn.execute(
            'INSERT INTO reviews (request_id, consumer_id, cook_id, rating) VALUES (?, ?, ?, ?)',
            [request_id, consumer_id, cook_id, rating]
        );

        // Add credits to cook
        const creditsEarned = rating > 3 ? 2 : 1;
        await conn.execute('UPDATE users SET credits = credits + ? WHERE id = ?', [creditsEarned, cook_id]);

        await conn.commit();
        await conn.end();
        
        res.json({ status: 'success', message: 'Η αξιολόγηση αποθηκεύτηκε επιτυχώς!' });
    } catch (error) {
        if (conn) try { await conn.rollback(); await conn.end(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});


// ==========================================
// 6. ADMIN DASHBOARD STATS
// ==========================================

app.get('/api/admin/stats', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        
        // 1. Total received portions in the last 30 days
        const [received] = await conn.execute(`
            SELECT COUNT(*) as count FROM requests 
            WHERE status = 'received' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        // 2. Top Donor Leaderboard
        const [leaderboard] = await conn.execute(`
            SELECT u.username, COUNT(r.id) as portions_shared, AVG(rev.rating) as avg_rating
            FROM users u
            JOIN posts p ON u.id = p.cook_id
            JOIN requests r ON p.id = r.post_id AND r.status = 'received'
            LEFT JOIN reviews rev ON u.id = rev.cook_id
            GROUP BY u.id
            ORDER BY portions_shared DESC
            LIMIT 10
        `);

        await conn.end();
        res.json({
            total_portions_last_month: received[0].count,
            leaderboard: leaderboard
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// ==========================================
// 7. RAW DATABASE VIEWER (DEV)
// ==========================================

app.get('/api/db-users', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute('SELECT * FROM users');
        await conn.end();
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.get('/api/db-posts', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute('SELECT * FROM posts');
        await conn.end();
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.get('/api/db-requests', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute('SELECT * FROM requests');
        await conn.end();
        res.json(rows);
    } catch (e) { res.json([]); }
});

// Εκκίνηση Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`UniBite Server is running on http://localhost:${PORT}`);
});