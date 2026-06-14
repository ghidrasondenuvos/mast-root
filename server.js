const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const pool = require('./config/db');

// Multer config for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Μόνο εικόνες επιτρέπονται.'), false);
    }
});

const app = express();

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'unibite-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// MIDDLEWARE
// ==========================================

function authenticate(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ detail: 'Μη εξουσιοδοτημένη πρόσβαση. Παρακαλώ συνδεθείτε.' });
    }
    req.userId = req.session.userId;
    req.userRole = req.session.userRole;
    next();
}

function requireAdmin(req, res, next) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ detail: 'Δεν έχετε δικαιώματα διαχειριστή.' });
    }
    next();
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function createNotification(connOrPool, userId, type, message, referenceId = null) {
    await connOrPool.execute(
        'INSERT INTO notifications (user_id, type, message, reference_id) VALUES (?, ?, ?, ?)',
        [userId, type, message, referenceId]
    );
}

async function logCreditTransaction(connOrPool, userId, amount, type, description) {
    await connOrPool.execute(
        'INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [userId, amount, type, description]
    );
}

// ==========================================
// 1. AUTH & USERS (Student & Admin)
// ==========================================

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ detail: 'Email και κωδικός είναι υποχρεωτικά.' });
        }

        const [users] = await pool.execute(
            'SELECT id, username, email, password, role, credits, phone, address FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ detail: 'Το email δεν υπάρχει.' });
        }

        const user = users[0];

        // Support both bcrypt and legacy plaintext passwords
        let passwordMatch = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            passwordMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plaintext fallback (for existing accounts)
            passwordMatch = (password === user.password);
        }

        if (!passwordMatch) {
            return res.status(401).json({ detail: 'Λάθος κωδικός πρόσβασης.' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        res.json({
            status: 'success',
            user: { id: user.id, username: user.username, email: user.email, role: user.role, credits: user.credits, phone: user.phone, address: user.address }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα βάσης δεδομένων.' });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ status: 'success' });
});

app.post('/register', async (req, res) => {
    let conn;
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({ detail: 'Όλα τα πεδία είναι υποχρεωτικά.' });
        }
        if (username.length > 100) {
            return res.status(400).json({ detail: 'Το username είναι πολύ μεγάλο (max 100 χαρακτήρες).' });
        }
        if (password.length < 4) {
            return res.status(400).json({ detail: 'Ο κωδικός πρέπει να έχει τουλάχιστον 4 χαρακτήρες.' });
        }

        conn = await pool.getConnection();

        const [existingUser] = await conn.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ detail: 'Το username ή το email χρησιμοποιείται ήδη.' });
        }

        await conn.beginTransaction();

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await conn.execute(
            'INSERT INTO users (username, email, password, role, credits) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 'student', 5]
        );

        const newUserId = result.insertId;

        await logCreditTransaction(conn, newUserId, 5, 'welcome', 'Δώρο καλωσορίσματος - 5 credits');
        await createNotification(conn, newUserId, 'welcome', 'Καλώς ήρθατε στο UniBite! Λάβατε 5 credits ως δώρο καλωσορίσματος.');

        await conn.commit();

        res.json({ status: 'success', message: 'Η εγγραφή ολοκληρώθηκε! Έχετε λάβει 5 credits ως δώρο καλωσορίσματος.' });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την εγγραφή.' });
    } finally {
        if (conn) conn.release();
    }
});

// Get user profile (credits etc)
app.get('/api/users/:id', async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, username, email, phone, address, role, credits FROM users WHERE id = ?', [req.params.id]);
        if (users.length > 0) res.json(users[0]);
        else res.status(404).json({ detail: 'Δεν βρέθηκε χρήστης.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα βάσης δεδομένων.' });
    }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const { username, email, phone, address } = req.body;
        const userId = req.params.id;

        // Check uniqueness
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, userId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ detail: 'Το username ή το email χρησιμοποιείται ήδη.' });
        }

        await pool.execute('UPDATE users SET username = ?, email = ?, phone = ?, address = ? WHERE id = ?', [username, email, phone, address, userId]);

        const [users] = await pool.execute('SELECT id, username, email, phone, address, role, credits FROM users WHERE id = ?', [userId]);
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ενημέρωσης χρήστη.' });
    }
});

