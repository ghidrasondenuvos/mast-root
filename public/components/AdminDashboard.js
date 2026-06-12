import { showToast } from '../app.js';

export function renderAdminDashboard(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 1000px; margin: 0 auto; padding: 20px; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: #ff4d4d; margin-bottom: 20px;">🛠️ Admin Dashboard</h2>
        
        <div class="admin-stat-grid" id="admin-stats-container">
            <div class="admin-stat-card skeleton" style="height: 100px;"></div>
            <div class="admin-stat-card skeleton" style="height: 100px;"></div>
            <div class="admin-stat-card skeleton" style="height: 100px;"></div>
        </div>

        <div class="section-panel" style="margin-bottom: 20px;">
            <h3 class="section-title" style="color: #fff;">🏆 Leaderboard (Top Donors)</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; color: #ccc; font-family: var(--font-mono); font-size: 0.9rem;" id="admin-leaderboard">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); text-align: left;">
                            <th style="padding: 10px;">Μάγειρας</th>
                            <th style="padding: 10px;">Μερίδες που μοίρασε</th>
                            <th style="padding: 10px;">Μέση Αξιολόγηση</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="3" style="text-align: center; padding: 20px;">Φόρτωση...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section-panel">
            <h3 class="section-title" style="color: #fff;">👥 Διαχείριση Χρηστών</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; color: #ccc; font-family: var(--font-mono); font-size: 0.9rem;" id="admin-users-table">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); text-align: left;">
                            <th style="padding: 10px;">ID</th>
                            <th style="padding: 10px;">Username</th>
                            <th style="padding: 10px;">Email</th>
                            <th style="padding: 10px;">Role</th>
                            <th style="padding: 10px;">Credits</th>
                            <th style="padding: 10px;">Ενέργεια</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6" style="text-align: center; padding: 20px;">Φόρτωση...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch Stats & Leaderboard
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            // Need total users and total posts too, let's fetch them
            Promise.all([
                fetch('/api/admin/all-users').then(res => res.json()),
                fetch('/api/posts').then(res => res.json())
            ]).then(([users, posts]) => {
                const statsContainer = container.querySelector('#admin-stats-container');
                statsContainer.innerHTML = `
                    <div class="admin-stat-card">
                        <span class="admin-stat-value" style="color: #DA291C;">${data.total_portions_last_month || 0}</span>
                        <span class="admin-stat-label">Παραδόσεις (30 μέρες)</span>
                    </div>
                    <div class="admin-stat-card">
                        <span class="admin-stat-value" style="color: #4f46e5;">${users.length || 0}</span>
                        <span class="admin-stat-label">Εγγεγραμμένοι Χρήστες</span>
                    </div>
                    <div class="admin-stat-card">
                        <span class="admin-stat-value" style="color: #ffcc00;">${posts.filter(p => p.status === 'active').length || 0}</span>
                        <span class="admin-stat-label">Ενεργές Αγγελίες</span>
                    </div>
                `;

                // Render User Management Table
                const userTbody = container.querySelector('#admin-users-table tbody');
                userTbody.innerHTML = '';
                users.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                    tr.innerHTML = `
                        <td style="padding: 10px;">${u.id}</td>
                        <td style="padding: 10px; font-weight: bold; color: #fff;">${u.username}</td>
                        <td style="padding: 10px;">${u.email}</td>
                        <td style="padding: 10px;">${u.role}</td>
                        <td style="padding: 10px; color: #DA291C; font-weight: bold;" id="admin-user-credits-${u.id}">${u.credits}</td>
                        <td style="padding: 10px;">
                            <button class="releaf-button adjust-credits-btn" data-id="${u.id}" data-name="${u.username}" style="padding: 3px 10px; font-size: 0.75rem; background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); margin: 0;">Adjust Credits</button>
                        </td>
                    `;
                    userTbody.appendChild(tr);
                });

                // Attach adjust credits events
                container.querySelectorAll('.adjust-credits-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const uid = e.target.getAttribute('data-id');
                        const uname = e.target.getAttribute('data-name');
                        const amountStr = prompt(`Πόσα credits θέλετε να προσθέσετε (ή να αφαιρέσετε με μείον) στον/στην ${uname};`);
                        if(amountStr === null) return;
                        const amount = parseInt(amountStr);
                        if (isNaN(amount)) {
                            showToast('Παρακαλώ εισάγετε έγκυρο αριθμό.', 'error');
                            return;
                        }
                        const reason = prompt(`Αιτιολογία για αυτή την αλλαγή:`) || 'Διαχειριστική ρύθμιση';
                        
                        try {
                            const res = await fetch(`/api/admin/users/${uid}/credits`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ credits_change: amount, reason })
                            });
                            if (res.ok) {
                                const updatedUser = await res.json();
                                container.querySelector(`#admin-user-credits-${uid}`).textContent = updatedUser.credits;
                                showToast(`Τα credits του χρήστη ${uname} ενημερώθηκαν.`, 'success');
                            } else {
                                showToast('Σφάλμα ενημέρωσης.', 'error');
                            }
                        } catch (err) {
                            showToast('Σφάλμα σύνδεσης.', 'error');
                        }
                    });
                });
            });

            // Render Leaderboard
            const tbody = container.querySelector('#admin-leaderboard tbody');
            tbody.innerHTML = '';
            if (!data.leaderboard || data.leaderboard.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Δεν υπάρχουν δεδομένα.</td></tr>';
            } else {
                data.leaderboard.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                    tr.innerHTML = `
                        <td style="padding: 10px; font-weight: bold; color: #fff;">${row.username}</td>
                        <td style="padding: 10px;">${row.portions_shared}</td>
                        <td style="padding: 10px; color: #ffcc00;">⭐ ${parseFloat(row.avg_rating || 0).toFixed(1)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(e => {
            console.error(e);
            container.querySelector('#admin-stats-container').innerHTML = '<p style="color: #ff4d4d; grid-column: 1/-1;">Σφάλμα φόρτωσης.</p>';
        });

    return container;
}
