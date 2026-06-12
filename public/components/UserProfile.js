import { showToast } from '../app.js';

export function renderUserProfile(navigate, state) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.cssText = "width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; animation: fadeInUp 0.5s ease-out;";

    const user = state.loggedInUser;

    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; color: white; border: 3px solid rgba(255,255,255,0.2);">
                ${user.username.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 style="font-family: var(--font-heading); color: #fff; margin: 0; font-size: 2rem;">${user.username}</h2>
                <p style="font-family: var(--font-mono); color: var(--text-secondary); margin: 5px 0 0 0;">${user.email} | Ρόλος: ${user.role}</p>
            </div>
            <div style="margin-left: auto; text-align: right;">
                <div style="color: #DA291C; font-family: var(--font-mono); font-weight: bold; font-size: 1.5rem;">
                     ${user.credits}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Διαθέσιμα Credits</div>
            </div>
        </div>

        <h3 class="section-title" style="color: #fff;">Στατιστικά</h3>
        <div class="stats-grid" id="profile-stats">
            <div class="stat-card skeleton" style="height: 80px;"></div>
            <div class="stat-card skeleton" style="height: 80px;"></div>
            <div class="stat-card skeleton" style="height: 80px;"></div>
            <div class="stat-card skeleton" style="height: 80px;"></div>
        </div>

        <h3 class="section-title" style="color: #fff; margin-top: 30px;">Επιτεύγματα</h3>
        <div class="badge-row" id="profile-badges">
            <div class="skeleton" style="width: 100px; height: 30px; border-radius: 20px;"></div>
            <div class="skeleton" style="width: 100px; height: 30px; border-radius: 20px;"></div>
            <div class="skeleton" style="width: 100px; height: 30px; border-radius: 20px;"></div>
        </div>

        <h3 class="section-title" style="color: #fff; margin-top: 30px;">Επεξεργασία Προφίλ</h3>
        <form id="profile-form" style="display: flex; flex-direction: column; gap: 15px; max-width: 400px;" novalidate>
            <div>
                <label style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-left: 10px;">Όνομα Χρήστη</label>
                <input type="text" id="prof-username" class="releaf-input" value="${user.username}" />
            </div>
            <div>
                <label style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-left: 10px;">Email</label>
                <input type="email" id="prof-email" class="releaf-input" value="${user.email}" />
            </div>
            <div>
                <label style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-left: 10px;">Τηλέφωνο Επικοινωνίας</label>
                <input type="text" id="prof-phone" class="releaf-input" value="${user.phone || ''}" placeholder="π.χ. 69..." />
            </div>
            <div>
                <label style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-left: 10px;">Διεύθυνση / Σχολή</label>
                <input type="text" id="prof-address" class="releaf-input" value="${user.address || ''}" placeholder="π.χ. Εστία Κτίριο Β" />
            </div>
            <button type="submit" class="releaf-button" style="align-self: flex-start; margin-top: 10px;">Αποθήκευση Αλλαγών</button>
        </form>
    `;

    // Fetch stats
    fetch(`/api/users/${user.id}/stats`)
        .then(res => res.json())
        .then(stats => {
            const statsGrid = container.querySelector('#profile-stats');
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <span class="stat-value">${stats.total_portions_shared}</span>
                    <span class="stat-label">Μερίδες Μοιράστηκαν</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.total_portions_received}</span>
                    <span class="stat-label">Μερίδες Λήφθηκαν</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.avg_rating_as_cook ? parseFloat(stats.avg_rating_as_cook).toFixed(1) : '-'}</span>
                    <span class="stat-label">Βαθμολογία Μάγειρα</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.total_posts}</span>
                    <span class="stat-label">Αγγελίες</span>
                </div>
            `;

            const badgeRow = container.querySelector('#profile-badges');
            let badgesHtml = '';
            
            // First Cook Badge
            if (stats.total_portions_shared >= 1) badgesHtml += '<div class="badge earned"> Πρώτη Μαγειρική</div>';
            else badgesHtml += '<div class="badge locked"> Πρώτη Μαγειρική</div>';

            // 10 Portions Badge
            if (stats.total_portions_shared >= 10) badgesHtml += '<div class="badge earned"> 10 Μερίδες!</div>';
            else badgesHtml += '<div class="badge locked"> 10 Μερίδες</div>';

            // Top Chef Badge
            if (stats.avg_rating_as_cook >= 4.5 && stats.total_portions_shared >= 5) badgesHtml += '<div class="badge earned">⭐ Top Chef</div>';
            else badgesHtml += '<div class="badge locked"> Top Chef</div>';

            // First Order Badge
            if (stats.total_portions_received >= 1) badgesHtml += '<div class="badge earned"> Πρωτάρης</div>';
            else badgesHtml += '<div class="badge locked"> Πρωτάρης</div>';

            badgeRow.innerHTML = badgesHtml;
        })
        .catch(e => {
            console.error(e);
            container.querySelector('#profile-stats').innerHTML = '<p style="color: #ff4d4d; grid-column: 1/-1;">Σφάλμα φόρτωσης στατιστικών.</p>';
        });

    container.querySelector('#profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = container.querySelector('#prof-username').value.trim();
        const email = container.querySelector('#prof-email').value.trim();
        const phone = container.querySelector('#prof-phone').value.trim();
        const address = container.querySelector('#prof-address').value.trim();

        if (!username || !email) {
            showToast('Τα πεδία όνομα και email είναι υποχρεωτικά.', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, phone, address })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                state.loggedInUser = updatedUser;
                showToast('Το προφίλ ενημερώθηκε επιτυχώς!', 'success');
                // Refresh view to show new data in topbar
                setTimeout(() => navigate('profile'), 500);
            } else {
                const data = await res.json();
                showToast(data.detail || 'Σφάλμα κατά την ενημέρωση.', 'error');
            }
        } catch (err) {
            showToast('Σφάλμα επικοινωνίας με τον server.', 'error');
        }
    };

    return container;
}
