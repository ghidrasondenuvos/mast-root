import { renderRegistrationForm } from './components/RegistrationForm.js';
import { renderLoginForm } from './components/LoginForm.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderFeed } from './components/Feed.js';
import { renderCreatePost } from './components/CreatePostForm.js';
import { renderAdminDashboard } from './components/AdminDashboard.js';
import { renderDatabaseViewer } from './components/DatabaseViewer.js';
import { renderUserProfile } from './components/UserProfile.js';
import { renderCreditHistory } from './components/CreditHistory.js';
import { renderNotifications } from './components/Notifications.js';
import { renderBuyCredits } from './components/BuyCredits.js';

// XSS Sanitization helper
export function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export const state = {
    currentView: 'home',
    loggedInUser: null,
    isSidebarOpen: false,
    notificationCount: 0
};

let notifInterval = null;

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:1.1rem;font-weight:bold">${icons[type] || 'ℹ'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
}

export function fetchNotificationCount() {
    if (!state.loggedInUser) return;
    fetch(`/api/notifications/${state.loggedInUser.id}/unread-count`)
        .then(res => res.json())
        .then(data => {
            state.notificationCount = data.count || 0;
            const badge = document.getElementById('notif-badge-count');
            const bellBtn = document.getElementById('notif-bell-btn');
            if (bellBtn) {
                const existingBadge = bellBtn.querySelector('.notification-badge');
                if (state.notificationCount > 0) {
                    if (existingBadge) existingBadge.textContent = state.notificationCount;
                    else {
                        const span = document.createElement('span');
                        span.className = 'notification-badge';
                        span.textContent = state.notificationCount;
                        bellBtn.appendChild(span);
                    }
                } else if (existingBadge) existingBadge.remove();
            }
        })
        .catch(() => {});
}

export function navigate(view) {
    state.currentView = view;
    state.isSidebarOpen = false;
    renderApp();
}

export function setLoggedInUser(user) {
    state.loggedInUser = user;
    if (user) {
        fetch(`/api/users/${user.id}`)
            .then(res => res.json())
            .then(data => {
                state.loggedInUser = data;
                fetchNotificationCount();
                if (notifInterval) clearInterval(notifInterval);
                notifInterval = setInterval(fetchNotificationCount, 30000);
                renderApp();
            })
            .catch(() => {});
    } else {
        state.notificationCount = 0;
        if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
        renderApp();
    }
}

