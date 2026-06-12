import { showToast, sanitize } from '../app.js';

export function renderUserProfile(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column;";

    const user = state.loggedInUser;

    container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-2xl) var(--space-xl); margin-bottom: var(--space-lg); display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100px; background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(99,102,241,0.2)); border-bottom: 1px solid var(--border);"></div>
            
            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: white; border: 4px solid var(--surface-card); box-shadow: var(--shadow-md); z-index: 1; margin-top: 20px; margin-bottom: var(--space-md);">
                ${sanitize(user.username.charAt(0).toUpperCase())}
            </div>
            
            <h2 class="font-heading" style="color: var(--text-primary); margin: 0 0 4px 0; font-size: 2rem; z-index: 1;">${sanitize(user.username)}</h2>
            <p class="font-mono" style="color: var(--text-tertiary); margin: 0 0 var(--space-md) 0; font-size: 0.9rem; z-index: 1;">
                ${sanitize(user.email)}
            </p>
            
            <div style="display: flex; gap: var(--space-sm); z-index: 1;">
                <span style="background: rgba(245,158,11,0.1); color: var(--accent); padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(245,158,11,0.2);">
                    ${user.credits} Credits
                </span>
                <span style="background: rgba(255,255,255,0.05); color: var(--text-secondary); padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 500; border: 1px solid var(--border);">
                    Ρόλος: ${user.role}
                </span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-lg);">
            
            <!-- Stats -->
            <div class="glass-panel" style="padding: var(--space-xl);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">
                    <span style="font-size: 1.4rem;">📊</span>
                    <h3 class="font-heading" style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Στατιστικά</h3>
                </div>
                <div id="profile-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                    <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
                    <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
                    <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
                    <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
                </div>
            </div>

            <!-- Edit Profile Form -->
            <div class="glass-panel" style="padding: var(--space-xl);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">
                    <span style="font-size: 1.4rem;">📝</span>
                    <h3 class="font-heading" style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Προφίλ</h3>
                </div>
                <form id="profile-form" style="display: flex; flex-direction: column; gap: var(--space-md);" novalidate>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Όνομα Χρήστη</label>
                        <input type="text" id="prof-username" class="releaf-input" value="${sanitize(user.username)}" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Email</label>
                        <input type="email" id="prof-email" class="releaf-input" value="${sanitize(user.email)}" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Τηλέφωνο</label>
                        <input type="text" id="prof-phone" class="releaf-input" value="${sanitize(user.phone || '')}" placeholder="π.χ. 69..." />
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Διεύθυνση / Σχολή</label>
                        <input type="text" id="prof-address" class="releaf-input" value="${sanitize(user.address || '')}" placeholder="π.χ. Εστία Κτίριο Β" />
                    </div>
                    <button type="submit" class="releaf-button" style="justify-content: center; margin-top: var(--space-sm); padding: 12px;">Αποθήκευση</button>
                </form>
            </div>

        </div>

        <div class="glass-panel" style="padding: var(--space-xl); margin-bottom: var(--space-2xl);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">
                <span style="font-size: 1.4rem;">🏅</span>
                <h3 class="font-heading" style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Επιτεύγματα</h3>
            </div>
            <div id="profile-badges" style="display: flex; flex-wrap: wrap; gap: var(--space-md);">
                <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-full);"></div>
                <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-full);"></div>
                <div class="skeleton" style="width: 120px; height: 36px; border-radius: var(--radius-full);"></div>
            </div>
        </div>
    `;

    // Fetch stats
    fetch(`/api/users/${user.id}/stats`)
        .then(res => res.json())
        .then(stats => {
            const statsGrid = container.querySelector('#profile-stats');
            statsGrid.innerHTML = `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md); text-align: center;">
                    <div class="font-heading" style="font-size: 1.8rem; font-weight: 800; color: var(--accent); line-height: 1;">${stats.total_portions_shared}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Μοιράστηκαν</div>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md); text-align: center;">
                    <div class="font-heading" style="font-size: 1.8rem; font-weight: 800; color: var(--secondary); line-height: 1;">${stats.total_portions_received}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Λήφθηκαν</div>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md); text-align: center;">
                    <div class="font-heading" style="font-size: 1.8rem; font-weight: 800; color: #FBBF24; line-height: 1;">${stats.avg_rating_as_cook ? parseFloat(stats.avg_rating_as_cook).toFixed(1) : '-'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">⭐ Βαθμολογία</div>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md); text-align: center;">
                    <div class="font-heading" style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); line-height: 1;">${stats.total_posts}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Αγγελίες</div>
                </div>
            `;

            const badgeRow = container.querySelector('#profile-badges');
            let badgesHtml = '';
            
            const badgeStyle = "padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; border: 1px solid;";
            const earnedStyle = `${badgeStyle} background: rgba(16, 185, 129, 0.1); color: var(--success); border-color: rgba(16, 185, 129, 0.2);`;
            const lockedStyle = `${badgeStyle} background: rgba(255,255,255,0.03); color: var(--text-tertiary); border-color: var(--border); filter: grayscale(1);`;
            
            // First Cook Badge
            if (stats.total_portions_shared >= 1) badgesHtml += `<div style="${earnedStyle}">🧑‍🍳 Πρώτη Μαγειρική</div>`;
            else badgesHtml += `<div style="${lockedStyle}">🔒 Πρώτη Μαγειρική</div>`;

            // 10 Portions Badge
            if (stats.total_portions_shared >= 10) badgesHtml += `<div style="${earnedStyle}">🌟 10 Μερίδες!</div>`;
            else badgesHtml += `<div style="${lockedStyle}">🔒 10 Μερίδες</div>`;

            // Top Chef Badge
            if (stats.avg_rating_as_cook >= 4.5 && stats.total_portions_shared >= 5) badgesHtml += `<div style="${earnedStyle}">👑 Top Chef</div>`;
            else badgesHtml += `<div style="${lockedStyle}">🔒 Top Chef</div>`;

            // First Order Badge
            if (stats.total_portions_received >= 1) badgesHtml += `<div style="${earnedStyle}">🛍️ Πρωτάρης</div>`;
            else badgesHtml += `<div style="${lockedStyle}">🔒 Πρωτάρης</div>`;

            badgeRow.innerHTML = badgesHtml;
        })
        .catch(e => {
            console.error(e);
            container.querySelector('#profile-stats').innerHTML = '<p style="color: var(--danger); grid-column: 1/-1;">Σφάλμα φόρτωσης.</p>';
        });

    container.querySelector('#profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = container.querySelector('#prof-username').value.trim();
        const email = container.querySelector('#prof-email').value.trim();
        const phone = container.querySelector('#prof-phone').value.trim();
        const address = container.querySelector('#prof-address').value.trim();
        const btn = container.querySelector('button[type="submit"]');

        if (!username || !email) {
            showToast('Τα πεδία όνομα και email είναι υποχρεωτικά.', 'error');
            return;
        }

        btn.textContent = 'Αποθήκευση...';
        btn.disabled = true;

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, phone, address })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                state.loggedInUser = updatedUser;
                showToast('Το προφίλ ενημερώθηκε!', 'success');
                setTimeout(() => navigate('profile'), 500);
            } else {
                const data = await res.json();
                showToast(data.detail || 'Σφάλμα', 'error');
                btn.textContent = 'Αποθήκευση';
                btn.disabled = false;
            }
        } catch (err) {
            showToast('Σφάλμα σύνδεσης.', 'error');
            btn.textContent = 'Αποθήκευση';
            btn.disabled = false;
        }
    };

    return container;
}
