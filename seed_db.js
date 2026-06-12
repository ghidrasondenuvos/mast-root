const mysql = require('mysql2/promise');

async function seed() {
    let conn;
    try {
        console.log('Connecting to database...');
        conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'unibite_db'
        });

        console.log('Inserting users...');
        const users = [
            ['giorgos', 'giorgos@uni.gr', 'pass123', 'student', 15],
            ['maria', 'maria@uni.gr', 'pass123', 'student', 22],
            ['kostas', 'kostas@uni.gr', 'pass123', 'student', 8],
            ['eleni', 'eleni@uni.gr', 'pass123', 'student', 12],
            ['nikos', 'nikos@uni.gr', 'pass123', 'student', 5],
            ['dtsan4', 'dtsan4@gmail.com', 'vash', 'student', 20]
        ];
        
        const userIds = {};
        for (const u of users) {
            const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [u[1]]);
            if (existing.length > 0) {
                userIds[u[0]] = existing[0].id;
            } else {
                const [res] = await conn.execute('INSERT INTO users (username, email, password, role, credits) VALUES (?, ?, ?, ?, ?)', u);
                userIds[u[0]] = res.insertId;
                await conn.execute("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'welcome', 'Δώρο καλωσορίσματος')", [res.insertId, u[4] >= 20 ? 20 : 5]);
                await conn.execute("INSERT INTO notifications (user_id, type, message) VALUES (?, 'welcome', 'Καλώς ήρθατε στο UniBite!')", [res.insertId]);
            }
        }

        console.log('Inserting posts...');
        const posts = [
            { cook_id: userIds['maria'], title: 'Μουσακάς Παραδοσιακός', photo: '🍆', notes: 'Συνταγή της γιαγιάς! Πολύ μεγάλη μερίδα. Με πλούσια μπεσαμέλ.', allergens: 'Γλουτένη, Γαλακτοκομικά', portions: 4, avail: 2 },
            { cook_id: userIds['kostas'], title: 'Γεμιστά (Ορφανά)', photo: '🍅', notes: 'Με ρύζι και μπόλικα μυρωδικά. Χωρίς κιμά (Vegan φιλικά).', allergens: '', portions: 6, avail: 4 },
            { cook_id: userIds['giorgos'], title: 'Σουφλέ Ζυμαρικών', photo: '🧀', notes: 'Γεμάτο τυριά και μπέικον, ψημένο στον φούρνο μέχρι να κάνει κρούστα.', allergens: 'Γλουτένη, Γαλακτοκομικά', portions: 3, avail: 1 },
            { cook_id: userIds['eleni'], title: 'Φακές Σούπα', photo: '🥣', notes: 'Ζεστή και θρεπτική φακόσουπα με καρότο και σκόρδο.', allergens: '', portions: 5, avail: 5 },
            { cook_id: userIds['maria'], title: 'Χοιρινό Λεμονάτο με Ρύζι', photo: '🍛', notes: 'Κρέας που λιώνει στο στόμα. Συνοδεύεται με μπασμάτι.', allergens: '', portions: 3, avail: 3 },
            { cook_id: userIds['nikos'], title: 'Σπανακόπιτα Σπιτική', photo: '🥧', notes: 'Με χειροποίητο φύλλο και μπόλικη φέτα. Μου βγήκε τεράστιο το ταψί!', allergens: 'Γλουτένη, Γαλακτοκομικά', portions: 8, avail: 5 }
        ];

        const postIds = {};
        for (let i = 0; i < posts.length; i++) {
            const p = posts[i];
            const [res] = await conn.execute(
                `INSERT INTO posts (cook_id, title, photo_url, notes, allergens, pickup_location, latitude, longitude, pickup_time, total_portions, available_portions, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
                [p.cook_id, p.title, p.photo, p.notes, p.allergens, 'Εστία Σχολής', 38.0, 23.0, 'Σήμερα στις 15:00-16:00', p.portions, p.avail, i * 3]
            );
            postIds[p.title] = res.insertId;
        }

        console.log('Inserting requests and reviews...');
        
        let [req1] = await conn.execute("INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, 'received')", [postIds['Μουσακάς Παραδοσιακός'], userIds['giorgos']]);
        await conn.execute("INSERT INTO reviews (request_id, consumer_id, cook_id, rating, comment) VALUES (?, ?, ?, 5, 'Απλά απίστευτος μουσακάς, σαν της μαμάς μου!')", [req1.insertId, userIds['giorgos'], userIds['maria']]);
        await conn.execute("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'spent', 'Αίτημα μερίδας: Μουσακάς')", [userIds['giorgos'], -1]);
        await conn.execute("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'earned', 'Αξιολόγηση 5/5 για Μουσακά')", [userIds['maria'], 2]);
        await conn.execute("INSERT INTO notifications (user_id, type, message) VALUES (?, 'received', 'Η παραλαβή ολοκληρώθηκε')", [userIds['giorgos']]);

        let [req2] = await conn.execute("INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, 'received')", [postIds['Σουφλέ Ζυμαρικών'], userIds['eleni']]);
        await conn.execute("INSERT INTO reviews (request_id, consumer_id, cook_id, rating, comment) VALUES (?, ?, ?, 4, 'Πολύ νόστιμο και ζεστό, ευχαριστώ!')", [req2.insertId, userIds['eleni'], userIds['giorgos']]);
        await conn.execute("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'spent', 'Αίτημα μερίδας: Σουφλέ')", [userIds['eleni'], -1]);
        await conn.execute("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'earned', 'Αξιολόγηση 4/5 για Σουφλέ')", [userIds['giorgos'], 2]);

        await conn.execute("INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, 'pending')", [postIds['Γεμιστά (Ορφανά)'], userIds['dtsan4']]);
        await conn.execute("INSERT INTO notifications (user_id, type, message) VALUES (?, 'new_request', 'Νέο αίτημα από dtsan4 για Γεμιστά!')", [userIds['kostas']]);

        await conn.execute("INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, 'approved')", [postIds['Σπανακόπιτα Σπιτική'], userIds['maria']]);
        await conn.execute("INSERT INTO notifications (user_id, type, message) VALUES (?, 'request_approved', 'Το αίτημά σας για Σπανακόπιτα εγκρίθηκε! Μπορείτε να παραλάβετε.')", [userIds['maria']]);

        await conn.execute("INSERT INTO requests (post_id, consumer_id, status) VALUES (?, ?, 'rejected')", [postIds['Σουφλέ Ζυμαρικών'], userIds['nikos']]);
        await conn.execute("INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'bonus', 'Επιστροφή credit - Αίτημα απορρίφθηκε (Σουφλέ)')", [userIds['nikos'], 1]);

        console.log('Database seeded successfully!');
    } catch (e) {
        console.error('Error seeding DB:', e);
    } finally {
        if (conn) await conn.end();
    }
}

seed();
