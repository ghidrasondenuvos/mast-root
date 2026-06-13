import { showToast, sanitize } from '../app.js';

export function renderAdminDashboard(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column;";

    container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-xl); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: var(--space-md);">
            <div style="font-size: 2.5rem;">⚙️</div>
            <div>
                <h2 class="font-heading" style="margin: 0 0 var(--space-xs) 0; color: var(--danger); font-size: 2rem; font-weight: 800;">Admin Dashboard</h2>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.95rem;">Πίνακας ελέγχου διαχειριστή συστήματος</p>
            </div>
        </div>
        
        <div class="admin-stat-grid" id="admin-stats-container">
            <div class="admin-stat-card skeleton" style="height: 140px;"></div>
            <div class="admin-stat-card skeleton" style="height: 140px;"></div>
            <div class="admin-stat-card skeleton" style="height: 140px;"></div>
        </div>

        <div class="glass-panel" style="margin-bottom: var(--space-lg); padding: var(--space-xl);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border); padding-bottom: var(--space-md);">
                <span style="font-size: 1.5rem;">🏆</span>
                <h3 class="font-heading" style="margin: 0; font-size: 1.4rem; color: var(--accent);">Leaderboard (Top Cooks)</h3>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.9rem;" id="admin-leaderboard">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-tertiary);">
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Μάγειρας</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Μερίδες που Μοιράστηκαν</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Μέση Αξιολόγηση</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="3" style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">Φόρτωση...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="glass-panel" style="padding: var(--space-xl);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border); padding-bottom: var(--space-md);">
                <span style="font-size: 1.5rem;">👥</span>
                <h3 class="font-heading" style="margin: 0; font-size: 1.4rem; color: var(--text-primary);">Διαχείριση Χρηστών</h3>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.9rem;" id="admin-users-table">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-tertiary);">
                            <th style="padding: 12px var(--space-md); font-weight: 600;">ID</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Username</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Email</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Role</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Credits</th>
                            <th style="padding: 12px var(--space-md); font-weight: 600;">Ενέργεια</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6" style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">Φόρτωση...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch Stats & Leaderboard
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            Promise.all([
                fetch('/api/admin/all-users').then(res => res.json()),
                fetch('/api/posts').then(res => res.json())
            ]).then(([users, posts]) => {
                const statsContainer = container.querySelector('#admin-stats-container');
                statsContainer.innerHTML = `
                    <div class="admin-stat-card stagger" style="animation-delay: 0s;">
                        <span class="admin-stat-value" style="color: var(--secondary);">${data.total_portions_last_month || 0}</span>
                        <span class="admin-stat-label">Παραδόσεις (30 μέρες)</span>
                    </div>
                    <div class="admin-stat-card stagger" style="animation-delay: 0.1s;">
                        <span class="admin-stat-value" style="color: var(--accent);">${users.length || 0}</span>
                        <span class="admin-stat-label">Εγγεγραμμένοι Χρήστες</span>
                    </div>
                    <div class="admin-stat-card stagger" style="animation-delay: 0.2s;">
                        <span class="admin-stat-value" style="color: var(--success);">${posts.filter(p => p.status === 'active').length || 0}</span>
                        <span class="admin-stat-label">Ενεργές Αγγελίες</span>
                    </div>
                `;

                // Render User Management Table
                const userTbody = container.querySelector('#admin-users-table tbody');
                userTbody.innerHTML = '';
                const renderRow = (tr, u, isEdit = false) => {
                    if (isEdit) {
                        tr.innerHTML = `
                            <td style="padding: 14px var(--space-md); color: var(--text-tertiary);">${u.id}</td>
                            <td style="padding: 14px var(--space-md);">
                                <input type="text" class="releaf-input edit-username" value="${sanitize(u.username)}" style="padding: 4px 8px; width: 100%;">
                            </td>
                            <td style="padding: 14px var(--space-md);">
                                <input type="text" class="releaf-input edit-email" value="${sanitize(u.email)}" style="padding: 4px 8px; width: 100%;">
                            </td>
                            <td style="padding: 14px var(--space-md);">
                                <select class="releaf-input edit-role" style="padding: 4px 8px;">
                                    <option value="student" ${u.role==='student'?'selected':''}>student</option>
                                    <option value="admin" ${u.role==='admin'?'selected':''}>admin</option>
                                </select>
                            </td>
                            <td style="padding: 14px var(--space-md); color: var(--accent); font-weight: 700; font-size: 1.1rem;">${u.credits}</td>
                            <td style="padding: 14px var(--space-md); display: flex; gap: 8px;">
                                <button class="releaf-button save-user-btn" style="padding: 6px 12px; font-size: 0.75rem; background: var(--success);">Αποθήκευση</button>
                                <button class="releaf-button secondary cancel-edit-btn" style="padding: 6px 12px; font-size: 0.75rem;">Ακύρωση</button>
                            </td>
                        `;

                        tr.querySelector('.cancel-edit-btn').onclick = () => renderRow(tr, u, false);
                        tr.querySelector('.save-user-btn').onclick = async () => {
                            const newUsername = tr.querySelector('.edit-username').value.trim();
                            const newEmail = tr.querySelector('.edit-email').value.trim();
                            const newRole = tr.querySelector('.edit-role').value;

                            if (!newUsername || !newEmail) {
                                showToast('Τα πεδία Username και Email δεν μπορούν να είναι κενά!', 'error');
                                return;
                            }

                            try {
                                const res = await fetch(`/api/admin/users/${u.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ username: newUsername, email: newEmail, role: newRole })
                                });
                                if (res.ok) {
                                    const updated = await res.json();
                                    showToast('Επιτυχής ενημέρωση χρήστη.', 'success');
                                    renderRow(tr, updated, false);
                                } else {
                                    const data = await res.json();
                                    showToast(data.detail || 'Σφάλμα.', 'error');
                                }
                            } catch (err) {
                                showToast('Σφάλμα δικτύου.', 'error');
                            }
                        };
                    } else {
                        const roleBadge = u.role === 'admin' 
                            ? '<span style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">ADMIN</span>'
                            : '<span style="color: var(--text-secondary);">student</span>';

                        tr.innerHTML = `
                            <td style="padding: 14px var(--space-md); color: var(--text-tertiary);">${u.id}</td>
                            <td style="padding: 14px var(--space-md); font-weight: 700; color: var(--text-primary); font-family: var(--font-heading);">${sanitize(u.username)}</td>
                            <td style="padding: 14px var(--space-md); color: var(--text-secondary);">${sanitize(u.email)}</td>
                            <td style="padding: 14px var(--space-md);">${roleBadge}</td>
                            <td style="padding: 14px var(--space-md); color: var(--accent); font-weight: 700; font-size: 1.1rem;" id="admin-user-credits-${u.id}">${u.credits}</td>
                            <td style="padding: 14px var(--space-md); display: flex; gap: 8px;">
                                <button class="releaf-button secondary edit-user-btn" style="padding: 6px 12px; font-size: 0.75rem;">Επεξεργασία</button>
                                <button class="releaf-button secondary adjust-credits-btn" style="padding: 6px 12px; font-size: 0.75rem;">Αλλαγή Credits</button>
                            </td>
                        `;

                        tr.querySelector('.edit-user-btn').onclick = () => renderRow(tr, u, true);
                        
                        tr.querySelector('.adjust-credits-btn').onclick = async () => {
                            const amountStr = prompt(`Πόσα credits θέλετε να προσθέσετε (ή να αφαιρέσετε με μείον) στον/στην ${u.username};`);
                            if(amountStr === null) return;
                            const amount = parseInt(amountStr);
                            if (isNaN(amount)) {
                                showToast('Παρακαλώ εισάγετε έγκυρο αριθμό.', 'error');
                                return;
                            }
                            const reason = prompt(`Αιτιολογία για αυτή την αλλαγή:`) || 'Διαχειριστική ρύθμιση';
                            
                            try {
                                const res = await fetch(`/api/admin/users/${u.id}/credits`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ credits_change: amount, reason })
                                });
                                if (res.ok) {
                                    const updatedUser = await res.json();
                                    renderRow(tr, updatedUser, false);
                                    showToast(`Τα credits του χρήστη ${u.username} ενημερώθηκαν.`, 'success');
                                } else {
                                    showToast('Σφάλμα ενημέρωσης.', 'error');
                                }
                            } catch (err) {
                                showToast('Σφάλμα σύνδεσης.', 'error');
                            }
                        };
                    }
                };

                users.forEach((u) => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid var(--border)";
                    tr.style.transition = "background var(--transition-fast)";
                    tr.onmouseenter = () => tr.style.background = "rgba(255,255,255,0.02)";
                    tr.onmouseleave = () => tr.style.background = "none";
                    
                    renderRow(tr, u, false);
                    userTbody.appendChild(tr);
                });
            });

            // Render Leaderboard
            const tbody = container.querySelector('#admin-leaderboard tbody');
            tbody.innerHTML = '';
            if (!data.leaderboard || data.leaderboard.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">Δεν υπάρχουν δεδομένα.</td></tr>';
            } else {
                data.leaderboard.forEach((row, idx) => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid var(--border)";
                    tr.style.transition = "background var(--transition-fast)";
                    tr.onmouseenter = () => tr.style.background = "rgba(255,255,255,0.02)";
                    tr.onmouseleave = () => tr.style.background = "none";
                    
                    let medal = '';
                    if (idx === 0) medal = '🥇 ';
                    else if (idx === 1) medal = '🥈 ';
                    else if (idx === 2) medal = '🥉 ';

                    tr.innerHTML = `
                        <td style="padding: 16px var(--space-md); font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">
                            ${medal}${sanitize(row.username)}
                        </td>
                        <td style="padding: 16px var(--space-md); font-size: 1.1rem; color: var(--secondary); font-weight: 600;">
                            ${row.portions_shared} <span style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: 400;">μερίδες</span>
                        </td>
                        <td style="padding: 16px var(--space-md); color: var(--accent); font-weight: 700; font-size: 1.1rem;">
                            ⭐ ${parseFloat(row.avg_rating || 0).toFixed(1)}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(e => {
            console.error(e);
            container.querySelector('#admin-stats-container').innerHTML = '<p style="color: var(--danger); grid-column: 1/-1;">Σφάλμα φόρτωσης.</p>';
        });

    return container;
}