// ==========================================
// RENDER APP
// ==========================================
export function renderApp() {
    const root = document.getElementById('root');
    const bgImage = document.getElementById('bg-image');
    root.innerHTML = '';

    // Background blur
    let blurLevel = 12;
    let tint = 'rgba(0, 0, 0, 0.6)';
    if (['register', 'login', 'create_post'].includes(state.currentView)) {
        blurLevel = 6; tint = 'rgba(0, 0, 0, 0.7)';
    } else if (['dashboard', 'feed', 'admin', 'db', 'profile', 'credit_history', 'notifications', 'buy_credits'].includes(state.currentView)) {
        blurLevel = 14; tint = 'rgba(15, 23, 42, 0.88)';
    }
    bgImage.style.filter = `blur(${blurLevel}px)`;
    bgImage.style.backgroundColor = tint;

    // ─── Topbar ───
    const showTopbar = ['home', 'dashboard', 'feed', 'admin', 'profile', 'credit_history', 'notifications', 'buy_credits', 'create_post'].includes(state.currentView);
    if (showTopbar) {
        const topbar = document.createElement('nav');
        topbar.className = 'glass-panel';
        topbar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 28px; border-radius:0; border-top:none; border-left:none; border-right:none; position:sticky; top:0; z-index:100;';

        topbar.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px;">
                <button id="hamburger-btn" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer; padding:6px; border-radius:var(--radius-sm); transition:all var(--transition-fast);"
                    onmouseenter="this.style.color='var(--text-primary)'; this.style.background='rgba(255,255,255,0.05)'"
                    onmouseleave="this.style.color='var(--text-secondary)'; this.style.background='none'">☰</button>
                <div id="logo-click" style="cursor:pointer; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.6rem;">🍲</span>
                    <span style="font-family:var(--font-heading); font-size:1.4rem; font-weight:800; background:linear-gradient(135deg, var(--accent), #FBBF24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">UniBite</span>
                </div>
            </div>
            <div style="display:flex; gap:12px; align-items:center;">
                ${!state.loggedInUser ? `
                    <button id="nav-login-btn" class="releaf-button secondary" style="padding:8px 20px; font-size:0.85rem;">Σύνδεση</button>
                    <button id="nav-register-btn" class="releaf-button" style="padding:8px 20px; font-size:0.85rem;">Εγγραφή</button>
                ` : `
                    <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--accent); font-weight:600; padding:6px 14px; border:1px solid rgba(245,158,11,0.2); border-radius:var(--radius-full); background:rgba(245,158,11,0.08);">
                        ${state.loggedInUser.credits} credits
                    </div>
                    <div class="notification-bell" id="notif-bell-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        ${state.notificationCount > 0 ? `<span class="notification-badge">${state.notificationCount}</span>` : ''}
                    </div>
                    <div style="position:relative;">
                        <div id="avatar-btn" style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, var(--accent), var(--secondary)); display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:700; color:#fff; cursor:pointer; transition:all var(--transition-base); box-shadow:0 2px 8px rgba(0,0,0,0.2);"
                            onmouseenter="this.style.transform='scale(1.08)'"
                            onmouseleave="this.style.transform='scale(1)'">${sanitize(state.loggedInUser.username.charAt(0).toUpperCase())}</div>
                        <div id="avatar-dropdown" style="display:none; position:absolute; right:0; top:48px; background:var(--surface-elevated); border:1px solid var(--border); border-radius:var(--radius-md); padding:8px; min-width:200px; flex-direction:column; gap:2px; box-shadow:var(--shadow-lg); z-index:999;">
                            <div style="padding:10px 12px; border-bottom:1px solid var(--border); margin-bottom:4px;">
                                <div style="font-family:var(--font-heading); font-weight:700; font-size:0.9rem;">${sanitize(state.loggedInUser.username)}</div>
                                <div style="font-size:0.75rem; color:var(--text-tertiary); font-family:var(--font-mono);">${sanitize(state.loggedInUser.email)}</div>
                            </div>
                            <button id="drop-profile" class="filter-btn" style="width:100%; text-align:left; padding:10px 12px; border-radius:var(--radius-sm); border:none;">Προφίλ</button>
                            <button id="drop-credits" class="filter-btn" style="width:100%; text-align:left; padding:10px 12px; border-radius:var(--radius-sm); border:none;">Ιστορικό Credits</button>
                            <button id="drop-buy" class="filter-btn" style="width:100%; text-align:left; padding:10px 12px; border-radius:var(--radius-sm); border:none;">Αγορά Credits</button>
                            <hr style="border:none; border-top:1px solid var(--border); margin:4px 0;">
                            <button id="drop-logout" class="filter-btn" style="width:100%; text-align:left; padding:10px 12px; border-radius:var(--radius-sm); border:none; color:var(--danger);">Αποσύνδεση</button>
                        </div>
                    </div>
                `}
            </div>
        `;

        topbar.querySelector('#hamburger-btn').onclick = () => { state.isSidebarOpen = true; renderApp(); };
        topbar.querySelector('#logo-click').onclick = () => navigate(state.loggedInUser ? 'dashboard' : 'home');

        if (!state.loggedInUser) {
            topbar.querySelector('#nav-register-btn').onclick = () => navigate('register');
            topbar.querySelector('#nav-login-btn').onclick = () => navigate('login');
        } else {
            const avatarBtn = topbar.querySelector('#avatar-btn');
            const dropdown = topbar.querySelector('#avatar-dropdown');
            avatarBtn.onclick = () => { dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none'; };
            topbar.querySelector('#drop-profile').onclick = () => navigate('profile');
            topbar.querySelector('#drop-credits').onclick = () => navigate('credit_history');
            topbar.querySelector('#drop-buy').onclick = () => navigate('buy_credits');
            topbar.querySelector('#drop-logout').onclick = async () => { await fetch('/logout', { method: 'POST' }); setLoggedInUser(null); navigate('home'); };
            const bellBtn = topbar.querySelector('#notif-bell-btn');
            if (bellBtn) bellBtn.onclick = () => navigate('notifications');

            // Close dropdown on click outside
            document.addEventListener('click', (e) => {
                if (dropdown && !avatarBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
            }, { once: true });
        }
        root.appendChild(topbar);
    }

    // ─── Main Content ───
    const main = document.createElement('main');
    main.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; width:100%; padding:20px;';

    if (state.currentView === 'home' && !state.loggedInUser) {
        main.style.alignItems = 'center';
        main.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:80px; max-width:1100px; width:100%; padding:0 40px; animation:fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1);">
                <div style="flex:1; max-width:520px;">
                    <div style="display:inline-block; padding:6px 16px; border-radius:var(--radius-full); background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); font-family:var(--font-mono); font-size:0.78rem; color:var(--accent); margin-bottom:20px; font-weight:500;">🎓 Αποκλειστικά για φοιτητές</div>
                    <h1 style="font-family:var(--font-heading); font-size:3.5rem; font-weight:800; line-height:1.1; margin-bottom:20px; color:var(--text-primary);">
                        Μοιράσου το<br><span style="background:linear-gradient(135deg, var(--accent), #FBBF24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">σπιτικό φαγητό</span> σου.
                    </h1>
                    <p style="font-size:1.05rem; color:var(--text-secondary); line-height:1.7; margin-bottom:32px; max-width:440px;">
                        Μαγείρεψες παραπάνω; Μην το πετάς! Μοιράσου τις μερίδες σου με συμφοιτητές, κέρδισε <strong style="color:var(--accent)">credits</strong> και δοκίμασε εσύ το φαγητό τους την επόμενη φορά.
                    </p>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <button id="cta-register" class="releaf-button" style="padding:14px 32px; font-size:1rem;">Ξεκίνα Δωρεάν →</button>
                        <button id="cta-login" class="releaf-button secondary" style="padding:14px 32px; font-size:1rem;">Σύνδεση</button>
                    </div>
                    <div style="display:flex; gap:32px; margin-top:40px; padding-top:24px; border-top:1px solid var(--border);">
                        <div><span style="font-family:var(--font-heading); font-weight:800; font-size:1.5rem; color:var(--accent);">5</span><span style="color:#fff; font-size:0.8rem; margin-left:6px;">δωρεάν credits</span></div>
                        <div><span style="font-family:var(--font-heading); font-weight:800; font-size:1.5rem; color:var(--success);">48h</span><span style="color:#fff; font-size:0.8rem; margin-left:6px;">ζωντανές αγγελίες</span></div>
                        <div><span style="font-family:var(--font-heading); font-weight:800; font-size:1.5rem; color:var(--secondary);">★ 5</span><span style="color:#fff; font-size:0.8rem; margin-left:6px;">σύστημα αξιολόγησης</span></div>
                    </div>
                </div>
                <div style="flex:0 0 auto; display:flex; flex-direction:column; gap:16px; animation:float 4s ease-in-out infinite;">
                    <div class="glass-panel" style="padding:20px 24px; width:280px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #F59E0B, #F97316); display:flex; align-items:center; justify-content:center; font-size:0.9rem;">🍝</div>
                            <div><div style="font-family:var(--font-heading); font-weight:700; font-size:0.9rem;">Μακαρονάδα Ναπολιτάνα</div><div style="font-size:0.7rem; color:var(--text-tertiary);">από Μαρία Κ.</div></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--success);">3 μερίδες</span>
                            <span class="status-badge status-approved" style="font-size:0.65rem;">ΔΙΑΘΕΣΙΜΟ</span>
                        </div>
                    </div>
                    <div class="glass-panel" style="padding:20px 24px; width:280px; margin-left:40px; opacity:0.85;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #6366F1, #8B5CF6); display:flex; align-items:center; justify-content:center; font-size:0.9rem;">🥗</div>
                            <div><div style="font-family:var(--font-heading); font-weight:700; font-size:0.9rem;">Caesar Salad</div><div style="font-size:0.7rem; color:var(--text-tertiary);">από Γιώργο Π.</div></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent);">1 μερίδα</span>
                            <span class="status-badge status-pending" style="font-size:0.65rem;">ΣΧΕΔΟΝ ΤΕΛΟΣ</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        main.querySelector('#cta-register').onclick = () => navigate('register');
        main.querySelector('#cta-login').onclick = () => navigate('login');
        root.appendChild(main);
    } else {
        main.style.alignItems = 'flex-start';
        main.style.padding = '20px';

        if (state.currentView === 'register') main.appendChild(renderRegistrationForm(navigate));
        if (state.currentView === 'login') main.appendChild(renderLoginForm(navigate, (u) => { setLoggedInUser(u); navigate('dashboard'); }));

        if (state.loggedInUser) {
            if (state.currentView === 'dashboard') main.appendChild(renderDashboard(navigate, state));
            if (state.currentView === 'feed') main.appendChild(renderFeed(navigate, state));
            if (state.currentView === 'create_post') main.appendChild(renderCreatePost(navigate, state));
            if (state.currentView === 'admin' && state.loggedInUser.role === 'admin') main.appendChild(renderAdminDashboard(navigate, state));
            if (state.currentView === 'profile') main.appendChild(renderUserProfile(navigate, state));
            if (state.currentView === 'credit_history') main.appendChild(renderCreditHistory(navigate, state));
            if (state.currentView === 'notifications') main.appendChild(renderNotifications(navigate, state));
            if (state.currentView === 'buy_credits') main.appendChild(renderBuyCredits(navigate, state));
        }

        if (state.currentView === 'db') main.appendChild(renderDatabaseViewer(() => navigate(state.loggedInUser ? 'dashboard' : 'home')));

        root.appendChild(main);
    }

    // Floating DB Admin button (dev tool)
    const dbBtn = document.createElement('button');
    dbBtn.style.cssText = 'position:fixed; bottom:16px; left:16px; background:rgba(0,0,0,0.4); backdrop-filter:blur(8px); color:var(--text-tertiary); border:1px solid var(--border); padding:6px 12px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:0.7rem; cursor:pointer; z-index:100; transition:all var(--transition-fast);';
    dbBtn.textContent = '🛠 DB';
    dbBtn.onmouseenter = () => { dbBtn.style.color = 'var(--text-primary)'; dbBtn.style.borderColor = 'var(--accent)'; };
    dbBtn.onmouseleave = () => { dbBtn.style.color = 'var(--text-tertiary)'; dbBtn.style.borderColor = 'var(--border)'; };
    dbBtn.onclick = () => navigate('db');
    root.appendChild(dbBtn);

    renderSidebar();
}

// ==========================================
// SIDEBAR
// ==========================================
function renderSidebar() {
    if (!state.isSidebarOpen) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:998; animation:fadeIn 0.2s ease;';
    overlay.onclick = () => { state.isSidebarOpen = false; renderApp(); };
    document.getElementById('root').appendChild(overlay);

    const sidebar = document.createElement('aside');
    sidebar.className = 'glass-panel';
    sidebar.style.cssText = 'position:fixed; top:0; left:0; width:280px; height:100vh; z-index:1000; padding:28px; border-radius:0; border-top:none; border-left:none; border-bottom:none; display:flex; flex-direction:column; animation:slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1);';

    const menuItems = [];
    if (!state.loggedInUser) {
        menuItems.push({ icon: '🏠', label: 'Αρχική', view: 'home' });
        menuItems.push({ icon: '🔑', label: 'Σύνδεση', view: 'login' });
        menuItems.push({ icon: '📝', label: 'Εγγραφή', view: 'register' });
    } else {
        menuItems.push({ icon: '📊', label: 'Dashboard', view: 'dashboard' });
        menuItems.push({ icon: '🌍', label: 'Feed Αγγελιών', view: 'feed', accent: true });
        menuItems.push({ icon: '➕', label: 'Δώσε Φαγητό', view: 'create_post' });
        menuItems.push({ icon: '👤', label: 'Το Προφίλ μου', view: 'profile' });
        menuItems.push({ icon: '🔔', label: 'Ειδοποιήσεις', view: 'notifications' });
        menuItems.push({ icon: '💳', label: 'Αγορά Credits', view: 'buy_credits' });
        if (state.loggedInUser.role === 'admin') {
            menuItems.push({ icon: '⚙️', label: 'Admin Panel', view: 'admin', danger: true });
        }
    }

    sidebar.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.4rem;">🍲</span>
                <span style="font-family:var(--font-heading); font-size:1.2rem; font-weight:800; color:var(--accent);">UniBite</span>
            </div>
            <button id="close-sidebar" style="background:none; border:none; color:var(--text-tertiary); font-size:1.3rem; cursor:pointer; padding:4px; border-radius:var(--radius-sm);" 
                onmouseenter="this.style.color='var(--text-primary)'" onmouseleave="this.style.color='var(--text-tertiary)'">&times;</button>
        </div>
        ${state.loggedInUser ? `
            <div style="padding:14px; border-radius:var(--radius-md); background:var(--surface-card); border:1px solid var(--border); margin-bottom:24px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg, var(--accent), var(--secondary)); display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; font-size:0.85rem;">${sanitize(state.loggedInUser.username.charAt(0).toUpperCase())}</div>
                    <div>
                        <div style="font-family:var(--font-heading); font-weight:700; font-size:0.85rem;">${sanitize(state.loggedInUser.username)}</div>
                        <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent);">${state.loggedInUser.credits} credits</div>
                    </div>
                </div>
            </div>
        ` : ''}
        <nav id="sidebar-nav" style="display:flex; flex-direction:column; gap:4px; flex:1;" class="stagger"></nav>
        ${state.loggedInUser ? `<button id="sidebar-logout" style="margin-top:auto; padding:12px; border-radius:var(--radius-md); background:none; border:1px solid var(--border); color:var(--text-tertiary); font-family:var(--font-main); font-size:0.85rem; cursor:pointer; transition:all var(--transition-fast); text-align:left;"
            onmouseenter="this.style.borderColor='var(--danger)'; this.style.color='var(--danger)'"
            onmouseleave="this.style.borderColor='var(--border)'; this.style.color='var(--text-tertiary)'">← Αποσύνδεση</button>` : ''}
    `;

    sidebar.querySelector('#close-sidebar').onclick = () => { state.isSidebarOpen = false; renderApp(); };

    const nav = sidebar.querySelector('#sidebar-nav');
    menuItems.forEach(item => {
        const btn = document.createElement('button');
        const isActive = state.currentView === item.view;
        btn.style.cssText = `display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:var(--radius-sm); background:${isActive ? 'rgba(245,158,11,0.1)' : 'none'}; border:none; color:${item.danger ? 'var(--danger)' : item.accent ? 'var(--accent)' : isActive ? 'var(--accent)' : 'var(--text-secondary)'}; font-family:var(--font-main); font-size:0.88rem; font-weight:${isActive ? '600' : '500'}; cursor:pointer; transition:all var(--transition-fast); text-align:left; width:100%;`;
        btn.innerHTML = `<span style="font-size:1.1rem; width:24px; text-align:center;">${item.icon}</span> ${item.label}`;
        btn.onmouseenter = () => { if (!isActive) btn.style.background = 'rgba(255,255,255,0.04)'; };
        btn.onmouseleave = () => { if (!isActive) btn.style.background = 'none'; };
        btn.onclick = () => navigate(item.view);
        nav.appendChild(btn);
    });

    if (state.loggedInUser) {
        sidebar.querySelector('#sidebar-logout').onclick = async () => {
            await fetch('/logout', { method: 'POST' });
            state.loggedInUser = null;
            state.notificationCount = 0;
            if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
            navigate('home');
        };
    }

    document.getElementById('root').appendChild(sidebar);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    renderApp();
}