// Get user statistics
app.get('/api/users/:id/stats', async (req, res) => {
    try {
        const userId = req.params.id;

        const [sharedRows] = await pool.execute(
            `SELECT COUNT(*) as total_portions_shared FROM requests r
             JOIN posts p ON r.post_id = p.id
             WHERE p.cook_id = ? AND r.status = 'delivered'`,
            [userId]
        );

        const [receivedRows] = await pool.execute(
            `SELECT COUNT(*) as total_portions_received FROM requests
             WHERE consumer_id = ? AND status = 'delivered'`,
            [userId]
        );

        const [avgCookRating] = await pool.execute(
            'SELECT AVG(rating) as avg_rating_as_cook FROM reviews WHERE cook_id = ?',
            [userId]
        );

        const [avgGivenRating] = await pool.execute(
            'SELECT AVG(rating) as avg_rating_given FROM reviews WHERE consumer_id = ?',
            [userId]
        );

        const [postCount] = await pool.execute(
            'SELECT COUNT(*) as total_posts FROM posts WHERE cook_id = ?',
            [userId]
        );

        res.json({
            total_portions_shared: sharedRows[0].total_portions_shared,
            total_portions_received: receivedRows[0].total_portions_received,
            avg_rating_as_cook: avgCookRating[0].avg_rating_as_cook,
            avg_rating_given: avgGivenRating[0].avg_rating_given,
            total_posts: postCount[0].total_posts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ανάκτησης στατιστικών χρήστη.' });
    }
});


// ==========================================
// 2. COOK: POSTS (ΑΓΓΕΛΙΕΣ CRUD)
// ==========================================

// Create a new post
app.post('/api/posts', authenticate, async (req, res) => {
    try {
        const { cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({ detail: 'Ο τίτλος είναι υποχρεωτικός.' });
        }
        if (!total_portions || total_portions <= 0) {
            return res.status(400).json({ detail: 'Ο αριθμός μερίδων πρέπει να είναι μεγαλύτερος από 0.' });
        }

        await pool.execute(`
            INSERT INTO posts (cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions, available_portions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions, total_portions]);

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

        const [posts] = await pool.execute(query, params);

        // Dynamic status calculation for the feed: grey out if portions = 0
        posts.forEach(post => {
            if (post.available_portions <= 0) post.status = 'inactive';
        });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ανάκτησης αγγελιών.' });
    }
});

// Search posts
app.get('/api/posts/search', async (req, res) => {
    try {
        const { q, allergens, sort } = req.query;

        let query = `
            SELECT p.*, u.username as cook_name 
            FROM posts p 
            JOIN users u ON p.cook_id = u.id 
            WHERE p.status = 'active' AND TIMESTAMPDIFF(HOUR, p.created_at, NOW()) <= 48
        `;
        const params = [];

        if (q) {
            query += " AND p.title LIKE ?";
            params.push(`%${q}%`);
        }

        if (allergens) {
            const allergenList = allergens.split(',').map(a => a.trim()).filter(a => a);
            for (const allergen of allergenList) {
                query += " AND (p.allergens IS NULL OR p.allergens NOT LIKE ?)";
                params.push(`%${allergen}%`);
            }
        }

        if (sort === 'pickup_time') {
            query += " ORDER BY p.pickup_time ASC";
        } else if (sort === 'portions') {
            query += " ORDER BY p.available_portions DESC";
        } else {
            // default: newest
            query += " ORDER BY p.created_at DESC";
        }

        const [posts] = await pool.execute(query, params);

        posts.forEach(post => {
            if (post.available_portions <= 0) post.status = 'inactive';
        });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα αναζήτησης αγγελιών.' });
    }
});

// Update Post
app.put('/api/posts/:id', authenticate, async (req, res) => {
    try {
        const { title, notes, allergens, pickup_location, pickup_time, available_portions } = req.body;
        await pool.execute(`
            UPDATE posts SET title=?, notes=?, allergens=?, pickup_location=?, pickup_time=?, available_portions=? WHERE id=?
        `, [title, notes, allergens, pickup_location, pickup_time, available_portions, req.params.id]);
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Delete Post (Soft Delete)
app.delete('/api/posts/:id', authenticate, async (req, res) => {
    try {
        await pool.execute("UPDATE posts SET status='deleted' WHERE id=?", [req.params.id]);
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
        conn = await pool.getConnection();

        // 1. Check if user has credits
        const [users] = await conn.execute('SELECT credits FROM users WHERE id = ?', [consumer_id]);
        if (users[0].credits < 1) {
            return res.status(400).json({ detail: 'Δεν έχετε αρκετούς πόντους (credits) για να ζητήσετε μερίδα.' });
        }

        // 2. Lock and check post availability
        const [posts] = await conn.execute('SELECT available_portions, cook_id FROM posts WHERE id = ? FOR UPDATE', [post_id]);
        if (posts[0].available_portions < 1) {
            return res.status(400).json({ detail: 'Οι μερίδες για αυτή την αγγελία εξαντλήθηκαν.' });
        }

        // Check if user is requesting their own food
        if (posts[0].cook_id === consumer_id) {
            return res.status(400).json({ detail: 'Δεν μπορείτε να ζητήσετε το δικό σας φαγητό.' });
        }

        // Check for existing pending request for same consumer+post
        const [existingReqs] = await conn.execute(
            "SELECT id FROM requests WHERE consumer_id = ? AND post_id = ? AND status = 'pending'",
            [consumer_id, post_id]
        );
        if (existingReqs.length > 0) {
            return res.status(400).json({ detail: 'Έχετε ήδη ένα αίτημα σε εκκρεμότητα για αυτή την αγγελία.' });
        }

        await conn.beginTransaction();

        // Deduct 1 credit immediately
        await conn.execute('UPDATE users SET credits = credits - 1 WHERE id = ?', [consumer_id]);

        // Insert request
        const [result] = await conn.execute('INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, ?)', [post_id, consumer_id, 'pending']);

        // Log credit transaction
        await logCreditTransaction(conn, consumer_id, -1, 'spent', 'Αίτημα μερίδας');

        // Notify cook about new request
        await createNotification(conn, posts[0].cook_id, 'new_request', 'Νέο αίτημα μερίδας!', result.insertId);

        await conn.commit();

        res.json({ status: 'success', message: 'Το αίτημα στάλθηκε στον μάγειρα!' });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    } finally {
        if (conn) conn.release();
    }
});

// Get requests for a Cook's posts
app.get('/api/cook-requests/:cook_id', async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT r.id, r.status, r.created_at, p.title as post_title, u.username as consumer_name, r.consumer_id
            FROM requests r
            JOIN posts p ON r.post_id = p.id
            JOIN users u ON r.consumer_id = u.id
            WHERE p.cook_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.cook_id]);
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Get requests made by a Consumer
app.get('/api/consumer-requests/:consumer_id', async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT r.id, r.status, r.created_at, p.title as post_title, u.username as cook_name, p.cook_id
            FROM requests r
            JOIN posts p ON r.post_id = p.id
            JOIN users u ON p.cook_id = u.id
            WHERE r.consumer_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.consumer_id]);
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
        conn = await pool.getConnection();

        await conn.beginTransaction();

        const [reqs] = await conn.execute('SELECT post_id, consumer_id, status FROM requests WHERE id = ? FOR UPDATE', [request_id]);
        if (reqs.length === 0 || reqs[0].status !== 'pending') {
            await conn.rollback();
            return res.status(400).json({ detail: 'Μη έγκυρο αίτημα.' });
        }

        const { post_id, consumer_id } = reqs[0];

        if (status === 'approved') {
            // Lock and check post portions
            const [posts] = await conn.execute('SELECT available_portions FROM posts WHERE id = ? FOR UPDATE', [post_id]);
            if (posts[0].available_portions < 1) {
                await conn.rollback();
                return res.status(400).json({ detail: 'Δεν υπάρχουν πλέον διαθέσιμες μερίδες.' });
            }
            await conn.execute('UPDATE posts SET available_portions = available_portions - 1 WHERE id = ?', [post_id]);
            await conn.execute('UPDATE requests SET status = ? WHERE id = ?', ['approved', request_id]);

            // Notify consumer about approval
            await createNotification(conn, consumer_id, 'request_approved', 'Το αίτημά σας εγκρίθηκε!', parseInt(request_id));
        } else if (status === 'rejected') {
            // Refund 1 credit to consumer
            await conn.execute('UPDATE users SET credits = credits + 1 WHERE id = ?', [consumer_id]);
            await conn.execute('UPDATE requests SET status = ? WHERE id = ?', ['rejected', request_id]);

            // Log credit refund transaction
            await logCreditTransaction(conn, consumer_id, 1, 'bonus', 'Επιστροφή credit - αίτημα απορρίφθηκε');

            // Notify consumer about rejection
            await createNotification(conn, consumer_id, 'request_rejected', 'Το αίτημά σας απορρίφθηκε. Το credit σας επιστράφηκε.', parseInt(request_id));
        }

        await conn.commit();
        res.json({ status: 'success' });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    } finally {
        if (conn) conn.release();
    }
});

// Cook or Consumer marks as delivered OR no-show
app.post('/api/requests/:id/completion', async (req, res) => {
    let conn;
    try {
        const request_id = req.params.id;
        const { status } = req.body; // 'delivered' or 'no_show'
        conn = await pool.getConnection();

        await conn.beginTransaction();
        const [reqs] = await conn.execute('SELECT consumer_id FROM requests WHERE id = ?', [request_id]);
        const consumer_id = reqs[0].consumer_id;

        await conn.execute('UPDATE requests SET status = ? WHERE id = ?', [status, request_id]);

        if (status === 'no_show') {
            // Penalty: Deduct 1 additional credit (but prevent going below 0)
            const [creditCheck] = await conn.execute('SELECT credits FROM users WHERE id = ?', [consumer_id]);
            if (creditCheck[0].credits > 0) {
                await conn.execute('UPDATE users SET credits = credits - 1 WHERE id = ?', [consumer_id]);
            }

            // Log penalty transaction
            await logCreditTransaction(conn, consumer_id, -1, 'penalty', 'Ποινή - μη εμφάνιση για παραλαβή');

            // Notify consumer about no-show penalty
            await createNotification(conn, consumer_id, 'no_show', 'Δεν εμφανιστήκατε για παραλαβή. Αφαιρέθηκε 1 credit ως ποινή.', parseInt(request_id));
        } else if (status === 'delivered') {
            // Notify consumer about successful receipt
            await createNotification(conn, consumer_id, 'delivered', 'Η παραλαβή σας ολοκληρώθηκε! Καλή όρεξη!', parseInt(request_id));
        }

        await conn.commit();
        res.json({ status: 'success' });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    } finally {
        if (conn) conn.release();
    }
});


// ==========================================
// 5. REVIEWS & CREDITS
// ==========================================

// Get pending reviews for a user (delivered but not yet reviewed)
app.get('/api/pending-reviews/:user_id', authenticate, async (req, res) => {
    try {
        const userId = req.params.user_id;
        const [rows] = await pool.execute(`
            SELECT r.id, r.post_id, p.title as post_title, p.cook_id, u.username as cook_name, r.consumer_id, c.username as consumer_name
            FROM requests r
            JOIN posts p ON r.post_id = p.id
            JOIN users u ON p.cook_id = u.id
            JOIN users c ON r.consumer_id = c.id
            WHERE (r.consumer_id = ? OR p.cook_id = ?) AND r.status = 'delivered'
            AND r.id NOT IN (SELECT request_id FROM reviews WHERE reviewer_id = ?)
        `, [userId, userId, userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Upload image endpoint
app.post('/api/upload', authenticate, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ detail: 'Δεν επιλέχτηκε αρχείο.' });
    res.json({ url: '/uploads/' + req.file.filename });
});

app.post('/api/reviews', authenticate, async (req, res) => {
    let conn;
    try {
        const { request_id, reviewer_id, consumer_id, cook_id, rating, comment } = req.body;
        conn = await pool.getConnection();

        // Check for duplicate review by this reviewer
        const [existingReview] = await conn.execute('SELECT id FROM reviews WHERE request_id = ? AND reviewer_id = ?', [request_id, reviewer_id]);
        if (existingReview.length > 0) {
            return res.status(400).json({ detail: 'Έχετε ήδη αξιολογήσει αυτή τη συναλλαγή.' });
        }

        await conn.beginTransaction();

        await conn.execute(
            'INSERT INTO reviews (request_id, reviewer_id, consumer_id, cook_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [request_id, reviewer_id, consumer_id, cook_id, rating, comment || null]
        );

        if (reviewer_id == consumer_id) {
            // Add credits to cook
            const creditsEarned = rating > 3 ? 2 : 1;
            await conn.execute('UPDATE users SET credits = credits + ? WHERE id = ?', [creditsEarned, cook_id]);

            // Log credit transaction for cook
            await logCreditTransaction(conn, cook_id, creditsEarned, 'earned', `Κέρδος credits από αξιολόγηση (${rating}/5)`);

            // Notify cook about earned credits
            await createNotification(conn, cook_id, 'credit_earned', `Κερδίσατε ${creditsEarned} credit(s) από αξιολόγηση!`, parseInt(request_id));
        }

        await conn.commit();

        res.json({ status: 'success', message: 'Η αξιολόγηση αποθηκεύτηκε επιτυχώς!' });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    } finally {
        if (conn) conn.release();
    }
});


// ==========================================
// 6. NOTIFICATIONS
// ==========================================

// Get all notifications for a user
app.get('/api/notifications/:user_id', async (req, res) => {
    try {
        const [notifications] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.params.user_id]
        );
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ανάκτησης ειδοποιήσεων.' });
    }
});

// Get unread notification count
app.get('/api/notifications/:user_id/unread-count', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.params.user_id]
        );
        res.json({ count: rows[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Mark a notification as read
app.post('/api/notifications/:id/read', async (req, res) => {
    try {
        await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Mark all notifications as read for a user
app.post('/api/notifications/read-all/:user_id', async (req, res) => {
    try {
        await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.params.user_id]);
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});


// ==========================================
// 7. CREDIT HISTORY
// ==========================================

app.get('/api/credit-history/:user_id', async (req, res) => {
    try {
        const [transactions] = await pool.execute(
            'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC',
            [req.params.user_id]
        );
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ανάκτησης ιστορικού credits.' });
    }
});

// Buy Credits
app.post('/api/buy-credits', async (req, res) => {
    let conn;
    try {
        const { user_id, amount, money_paid } = req.body;
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.execute('UPDATE users SET credits = credits + ? WHERE id = ?', [amount, user_id]);
        
        await logCreditTransaction(conn, user_id, amount, 'earned', `Αγορά ${amount} credits (Πληρωμή: ${money_paid}€)`);
        await createNotification(conn, user_id, 'credit_earned', `Η πληρωμή ολοκληρώθηκε. Αγοράσατε ${amount} credits!`);

        await conn.commit();
        res.json({ status: 'success', message: `Αγοράστηκαν ${amount} credits επιτυχώς!` });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την αγορά.' });
    } finally {
        if (conn) conn.release();
    }
});


// ==========================================
// 8. ADMIN DASHBOARD STATS
// ==========================================

app.get('/api/admin/stats', authenticate, requireAdmin, async (req, res) => {
    try {
        // 1. Total received portions in the last 30 days
        const [received] = await pool.execute(`
            SELECT COUNT(*) as count FROM requests 
            WHERE status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        // 2. Top Donor Leaderboard
        const [leaderboard] = await pool.execute(`
            SELECT u.username, COUNT(r.id) as portions_shared, AVG(rev.rating) as avg_rating
            FROM users u
            JOIN posts p ON u.id = p.cook_id
            JOIN requests r ON p.id = r.post_id AND r.status = 'delivered'
            LEFT JOIN reviews rev ON u.id = rev.cook_id AND rev.reviewer_id = r.consumer_id
            GROUP BY u.id
            ORDER BY portions_shared DESC
            LIMIT 10
        `);

        res.json({
            total_portions_last_month: received[0].count,
            leaderboard: leaderboard
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα.' });
    }
});

// Get all users (admin)
app.get('/api/admin/all-users', authenticate, requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, username, email, role, credits, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ανάκτησης χρηστών.' });
    }
});

// Admin adjust user credits
app.put('/api/admin/users/:id/credits', authenticate, requireAdmin, async (req, res) => {
    let conn;
    try {
        const userId = req.params.id;
        const { credits_change, reason } = req.body;
        conn = await pool.getConnection();

        await conn.beginTransaction();

        await conn.execute('UPDATE users SET credits = credits + ? WHERE id = ?', [credits_change, userId]);

        const txType = credits_change >= 0 ? 'bonus' : 'penalty';
        await logCreditTransaction(conn, userId, credits_change, txType, reason || 'Διαχειριστική αλλαγή credits');

        await conn.commit();

        const [users] = await pool.execute('SELECT id, username, email, role, credits FROM users WHERE id = ?', [userId]);
        res.json(users[0]);
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα ενημέρωσης credits.' });
    } finally {
        if (conn) conn.release();
    }
});

// Admin edit user details
app.put('/api/admin/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, role } = req.body;

        // Failsafe: basic empty string validation
        if (!username || !username.trim()) return res.status(400).json({ detail: 'Το όνομα χρήστη δεν μπορεί να είναι κενό.' });
        if (!email || !email.trim()) return res.status(400).json({ detail: 'Το email δεν μπορεί να είναι κενό.' });
        if (!role || !['student', 'admin'].includes(role)) return res.status(400).json({ detail: 'Μη έγκυρος ρόλος.' });

        await pool.execute(
            'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
            [username.trim(), email.trim(), role, userId]
        );

        const [users] = await pool.execute('SELECT id, username, email, role, credits FROM users WHERE id = ?', [userId]);
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ detail: 'Το username ή το email χρησιμοποιείται ήδη.' });
        }
        res.status(500).json({ detail: 'Σφάλμα ενημέρωσης χρήστη.' });
    }
});


