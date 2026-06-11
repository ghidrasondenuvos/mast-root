// Αρχείο: public/app.js

import { renderRegistrationForm } from './components/RegistrationForm.js';
import { renderLoginForm } from './components/LoginForm.js';
import { renderProfileEditForm } from './components/ProfileEditForm.js';
import { renderDatabaseViewer } from './components/DatabaseViewer.js';
import { renderCreateActionForm } from './components/CreateActionForm.js';
import { renderSearchActions } from './components/SearchActions.js';
import { renderManageRequests } from './components/ManageRequests.js';
import { renderCreateCampaignForm } from './components/CreateCampaignForm.js';
import { renderEnvironmentalNeedsDashboard } from './components/EnvironmentalNeedsDashboard.js';
import { renderCertificatesDashboard } from './components/CertificatesDashboard.js';
import { renderBrowseCampaigns } from './components/BrowseCampaigns.js';
import { renderDashboard } from './components/Dashboard.js';

export const state = {
    currentView: 'home',
    loggedInUser: null,
    notifications: [],
    pendingRequestsCount: 0,
    campaigns: [],
    selectedCampaign: null,
    isCheckoutOpen: false,
    isSidebarOpen: false,
    isNotifOpen: false
};

export function navigate(view) {
    state.currentView = view;
    state.isSidebarOpen = false;
    state.isNotifOpen = false;
    renderApp();
}

export function setLoggedInUser(user) {
    state.loggedInUser = user;
    if (user) {
        fetchDashboardData();
    }
}

export async function fetchDashboardData() {
    if (!state.loggedInUser) return;
    const userId = state.loggedInUser.id;

    try {
        const notifRes = await fetch(`/api/notifications/${userId}`);
        state.notifications = await notifRes.json();
    } catch (e) { console.error("Σφάλμα φόρτωσης ειδοποιήσεων:", e); }

    try {
        const reqRes = await fetch(`/api/org-requests/${userId}`);
        const reqData = await reqRes.json();
        state.pendingRequestsCount = reqData.length || 0;
    } catch (e) { console.error("Σφάλμα φόρτωσης αιτήσεων:", e); }

    renderApp();
}

async function toggleNotifications() {
    state.isNotifOpen = !state.isNotifOpen;
    renderApp();

    if (state.isNotifOpen && state.notifications.length > 0) {
        try {
            await fetch(`/api/notifications/${state.loggedInUser.id}`, { method: 'DELETE' });
            setTimeout(() => {
                state.notifications = [];
                renderApp();
            }, 5000); 
        } catch (e) { console.error(e); }
    }
}

