import { renderLoginForm } from './components/LoginForm.js';
import { renderRegistrationForm } from './components/RegistrationForm.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderCreateActionForm } from './components/CreateActionForm.js';
import { renderSearchActions } from './components/SearchActions.js';
import { renderManageRequests } from './components/ManageRequests.js';
import { renderCreateCampaignForm } from './components/CreateCampaignForm.js';
import { renderBrowseCampaigns } from './components/BrowseCampaigns.js';
import { renderDatabaseViewer } from './components/DatabaseViewer.js';

// === GLOBAL STATE ===
export const state = {
    loggedInUser: null,
    currentView: 'home',
    notifications: [],
    pendingRequestsCount: 0
};

// === DOM ELEMENTS ===
const root = document.getElementById('root');
const bgImage = document.getElementById('bg-image');

// === ROUTER (Πλοήγηση) ===
export function navigate(view) {
    state.currentView = view;
    render();
}

// === RENDER ENGINE (Αντί για React) ===
export function render() {
    // 1. Δυναμικό Background (Blur & Tint όπως στο Releaf)
    let blurLevel = 15; 
    let tint = 'rgba(27, 24, 27, 0.4)';
    if (['register', 'login', 'create_action', 'manage_requests', 'create_campaign'].includes(state.currentView)) {
        blurLevel = 3; tint = 'rgba(27, 24, 27, 0.75)';
    } else if (['db', 'actions', 'search', 'dashboard'].includes(state.currentView)) {
        blurLevel = 6; tint = 'rgba(27, 24, 27, 0.85)';
    }
    bgImage.style.filter = `blur(${blurLevel}px)`;
    bgImage.style.backgroundColor = tint;

    // 2. Καθαρισμός του DOM
    root.innerHTML = '';

    // 3. Render Topbar (αν δεν είμαστε στο Login/Register)
    if (!['login', 'register'].includes(state.currentView)) {
        root.appendChild(renderTopbar());
    }

    // 4. Render της κατάλληλης οθόνης
    const content = document.createElement('div');
    content.style.flex = '1';
    content.className = 'flex-center';

    if (state.currentView === 'home') {
        content.innerHTML = `
            <div style="display: flex; flex-direction: row; alignItems: center; justify-content: center; gap: 10%; padding: 0 50px;">
                <div style="display: flex; flex-direction: column; align-items: flex-start; max-width: 450px;">
                    <p style="font-family: var(--font-mono); font-size: 0.95rem; color: #ddd; margin-bottom: 30px; line-height: 1.6;">
                        Ενώνουμε εθελοντές, οργανισμούς και χορηγούς για να δημιουργήσουμε έναν πιο πράσινο κόσμο. 
                        Ανακάλυψε δράσεις στην περιοχή σου, πρόσφερε τον χρόνο ή τους πόρους σου, και κάνε τη διαφορά.
                    </p>
                    <img src="assets/tree.jpg" style="width: 100%; max-width: 350px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.4);" />
                </div>
                <div style="text-align: center;">
                    <button id="btn-start" class="releaf-button" style="font-size: 1.6rem; background: #10b981; border-radius: 12px; font-weight: bold; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);">
                        ξεκίνα μαζί μας!
                    </button>
                    <p style="font-family: var(--font-mono); font-weight: bold; margin-top:10px;">έλα και εσύ στην παρέα μας,<br/>η φύση σε χρειάζεται! 🌿</p>
                </div>
            </div>
        `;
        content.querySelector('#btn-start').addEventListener('click', () => navigate('register'));
    } 
    else if (state.currentView === 'login') {
        content.appendChild(renderLoginForm(
            () => navigate('home'), 
            (user) => { state.loggedInUser = user; navigate('dashboard'); } 
        ));
    }
    else if (state.currentView === 'register') {
        content.appendChild(renderRegistrationForm(
            () => navigate('home'), 
            () => navigate('login') 
        ));
    }
    else if (state.currentView === 'dashboard') {
        content.appendChild(renderDashboard(navigate, state));
    }
    else if (state.currentView === 'create_action') {
        content.appendChild(renderCreateActionForm(
            state.loggedInUser, 
            () => navigate('dashboard')
        ));
    }
    else if (state.currentView === 'manage_requests') {
        content.appendChild(renderManageRequests(
            state.loggedInUser, 
            () => navigate('dashboard')
        ));
    }
    else if (state.currentView === 'create_campaign') {
        content.appendChild(renderCreateCampaignForm(
            state.loggedInUser, 
            () => navigate('dashboard')
        ));
    }
    else if (state.currentView === 'campaigns') {
        content.appendChild(renderBrowseCampaigns(
            state.loggedInUser, 
            () => navigate('dashboard')
        ));
    }
    else if (state.currentView === 'db') {
        content.appendChild(renderDatabaseViewer(
            () => navigate('dashboard')
        ));
    }
    else if (state.currentView === 'search') {
        content.appendChild(renderSearchActions(
            state.loggedInUser, 
            () => navigate('dashboard')
        ));
    }
    
    root.appendChild(content);
  }

// Helper για το Topbar
function renderTopbar() {
    const nav = document.createElement('div');
    nav.style.display = 'flex';
    nav.style.justifyContent = 'space-between';
    nav.style.padding = '15px 30px';
    nav.style.zIndex = '10';

    nav.innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px;">
            <h1 style="font-family: var(--font-heading); font-size: 2.5rem; margin: 0; cursor: pointer;">RELEAF</h1>
        </div>
        <div style="display: flex; gap: 20px; align-items: center;">
            ${!state.loggedInUser ? `
                <button id="nav-register" class="releaf-button" style="background: #10b981; padding: 8px 18px; font-size: 0.85rem;">εγγραφή</button>
                <button id="nav-login" class="releaf-button" style="padding: 8px 18px; font-size: 0.85rem;">σύνδεση</button>
            ` : `
                <button id="nav-db" class="releaf-button" style="background: #4f46e5; padding: 8px 18px; font-size: 0.85rem; margin-right: 15px;">DB Admin 🛠️</button>
                
                <div style="width: 45px; height: 45px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: bold; cursor: pointer;">
                    ${state.loggedInUser.username.charAt(0).toUpperCase()}
                </div>
                <button id="nav-logout" class="releaf-button" style="background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 8px 18px; font-size: 0.85rem;">Logout</button>
            `}
        </div>
    `;

    if (!state.loggedInUser) {
        nav.querySelector('#nav-register').addEventListener('click', () => navigate('register'));
        nav.querySelector('#nav-login').addEventListener('click', () => navigate('login'));
    } else {
        nav.querySelector('#nav-logout').addEventListener('click', () => { state.loggedInUser = null; navigate('home'); });
    }

    return nav;
}

// Αρχικοποίηση
document.addEventListener('DOMContentLoaded', () => {
    navigate('home');
});