// ==========================================
// 9. RAW DATABASE VIEWER (DEV)
// ==========================================

app.get('/api/db-users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users');
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.get('/api/db-posts', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM posts');
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.get('/api/db-requests', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM requests');
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.get('/api/db-reviews', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM reviews');
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.put('/api/db-edit/:table/:id', async (req, res) => {
    // In a real app this should be heavily protected (e.g. authenticate, requireAdmin). 
    // Since it's a generic DB editor for the project, we'll allow it based on the prompt.
    try {
        const table = req.params.table;
        const id = req.params.id;
        const updates = req.body;

        // Failsafe: No empty values
        for (const [key, value] of Object.entries(updates)) {
            if (value === '' || value === null || value === undefined) {
                return res.status(400).json({ detail: `Το πεδίο ${key} δεν μπορεί να είναι κενό.` });
            }
        }

        const allowedTables = ['users', 'posts', 'requests', 'reviews'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ detail: 'Μη επιτρεπτός πίνακας.' });
        }

        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return res.status(400).json({ detail: 'Δεν δόθηκαν δεδομένα για ενημέρωση.' });
        }

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => updates[f]);
        values.push(id);

        await pool.execute(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
        
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά την ενημέρωση της βάσης.' });
    }
});

app.put('/api/db-edit-batch/:table', async (req, res) => {
    let conn;
    try {
        const table = req.params.table;
        const rows = req.body; // Array of { id, ...updates }

        if (!Array.isArray(rows)) {
            return res.status(400).json({ detail: 'Τα δεδομένα πρέπει να είναι λίστα (array).' });
        }

        const allowedTables = ['users', 'posts', 'requests', 'reviews'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ detail: 'Μη επιτρεπτός πίνακας.' });
        }

        // Failsafe: Validate all rows before starting transaction
        for (const row of rows) {
            const updates = { ...row };
            delete updates.id;
            for (const [key, value] of Object.entries(updates)) {
                if (value === '' || value === null || value === undefined) {
                    return res.status(400).json({ detail: `Σφάλμα στη γραμμή ID=${row.id}: Το πεδίο ${key} δεν μπορεί να είναι κενό.` });
                }
            }
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        for (const row of rows) {
            const id = row.id;
            const updates = { ...row };
            delete updates.id;

            const fields = Object.keys(updates);
            if (fields.length > 0) {
                const setClause = fields.map(f => `${f} = ?`).join(', ');
                const values = fields.map(f => updates[f]);
                values.push(id);
                await conn.execute(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
            }
        }

        await conn.commit();
        res.json({ status: 'success' });
    } catch (error) {
        if (conn) try { await conn.rollback(); } catch(e) {}
        console.error(error);
        res.status(500).json({ detail: 'Σφάλμα κατά τη μαζική ενημέρωση της βάσης.' });
    } finally {
        if (conn) conn.release();
    }
});