export function renderApp() {
    const root = document.getElementById('root');
    const bgImage = document.getElementById('bg-image');
    root.innerHTML = ''; 

    // --- ΒΕΛΤΙΩΜΕΝΟΣ ΜΗΧΑΝΙΣΜΟΣ BLUR & TINT ---
    let blurLevel = 15; // Πολύ θολό στην αρχική
    let tint = 'rgba(0, 0, 0, 0.2)'; // Ελαφρύ σκούρο

    if (['register', 'login', 'profile_edit', 'create_action', 'manage_requests', 'create_campaign', 'browse_campaigns', 'certificates'].includes(state.currentView)) {
        blurLevel = 5; // Πιο καθαρό για να διαβάζεις τις φόρμες
        tint = 'rgba(0, 0, 0, 0.75)'; // Πιο σκοτεινό
    } else if (['db', 'actions', 'search', 'dashboard'].includes(state.currentView)) {
        blurLevel = 10;
        tint = 'rgba(0, 0, 0, 0.85)'; // Αρκετά σκοτεινό για να φαίνονται τα panels
    }
    bgImage.style.filter = `blur(${blurLevel}px)`;
    bgImage.style.backgroundColor = tint;

    // Σχεδιασμός Topbar
    if (state.currentView === 'home' || state.currentView === 'dashboard') {
        const topbar = document.createElement('div');
        topbar.className = 'glass-panel';
        topbar.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; box-sizing: border-box; position: relative; z-index: 10; border-radius: 0; border-top: none; border-left: none; border-right: none;";
        
        topbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <button id="hamburger-menu-btn" style="background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer; padding: 0;">☰</button>
                <img id="logo-click" src="assets/logo.png" alt="RELEAF Logo" style="height: 55px; cursor: pointer; filter: drop-shadow(0px 2px 5px rgba(0,0,0,0.5));" />
            </div>

            <div style="display: flex; gap: 20px; align-items: center;">
                ${!state.loggedInUser ? `
                    <button id="nav-register-btn" class="releaf-button" style="background: #10b981; color: #fff; font-weight: bold; margin: 0; padding: 8px 18px; font-size: 0.85rem;">εγγραφή</button>
                    <button id="nav-login-btn" class="releaf-button" style="margin: 0; padding: 8px 18px; font-size: 0.85rem;">σύνδεση</button>
                ` : `
                    <div style="position: relative; display: flex; align-items: center;">
                        <button id="bell-notif-btn" style="background: transparent; border: none; cursor: pointer; padding: 0; position: relative; display: flex;">
                            <img src="assets/bell.png" alt="Ειδοποιήσεις" style="width: 32px; height: 32px;" />
                            ${state.notifications.length > 0 ? `
                                <span style="position: absolute; top: -5px; right: -5px; background: #ff4d4d; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                    ${state.notifications.length}
                                </span>
                            ` : ''}
                        </button>

                        ${state.isNotifOpen ? `
                            <div style="position: absolute; top: 50px; right: -10px; width: 280px; background: rgba(27,24,27,0.95); border: 1px solid var(--accent-color); border-radius: 12px; padding: 15px; z-index: 100; text-align: left; box-shadow: 0 5px 20px rgba(0,0,0,0.5);">
                                <h4 style="margin: 0 0 10px 0; color: white; font-family: var(--font-mono); border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">ειδοποιήσεις</h4>
                                ${state.notifications.length === 0 ? `
                                    <p style="color: #888; font-size: 0.85rem; font-family: var(--font-mono); margin: 0;">δεν έχετε νέες ειδοποιήσεις.</p>
                                ` : `
                                    <ul style="list-style: none; padding: 0; margin: 0;">
                                        ${state.notifications.map(n => `<li style="font-family: var(--font-mono); font-size: 0.85rem; color: #ccc; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">▸ ${n.text}</li>`).join('')}
                                    </ul>
                                `}
                            </div>
                        ` : ''}
                    </div>

                    <div id="avatar-btn" style="width: 45px; height: 45px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: bold; color: white; cursor: pointer; border: 2px solid rgba(255,255,255,0.2); transition: transform 0.2s ease;">
                        ${state.loggedInUser.username.charAt(0).toUpperCase()}
                    </div>
                `}
            </div>
        `;

        topbar.querySelector('#hamburger-menu-btn').onclick = () => { state.isSidebarOpen = true; renderApp(); };
        topbar.querySelector('#logo-click').onclick = () => { setCurrentViewHomeOrDash(); };
        
        if (!state.loggedInUser) {
            topbar.querySelector('#nav-register-btn').onclick = () => navigate('register');
            topbar.querySelector('#nav-login-btn').onclick = () => navigate('login');
        } else {
            topbar.querySelector('#bell-notif-btn').onclick = () => toggleNotifications();
            topbar.querySelector('#avatar-btn').onclick = () => navigate('profile_edit');
        }
        root.appendChild(topbar);
    }

    const mainContent = document.createElement('div');
    mainContent.style.cssText = "flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;";

    if (state.currentView === 'home' && !state.loggedInUser) {
        mainContent.innerHTML = `
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8%; padding: 0 50px; margin-top: -5vh; width: 100%;">
                <div style="display: flex; flex-direction: column; align-items: flex-start; max-width: 450px;">
                    <p style="font-family: var(--font-mono); font-size: 1rem; color: #ddd; margin-bottom: 30px; line-height: 1.6; text-align: left; text-shadow: 0 2px 5px rgba(0,0,0,0.8);">
                        ενώνουμε εθελοντές, οργανισμούς και χορηγούς για να δημιουργήσουμε έναν πιο πράσινο κόσμο. 
                        ανακάλυψε δράσεις στην περιοχή σου, πρόσφερε τον χρόνο ή τους πόρους σου, και κάνε τη διαφορά. 
                    </p>
                    <img src="assets/tree.gif" alt="Φύση" style="width: 100%; max-width: 350px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.4);" />
                </div>

                <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <button id="start-cta-btn" class="releaf-button" style="font-size: 3.5rem; padding: 30px 80px; background: #10b981; color: #fff; border-radius: 25px; font-weight: bold; box-shadow: 0 15px 50px rgba(16, 185, 129, 0.6); margin: 60px 0 0 0; white-space: nowrap; display: flex; justify-content: center; align-items: center; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; border: 2px solid rgba(255,255,255,0.2);">
                        ξεκίνα μαζί μας!
                    </button>
                    <p style="font-family: var(--font-mono); font-size: 1.2rem; color: #fff; margin-top: 25px; font-style: italic; font-weight: bold; text-shadow: 0px 4px 15px rgba(0,0,0,1);">
                        έλα και εσύ στην παρέα μας,<br/>η φύση σε χρειάζεται! 🌿
                    </p>
                </div>
            </div>
        `;
        mainContent.querySelector('#start-cta-btn').onclick = () => navigate('register');
        root.appendChild(mainContent);
    } 
    else if (state.currentView === 'dashboard' && state.loggedInUser) {
        mainContent.appendChild(renderDashboard(navigate, state));
        root.appendChild(mainContent);
    }
    else {
        if (state.currentView === 'register') mainContent.appendChild(renderRegistrationForm(() => navigate('home')));
        if (state.currentView === 'login') mainContent.appendChild(renderLoginForm(() => navigate('home'), handleLoginSuccess));
        if (state.currentView === 'profile_edit') mainContent.appendChild(renderProfileEditForm(state.loggedInUser, () => navigate('dashboard'), handleProfileUpdate, handleLogout));
        if (state.currentView === 'create_action') mainContent.appendChild(renderCreateActionForm(state.loggedInUser, () => navigate('dashboard')));
        if (state.currentView === 'create_campaign') mainContent.appendChild(renderCreateCampaignForm(state.loggedInUser, () => navigate('dashboard')));
        if (state.currentView === 'manage_requests') mainContent.appendChild(renderManageRequests(state.loggedInUser, () => navigate('dashboard'), fetchDashboardData));
        if (state.currentView === 'browse_campaigns') mainContent.appendChild(renderBrowseCampaigns(state.loggedInUser, () => navigate('dashboard')));
        if (state.currentView === 'certificates') mainContent.appendChild(renderCertificatesDashboard(state.loggedInUser, () => navigate('dashboard')));
        if (state.currentView === 'db') mainContent.appendChild(renderDatabaseViewer(() => navigate(state.loggedInUser ? 'dashboard' : 'home')));
        if (state.currentView === 'search') {
            const container = document.createElement('div');
            container.style.cssText = "width: 100%; max-width: 800px; margin: 0 auto; padding: 20px;";
            container.appendChild(renderSearchActions(state.loggedInUser));
            mainContent.appendChild(container);
        }
        
        root.appendChild(mainContent);
    }

    renderSidebar();

    if (!state.loggedInUser && state.currentView === 'home') {
        const guestDbBtn = document.createElement('button');
        guestDbBtn.style.cssText = "font-family: var(--font-mono); background: transparent; border: none; color: rgba(255,255,255,0.2); font-size: 0.8rem; cursor: pointer; position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10;";
        guestDbBtn.textContent = "🛠️ db admin";
        guestDbBtn.onclick = () => navigate('db');
        root.appendChild(guestDbBtn);
    }
}

function renderSidebar() {
    if (state.isSidebarOpen) {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 998;";
        overlay.onclick = () => { state.isSidebarOpen = false; renderApp(); };
        document.getElementById('root').appendChild(overlay);
    }

    const sidebar = document.createElement('div');
    sidebar.style.cssText = `position: fixed; top: 0; left: ${state.isSidebarOpen ? '0' : '-300px'}; width: 260px; height: 100vh; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(15px); transition: left 0.3s ease-in-out; z-index: 1000; padding: 30px; box-sizing: border-box; color: #1b181b; box-shadow: ${state.isSidebarOpen ? '5px 0 20px rgba(0,0,0,0.5)' : 'none'};`;

    sidebar.innerHTML = `
        <button id="close-sidebar-btn" style="position: absolute; top: 28px; left: 30px; background: transparent; border: none; font-size: 2rem; cursor: pointer; color: #1b181b; padding: 0; line-height: 1;">✕</button>
        <h3 style="font-family: var(--font-heading); mt: 80px; font-size: 1.5rem; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px; margin-top: 60px;">μενού</h3>
        <ul style="list-style-type: none; padding: 0; font-family: var(--font-mono); font-size: 1.1rem; text-align: left;" id="sidebar-links-list"></ul>
    `;

    sidebar.querySelector('#close-sidebar-btn').onclick = () => { state.isSidebarOpen = false; renderApp(); };
    const list = sidebar.querySelector('#sidebar-links-list');

    if (!state.loggedInUser) {
        list.innerHTML = `
            <li id="side-link-home" style="margin: 20px 0; cursor: pointer;">αρχική</li>
            <li style="margin: 20px 0; color: #aaa; cursor: not-allowed;">σχετικά με εμάς</li>
            <li style="margin: 20px 0; color: #aaa; cursor: not-allowed;">επικοινωνία</li>
        `;
        list.querySelector('#side-link-home').onclick = () => navigate('home');
    } else {
        const user = state.loggedInUser;
        list.innerHTML = `
            <li id="side-link-dash" style="margin: 20px 0; cursor: pointer; color: var(--accent-color); font-weight: bold;">▸ dashboard</li>
            <li id="side-link-prof" style="margin: 20px 0; cursor: pointer;">το προφίλ μου</li>
        `;
        
        if (user.account_type === 'sponsor') {
            list.innerHTML += `<li id="side-link-browse" style="margin: 20px 0; cursor: pointer; color: #4f46e5; font-weight: bold;">💳 καμπάνιες χρηματοδότησης</li>`;
        } else {
            list.innerHTML += `
                <li id="side-link-cact" style="margin: 20px 0; cursor: pointer; color: var(--accent-color);">+ δημιουργία δράσης</li>
                <li id="side-link-ccamp" style="margin: 20px 0; cursor: pointer; color: #4f46e5;">+ δημιουργία καμπάνιας</li>
                <li id="side-link-mreq" style="margin: 20px 0; cursor: pointer; color: var(--accent-color); display: flex; align-items: center; gap: 10px;">
                    διαχείριση αιτήσεων
                    ${state.pendingRequestsCount > 0 ? `<span style="background: #ff4d4d; color: white; border-radius: 50%; padding: 2px 8px; font-size: 0.8rem; font-weight: bold;">${state.pendingRequestsCount}</span>` : ''}
                </li>
            `;
        }

        if (user.account_type === 'volunteer') {
            list.innerHTML += `<li id="side-link-certs" style="margin: 20px 0; cursor: pointer; color: #10b981; font-weight: bold;">🏆 τα πιστοποιητικά μου</li>`;
        }

        list.innerHTML += `
            <li id="side-link-db" style="margin: 20px 0; cursor: pointer; color: #10b981; font-weight: bold;">🔍 αναζήτηση δράσεων</li>
            <li style="margin: 20px 0; color: #aaa; cursor: not-allowed;">μηνύματα</li>
            <li style="margin: 20px 0; color: #aaa; cursor: not-allowed;">ρυθμίσεις</li>
            <li id="side-link-logout" style="margin: 20px 0; margin-top: 40px; cursor: pointer; color: #ff4d4d; font-weight: bold;">αποσύνδεση</li>
        `;

        list.querySelector('#side-link-dash').onclick = () => navigate('dashboard');
        list.querySelector('#side-link-prof').onclick = () => navigate('profile_edit');
        if (user.account_type === 'sponsor') list.querySelector('#side-link-browse').onclick = () => navigate('browse_campaigns');
        else {
            list.querySelector('#side-link-cact').onclick = () => navigate('create_action');
            list.querySelector('#side-link-ccamp').onclick = () => navigate('create_campaign');
            list.querySelector('#side-link-mreq').onclick = () => navigate('manage_requests');
        }
        if (user.account_type === 'volunteer') list.querySelector('#side-link-certs').onclick = () => navigate('certificates');
        list.querySelector('#side-link-db').onclick = () => navigate('dashboard'); 
        list.querySelector('#side-link-logout').onclick = () => handleLogout();
    }

    document.getElementById('root').appendChild(sidebar);
}

function setCurrentViewHomeOrDash() {
    setCurrentView(state.loggedInUser ? 'dashboard' : 'home');
}

function setCurrentView(view) {
    state.currentView = view;
    renderApp();
}

function handleLoginSuccess(user) {
    setLoggedInUser(user);
    navigate('dashboard');
}

function handleProfileUpdate(updatedUser) {
    state.loggedInUser = updatedUser;
    navigate('dashboard');
}

function handleLogout() {
    state.loggedInUser = null;
    state.notifications = [];
    state.pendingRequestsCount = 0;
    state.campaigns = [];
    navigate('home');
}

document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});