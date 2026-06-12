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
    const icons = { success: '', error: '', info: 'ℹ' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:1.2rem;font-weight:bold">${icons[type] || 'ℹ'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
}

export function fetchNotificationCount() {
    if (!state.loggedInUser) return;
    fetch(`/api/notifications/${state.loggedInUser.id}/unread-count`)
        .then(res => res.json())
        .then(data => {
            state.notificationCount = data.count || 0;
            // Update badge in DOM without full re-render
            const badge = document.getElementById('notif-badge-count');
            const bellBtn = document.getElementById('notif-bell-btn');
            if (bellBtn) {
                const existingBadge = bellBtn.querySelector('.notification-badge');
                if (state.notificationCount > 0) {
                    if (existingBadge) {
                        existingBadge.textContent = state.notificationCount;
                    } else {
                        const span = document.createElement('span');
                        span.className = 'notification-badge';
                        span.textContent = state.notificationCount;
                        bellBtn.appendChild(span);
                    }
                } else if (existingBadge) {
                    existingBadge.remove();
                }
            }
        })
        .catch(e => console.error('Notification count error:', e));
}

export function navigate(view) {
    state.currentView = view;
    state.isSidebarOpen = false;
    renderApp();
}

export function setLoggedInUser(user) {
    state.loggedInUser = user;
    if (user) {
        // Fetch updated user data (credits etc)
        fetch(`/api/users/${user.id}`)
            .then(res => res.json())
            .then(data => {
                state.loggedInUser = data;
                // Start notification polling
                fetchNotificationCount();
                if (notifInterval) clearInterval(notifInterval);
                notifInterval = setInterval(fetchNotificationCount, 30000);
                renderApp();
            })
            .catch(e => console.error(e));
    } else {
        // Clear notification polling on logout
        state.notificationCount = 0;
        if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
        renderApp();
    }
}

