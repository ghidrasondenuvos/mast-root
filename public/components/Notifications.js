import { showToast, fetchNotificationCount } from '../app.js';

export function renderNotifications(navigate, state) {
    const container = document.createElement('div');
    if (state.currentView !== 'dashboard') {
        container.className = 'glass-panel';
        container.style.cssText = "width: 100%; max-width: 700px; margin: 0 auto; padding: 30px; animation: fadeInUp 0.5s ease-out;";
    } else {
        container.style.cssText = "width: 100%; animation: fadeInUp 0.5s ease-out;";
    }

    const user = state.loggedInUser;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px;">
            ${state.currentView !== 'dashboard' ? `
            <div style="display: flex; align-items: center; gap: 15px;">
                <button id="notif-back" class="releaf-button secondary" style="padding: 5px 15px; font-size: 0.8rem; margin: 0;">← Πίσω</button>
                <h2 style="font-family: var(--font-heading); color: #fff; margin: 0;">Ειδοποιήσεις</h2>
            </div>` : `<h2 style="font-family: var(--font-heading); color: #fff; margin: 0;">Ειδοποιήσεις</h2>`}
            <button id="mark-all-read" class="releaf-button" style="padding: 5px 15px; font-size: 0.8rem; margin: 0; background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color);">
                Όλες διαβασμένες
            </button>
        </div>
        <div id="notif-list" style="display: flex; flex-direction: column; max-height: 65vh; overflow-y: auto;">
            <p style="color: #aaa; text-align: center; font-family: var(--font-mono); margin-top: 50px;">Φόρτωση...</p>
        </div>
    `;

    if (state.currentView !== 'dashboard') {
        container.querySelector('#notif-back').onclick = () => navigate('dashboard');
    }

    const markAllBtn = container.querySelector('#mark-all-read');
    markAllBtn.onclick = async () => {
        try {
            await fetch(`/api/notifications/read-all/${user.id}`, { method: 'POST' });
            showToast('Όλες οι ειδοποιήσεις σημειώθηκαν ως διαβασμένες.', 'success');
            fetchNotificationCount();
            loadNotifications();
        } catch(e) {
            showToast('Σφάλμα', 'error');
        }
    };

    function loadNotifications() {
        const list = container.querySelector('#notif-list');
        fetch(`/api/notifications/${user.id}`)
            .then(res => res.json())
            .then(data => {
                list.innerHTML = '';
                if (!data || data.length === 0) {
                    list.innerHTML = '<p style="color: #aaa; text-align: center; font-family: var(--font-mono); margin-top: 50px;">Δεν έχετε ειδοποιήσεις.</p>';
                    return;
                }

                data.forEach(notif => {
                    const el = document.createElement('div');
                    el.className = 'notif-item' + (notif.is_read ? '' : ' unread');
                    
                    // Simple relative time
                    const diff = Date.now() - new Date(notif.created_at).getTime();
                    let timeStr = 'πριν λίγο';
                    if (diff > 86400000) timeStr = `πριν ${Math.floor(diff/86400000)} μέρες`;
                    else if (diff > 3600000) timeStr = `πριν ${Math.floor(diff/3600000)} ώρες`;
                    else if (diff > 60000) timeStr = `πριν ${Math.floor(diff/60000)} λεπτά`;

                    let icon = '🔔';
                    if (notif.type === 'credit_earned' || notif.type === 'welcome') icon = '🪙';
                    if (notif.type === 'request_approved' || notif.type === 'received') icon = '✅';
                    if (notif.type === 'request_rejected' || notif.type === 'no_show') icon = '❌';

                    el.innerHTML = `
                        <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <div style="font-size: 1.2rem;">${icon}</div>
                            <div style="flex: 1;">
                                <div style="color: #fff; line-height: 1.4;">${notif.message}</div>
                                <div class="notif-time">${timeStr}</div>
                            </div>
                            ${!notif.is_read ? '<div style="width: 8px; height: 8px; background: var(--accent-color); border-radius: 50%; margin-top: 6px;"></div>' : ''}
                        </div>
                    `;

                    if (!notif.is_read) {
                        el.onclick = async () => {
                            try {
                                await fetch(`/api/notifications/${notif.id}/read`, { method: 'POST' });
                                fetchNotificationCount();
                                loadNotifications(); // reload list
                            } catch(e) {}
                        };
                    }

                    list.appendChild(el);
                });
            })
            .catch(err => {
                list.innerHTML = '<p style="color: #ff4d4d; text-align: center;">Σφάλμα φόρτωσης.</p>';
            });
    }

    loadNotifications();

    return container;
}
