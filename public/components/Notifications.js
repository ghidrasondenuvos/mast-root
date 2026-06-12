import { showToast, fetchNotificationCount, sanitize } from '../app.js';

export function renderNotifications(navigate, state) {
    const container = document.createElement('div');
    const isStandalone = state.currentView !== 'dashboard';
    
    container.className = isStandalone ? 'fade-in-up glass-panel' : 'fade-in-up';
    container.style.cssText = isStandalone 
        ? "width: 100%; max-width: 700px; margin: 0 auto; padding: var(--space-xl); display: flex; flex-direction: column;"
        : "width: 100%; display: flex; flex-direction: column;";

    const user = state.loggedInUser;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: var(--space-md); margin-bottom: var(--space-lg);">
            <div style="display: flex; align-items: center; gap: var(--space-md);">
                ${isStandalone ? `<button id="notif-back" class="releaf-button secondary" style="padding: 6px 12px; font-size: 0.85rem; margin: 0;">← Πίσω</button>` : ''}
                <h2 class="font-heading" style="color: var(--text-primary); margin: 0; font-size: 1.5rem;">Ειδοποιήσεις</h2>
            </div>
            <button id="mark-all-read" class="releaf-button secondary" style="padding: 6px 12px; font-size: 0.85rem; margin: 0; border: 1px solid var(--accent); color: var(--accent);">
                ✔️ Όλες διαβασμένες
            </button>
        </div>
        
        <div class="${isStandalone ? '' : 'glass-panel'}" style="${isStandalone ? '' : 'padding: var(--space-lg);'} flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <div id="notif-list" style="display: flex; flex-direction: column; gap: var(--space-sm); max-height: 500px; overflow-y: auto; padding-right: 5px;">
                <div class="skeleton" style="height: 70px; border-radius: var(--radius-md);"></div>
                <div class="skeleton" style="height: 70px; border-radius: var(--radius-md);"></div>
                <div class="skeleton" style="height: 70px; border-radius: var(--radius-md);"></div>
            </div>
        </div>
    `;

    if (isStandalone) {
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
                    list.innerHTML = `
                        <div style="text-align: center; padding: var(--space-xl) 0; opacity: 0.6;">
                            <div style="font-size: 2.5rem; margin-bottom: 8px;">🔔</div>
                            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Δεν έχετε νέες ειδοποιήσεις.</p>
                        </div>
                    `;
                    return;
                }

                data.forEach((notif, idx) => {
                    const el = document.createElement('div');
                    el.className = 'stagger';
                    el.style.animationDelay = `${idx * 0.05}s`;
                    
                    const bgClass = notif.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(245, 158, 11, 0.08)';
                    const borderClass = notif.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.3)';
                    const textClass = notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)';
                    
                    el.style.cssText = `display: flex; align-items: center; gap: 12px; padding: var(--space-md); background: ${bgClass}; border: 1px solid ${borderClass}; border-radius: var(--radius-md); transition: all var(--transition-fast); cursor: ${notif.is_read ? 'default' : 'pointer'};`;
                    
                    if (!notif.is_read) {
                        el.onmouseenter = () => el.style.background = 'rgba(245, 158, 11, 0.12)';
                        el.onmouseleave = () => el.style.background = bgClass;
                    }

                    const diff = Date.now() - new Date(notif.created_at).getTime();
                    let timeStr = 'πριν λίγο';
                    if (diff > 86400000) timeStr = `πριν ${Math.floor(diff/86400000)} μέρες`;
                    else if (diff > 3600000) timeStr = `πριν ${Math.floor(diff/3600000)} ώρες`;
                    else if (diff > 60000) timeStr = `πριν ${Math.floor(diff/60000)} λεπτά`;

                    let icon = '📩';
                    if (notif.type === 'credit_earned' || notif.type === 'welcome') icon = '🎉';
                    else if (notif.type === 'request_approved') icon = '✅';
                    else if (notif.type === 'received') icon = '😋';
                    else if (notif.type === 'request_rejected') icon = '❌';
                    else if (notif.type === 'no_show') icon = '⚠️';

                    el.innerHTML = `
                        <div style="font-size: 1.5rem; background: var(--surface-card); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); box-shadow: var(--shadow-sm);">${icon}</div>
                        <div style="flex: 1;">
                            <div style="color: ${textClass}; line-height: 1.4; font-size: 0.95rem; font-weight: ${notif.is_read ? '400' : '600'};">${sanitize(notif.message)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); font-family: var(--font-mono); margin-top: 4px;">${timeStr}</div>
                        </div>
                        ${!notif.is_read ? '<div style="width: 10px; height: 10px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 8px var(--accent);"></div>' : ''}
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
                list.innerHTML = '<p style="color: var(--danger); text-align: center;">Σφάλμα φόρτωσης.</p>';
            });
    }

    loadNotifications();

    return container;
}