export function renderApp() {
    const root = document.getElementById('root');
    const bgImage = document.getElementById('bg-image');
    root.innerHTML = ''; 

    let blurLevel = 15; 
    let tint = 'rgba(0, 0, 0, 0.2)';

    if (['register', 'login', 'create_post'].includes(state.currentView)) {
        blurLevel = 5; 
        tint = 'rgba(0, 0, 0, 0.75)'; 
    } else if (['dashboard', 'feed', 'admin', 'db', 'profile', 'credit_history', 'notifications', 'buy_credits'].includes(state.currentView)) {
        blurLevel = 10;
        tint = 'rgba(0, 0, 0, 0.85)'; 
    }
    bgImage.style.filter = `blur(${blurLevel}px)`;
    bgImage.style.backgroundColor = tint;

    // Topbar
    if (['home', 'dashboard', 'feed', 'admin', 'profile', 'credit_history', 'notifications', 'buy_credits'].includes(state.currentView)) {
        const topbar = document.createElement('div');
        topbar.className = 'glass-panel';
        topbar.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; box-sizing: border-box; position: relative; z-index: 10; border-radius: 0; border-top: none; border-left: none; border-right: none;";
        
        topbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <button id="hamburger-menu-btn" style="background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer; padding: 0;">&#9776;</button>
                <div id="logo-click" style="font-family: var(--font-heading); font-size: 1.8rem; color: #FFC72C; font-weight: bold; cursor: pointer; -webkit-text-stroke: 1px #DA291C;; text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">UniBite</div>
            </div>

            <div style="display: flex; gap: 20px; align-items: center;">
                ${!state.loggedInUser ? `
                    <button id="nav-register-btn" class="releaf-button" style="background: #DA291C; color: #fff; font-weight: bold; margin: 0; padding: 12px 26px; font-size: 1.1rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(218,41,28,0.4);" title="Έλα στην παρέα μας!">εγγραφή</button>
                    <button id="nav-login-btn" class="releaf-button" style="margin: 0; padding: 12px 26px; font-size: 1.1rem; border-radius: 12px;" title="Πάλι πεινάς;">σύνδεση</button>
                ` : `
                    <div id="topbar-clock" style="color: #fff; font-family: var(--font-mono); font-size: 1.1rem; padding: 5px 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        --:--
                    </div>
                    <div style="color: #DA291C; font-family: var(--font-mono); font-weight: bold; font-size: 1.1rem; border: 1px solid #DA291C; padding: 5px 10px; border-radius: 8px;">
                         ${state.loggedInUser.credits} Credits
                    </div>
                    <div class="notification-bell" id="notif-bell-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DA291C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 4px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        ${state.notificationCount > 0 ? `<span class="notification-badge">${state.notificationCount}</span>` : ''}
                    </div>
                    <div style="position: relative;">
                        <div id="avatar-btn" style="width: 45px; height: 45px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: bold; color: white; cursor: pointer; border: 2px solid rgba(255,255,255,0.2);">
                            ${state.loggedInUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div id="avatar-dropdown" style="display: none; position: absolute; right: 0; top: 55px; background: rgba(27,24,27,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; min-width: 220px; flex-direction: column; gap: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                            <button id="drop-edit-profile" class="filter-btn" style="width: 100%; text-align: left; padding: 12px; font-size: 1.05rem;">️ Επεξεργασία Προφίλ</button>
                            <button id="drop-logout" class="filter-btn" style="width: 100%; text-align: left; padding: 12px; font-size: 1.05rem; color: #ff4d4d;"> Αποσύνδεση</button>
                            <button id="drop-switch-user" class="filter-btn" style="width: 100%; text-align: left; padding: 12px; font-size: 1.05rem; color: #aaa;"> Αλλαγή Λογαριασμού</button>
                        </div>
                    </div>
                `}
            </div>
        `;

        topbar.querySelector('#hamburger-menu-btn').onclick = () => { state.isSidebarOpen = true; renderApp(); };
        topbar.querySelector('#logo-click').onclick = () => navigate(state.loggedInUser ? 'dashboard' : 'home');
        
        if (!state.loggedInUser) {
            topbar.querySelector('#nav-register-btn').onclick = () => navigate('register');
            topbar.querySelector('#nav-login-btn').onclick = () => navigate('login');
        } else {
            const avatarBtn = topbar.querySelector('#avatar-btn');
            const dropdown = topbar.querySelector('#avatar-dropdown');
            avatarBtn.onclick = () => { dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none'; };
            
            topbar.querySelector('#drop-edit-profile').onclick = () => navigate('profile');
            topbar.querySelector('#drop-logout').onclick = () => { setLoggedInUser(null); navigate('home'); };
            topbar.querySelector('#drop-switch-user').onclick = () => { setLoggedInUser(null); navigate('login'); };

            const bellBtn = topbar.querySelector('#notif-bell-btn');
            if (bellBtn) bellBtn.onclick = () => navigate('notifications');
        }
        root.appendChild(topbar);

        if (state.loggedInUser) {
            const clockEl = document.getElementById('topbar-clock');
            if (clockEl) {
                const updateClock = () => {
                    const now = new Date();
                    clockEl.textContent = now.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                };
                updateClock();
                if (window.clockInterval) clearInterval(window.clockInterval);
                window.clockInterval = setInterval(updateClock, 1000);
            }
        }
    }

    const mainContent = document.createElement('div');
    mainContent.style.cssText = "flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;";

    if (state.currentView === 'home' && !state.loggedInUser) {
        mainContent.innerHTML = `
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8%; padding: 0 50px; margin-top: -5vh; width: 100%;">
                <div style="display: flex; flex-direction: column; align-items: flex-start; max-width: 500px;">
                    <div style="font-size: 5rem; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(166,124,82,0.5));"></div>
                    <h1 style="font-family: var(--font-heading); color: #FFC72C; font-size: 4rem; -webkit-text-stroke: 2px #DA291C;; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">UniBite</h1>
                    <p style="font-family: var(--font-mono); font-size: 1.1rem; color: #ddd; margin-bottom: 30px; line-height: 1.8; text-align: left; background: rgba(0,0,0,0.4); padding: 25px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                        Καλώς ήρθες στο δίκτυο φοιτητικής αλληλεγγύης και food-sharing!<br><br>
                        Μαγείρεψες παραπάνω φαγητό; Μην το πετάς! Μοιράσου τις μερίδες που περισσεύουν με τους συμφοιτητές σου στις εστίες ή στη σχολή. 
                        Κάθε φορά που προσφέρεις, κερδίζεις <strong>credits</strong> τα οποία μπορείς να χρησιμοποιήσεις για να δεσμεύσεις ένα ζεστό, σπιτικό γεύμα που μαγείρεψε κάποιος άλλος.<br><br>
                        Μείωσε τη σπατάλη φαγητού, γνώρισε νέα άτομα και φάε καλύτερα!
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <button id="start-cta-btn" class="releaf-button" style="font-size: 2.5rem; padding: 25px 60px; background: #FFC72C; color: #DA291C; border-radius: 20px; font-weight: bold; box-shadow: 0 15px 50px rgba(255, 199, 44, 0.6); border: 4px solid #DA291C; margin: 0; cursor: pointer; text-transform: uppercase; -webkit-text-stroke: 1px #DA291C;">
                        Καλή όρεξη!
                    </button>
                </div>
            </div>
        `;
        mainContent.querySelector('#start-cta-btn').onclick = () => navigate('register');
        root.appendChild(mainContent);
    } 
    else {
        if (state.currentView === 'register') mainContent.appendChild(renderRegistrationForm(() => navigate('home')));
        if (state.currentView === 'login') mainContent.appendChild(renderLoginForm(() => navigate('home'), (u) => { setLoggedInUser(u); navigate('dashboard'); }));
        
        if (state.loggedInUser) {
            if (state.currentView === 'dashboard') mainContent.appendChild(renderDashboard(navigate, state));
            if (state.currentView === 'feed') mainContent.appendChild(renderFeed(navigate, state));
            if (state.currentView === 'create_post') mainContent.appendChild(renderCreatePost(navigate, state));
            if (state.currentView === 'admin' && state.loggedInUser.role === 'admin') mainContent.appendChild(renderAdminDashboard(navigate, state));
            if (state.currentView === 'profile') mainContent.appendChild(renderUserProfile(navigate, state));
            if (state.currentView === 'credit_history') mainContent.appendChild(renderCreditHistory(navigate, state));
            if (state.currentView === 'notifications') mainContent.appendChild(renderNotifications(navigate, state));
            if (state.currentView === 'buy_credits') mainContent.appendChild(renderBuyCredits(navigate, state));
        }
        
        if (state.currentView === 'db') mainContent.appendChild(renderDatabaseViewer(() => navigate(state.loggedInUser ? 'feed' : 'home')));
        
        root.appendChild(mainContent);
    }

    // Floating DB Admin button
    const dbBtn = document.createElement('button');
    dbBtn.style.cssText = "position: fixed; bottom: 20px; left: 20px; background: rgba(0,0,0,0.5); color: #aaa; border: 1px solid #555; padding: 5px 10px; border-radius: 5px; font-family: var(--font-mono); font-size: 0.8rem; cursor: pointer; z-index: 100;";
    dbBtn.textContent = "️ db admin";
    dbBtn.onclick = () => navigate('db');
    document.getElementById('root').appendChild(dbBtn);

    renderSidebar();
}

function renderSidebar() {
    if (!state.isSidebarOpen) return;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 998;";
    overlay.onclick = () => { state.isSidebarOpen = false; renderApp(); };
    document.getElementById('root').appendChild(overlay);

    const sidebar = document.createElement('div');
    sidebar.className = 'glass-panel';
    sidebar.style.cssText = `position: fixed; top: 0; left: 0; width: 260px; height: 100vh; transition: left 0.3s ease-in-out; z-index: 1000; padding: 30px; box-sizing: border-box; border-radius: 0; border-top: none; border-left: none; border-bottom: none;`;

    sidebar.innerHTML = `
        <button id="close-sidebar-btn" style="position: absolute; top: 28px; left: 30px; background: transparent; border: none; font-size: 2rem; cursor: pointer; color: #fff; padding: 0; line-height: 1;">&#10006;</button>
        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: #DA291C; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-top: 60px;">ΜΕΝΟΥ (Απόκρυφες Επιλογές)</h3>
        <ul style="list-style-type: none; padding: 0; font-family: var(--font-heading); font-size: 1.1rem; text-align: left;" id="sidebar-links-list"></ul>
    `;

    sidebar.querySelector('#close-sidebar-btn').onclick = () => { state.isSidebarOpen = false; renderApp(); };
    const list = sidebar.querySelector('#sidebar-links-list');

    if (!state.loggedInUser) {
        list.innerHTML = `
            <li id="side-link-home" style="margin: 20px 0; cursor: pointer; color: #fff;" title="Εδώ που άρχισαν όλα...">Αρχική (Το Σπίτι του Burger)</li>
            <li id="side-link-login" style="margin: 20px 0; cursor: pointer; color: #fff;" title="Ξέχασες τον κωδικό σου πάλι;">Σύνδεση (Σουσάμι άνοιξε)</li>
        `;
        list.querySelector('#side-link-home').onclick = () => navigate('home');
        list.querySelector('#side-link-login').onclick = () => navigate('login');
    } else {
        list.innerHTML = `
            <li id="side-link-feed" style="margin: 20px 0; cursor: pointer; color: #DA291C; font-weight: bold;" title="Η κοιλιά γουργουρίζει"> Feed (Ό,τι φάμε κι ό,τι πιούμε)</li>
            <li id="side-link-cpost" style="margin: 20px 0; cursor: pointer; color: #fff;" title="Δώσε και σώσε"> Δώσε Φαγητό (Μην τσιγκουνεύεσαι)</li>
            <li id="side-link-dash" style="margin: 20px 0; cursor: pointer; color: #fff;" title="Το κέντρο ελέγχου"> Το Dashboard μου (Εδώ είσαι το Αφεντικό)</li>
            <li id="side-link-profile" style="margin: 20px 0; cursor: pointer; color: #fff;" title="Είσαι κούκλος/α"> Προφίλ (Καθρέφτη, καθρεφτάκι μου)</li>
            <li id="side-link-buy" style="margin: 20px 0; cursor: pointer; color: #DA291C;" title="Δώσε πόνο"> Αγορά Credits (Shut up and take my money)</li>
        `;
        
        if (state.loggedInUser.role === 'admin') {
            list.innerHTML += `<li id="side-link-admin" style="margin: 20px 0; cursor: pointer; color: #ff4d4d; font-weight: bold;" title="Εξουσία!"> Admin Panel (Μόνο για θεούς)</li>`;
        }

        list.innerHTML += `<li id="side-link-logout" style="margin: 20px 0; margin-top: 40px; cursor: pointer; color: #aaa;" title="Έξοδος με ελαφρά πηδηματάκια">Αποσύνδεση (Πας να φας μόνος σου;)</li>`;

        list.querySelector('#side-link-feed').onclick = () => navigate('feed');
        list.querySelector('#side-link-cpost').onclick = () => navigate('create_post');
        list.querySelector('#side-link-dash').onclick = () => navigate('dashboard');
        list.querySelector('#side-link-profile').onclick = () => navigate('profile');
        list.querySelector('#side-link-buy').onclick = () => navigate('buy_credits');
        
        if (state.loggedInUser.role === 'admin') {
            list.querySelector('#side-link-admin').onclick = () => navigate('admin');
        }

        list.querySelector('#side-link-logout').onclick = () => {
            state.loggedInUser = null;
            state.notificationCount = 0;
            if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
            navigate('home');
        };
    }

    document.getElementById('root').appendChild(sidebar);
}

document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});