// ==========================================
// BACKGROUND TASKS (CRON)
// ==========================================
async function runBackgroundTasks() {
    try {
        // 1. Mark posts older than 48h as deleted
        await pool.execute("UPDATE posts SET status='deleted' WHERE status != 'deleted' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 48");
        
        // 2. Penalize consumers for missing reviews after 48h
        // We find requests that are 'delivered' and have no review after 48h
        const [requests] = await pool.execute(`
            SELECT r.id, r.consumer_id 
            FROM requests r
            WHERE r.status = 'delivered' 
            AND TIMESTAMPDIFF(HOUR, r.updated_at, NOW()) >= 48
            AND NOT EXISTS (SELECT 1 FROM reviews rev WHERE rev.request_id = r.id AND rev.reviewer_id = r.consumer_id)
            AND NOT EXISTS (SELECT 1 FROM credit_transactions ct WHERE ct.user_id = r.consumer_id AND ct.description LIKE CONCAT('%Req:', r.id, '%'))
        `);

        for (const req of requests) {
            const [creditCheck] = await pool.execute('SELECT credits FROM users WHERE id = ?', [req.consumer_id]);
            // Allow credits to go negative or deduct down to 0, depending on design. Here we deduct anyway to penalize.
            await pool.execute('UPDATE users SET credits = credits - 1 WHERE id = ?', [req.consumer_id]);
            
            // Log credit transaction with specific description to avoid duplicate penalty
            await logCreditTransaction(pool, req.consumer_id, -1, 'penalty', `Ποινή 48h μη-αξιολόγησης (Req:${req.id})`);
            
            // Notify user (using existing 'welcome' or generic info type, actually 'welcome' acts as a generic alert if others fail, but 'no_show' is also a penalty type)
            await createNotification(pool, req.consumer_id, 'no_show', 'Σου αφαιρέθηκε 1 credit λόγω μη αξιολόγησης γεύματος εντός 48 ωρών από την παραλαβή.', req.id);
        }
    } catch (e) {
        console.error('Background tasks error:', e);
    }
}

// Run every 10 minutes
setInterval(runBackgroundTasks, 10 * 60 * 1000);
// Run once on startup
setTimeout(runBackgroundTasks, 5000);

// Εκκίνηση Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`UniBite Server is running on http://localhost:${PORT}`);
});