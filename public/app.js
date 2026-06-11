import { renderRegistrationForm } from './components/RegistrationForm.js';
import { renderLoginForm } from './components/LoginForm.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderFeed } from './components/Feed.js';
import { renderCreatePost } from './components/CreatePostForm.js';
import { renderAdminDashboard } from './components/AdminDashboard.js';
import { renderDatabaseViewer } from './components/DatabaseViewer.js';

export const state = {
    currentView: 'home',
    loggedInUser: null,
    isSidebarOpen: false
};

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
                renderApp();
            })
            .catch(e => console.error(e));
    } else {
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
    } else if (['dashboard', 'feed', 'admin', 'db'].includes(state.currentView)) {
        blurLevel = 10;
        tint = 'rgba(0, 0, 0, 0.85)'; 
    }
    bgImage.style.filter = `blur(${blurLevel}px)`;
    bgImage.style.backgroundColor = tint;

    // Topbar
    if (state.currentView === 'home' || state.currentView === 'dashboard' || state.currentView === 'feed' || state.currentView === 'admin') {
        const topbar = document.createElement('div');
        topbar.className = 'glass-panel';
        topbar.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; box-sizing: border-box; position: relative; z-index: 10; border-radius: 0; border-top: none; border-left: none; border-right: none;";
        
        topbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <button id="hamburger-menu-btn" style="background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer; padding: 0;">☰</button>
                <div id="logo-click" style="font-family: var(--font-heading); font-size: 1.8rem; color: #10b981; font-weight: bold; cursor: pointer; text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">UniBite</div>
            </div>

            <div style="display: flex; gap: 20px; align-items: center;">
                ${!state.loggedInUser ? `
                    <button id="nav-register-btn" class="releaf-button" style="background: #10b981; color: #fff; font-weight: bold; margin: 0; padding: 8px 18px; font-size: 0.85rem;">εγγραφή</button>
                    <button id="nav-login-btn" class="releaf-button" style="margin: 0; padding: 8px 18px; font-size: 0.85rem;">σύνδεση</button>
                ` : `
                    <div style="color: #10b981; font-family: var(--font-mono); font-weight: bold; font-size: 1.1rem; border: 1px solid #10b981; padding: 5px 10px; border-radius: 8px;">
                        🪙 ${state.loggedInUser.credits} Credits
                    </div>
                    <div id="avatar-btn" style="width: 45px; height: 45px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: bold; color: white; cursor: pointer; border: 2px solid rgba(255,255,255,0.2);">
                        ${state.loggedInUser.username.charAt(0).toUpperCase()}
                    </div>
                `}
            </div>
        `;

        topbar.querySelector('#hamburger-menu-btn').onclick = () => { state.isSidebarOpen = true; renderApp(); };
        topbar.querySelector('#logo-click').onclick = () => navigate(state.loggedInUser ? 'feed' : 'home');
        
        if (!state.loggedInUser) {
            topbar.querySelector('#nav-register-btn').onclick = () => navigate('register');
            topbar.querySelector('#nav-login-btn').onclick = () => navigate('login');
        } else {
            topbar.querySelector('#avatar-btn').onclick = () => navigate('dashboard');
        }
        root.appendChild(topbar);
    }

    const mainContent = document.createElement('div');
    mainContent.style.cssText = "flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;";

    if (state.currentView === 'home' && !state.loggedInUser) {
        mainContent.innerHTML = `
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8%; padding: 0 50px; margin-top: -5vh; width: 100%;">
                <div style="display: flex; flex-direction: column; align-items: flex-start; max-width: 450px;">
                    <h1 style="font-family: var(--font-heading); color: #fff; font-size: 3.5rem; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">Μοιράσου το φαγητό σου!</h1>
                    <p style="font-family: var(--font-mono); font-size: 1.1rem; color: #ddd; margin-bottom: 30px; line-height: 1.6; text-align: left; text-shadow: 0 2px 5px rgba(0,0,0,0.8);">
                        Μαγείρεψες παραπάνω; Μοιράσου τις μερίδες σου με συμφοιτητές, κέρδισε credits και δοκίμασε εσύ το φαγητό τους την επόμενη φορά!
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <button id="start-cta-btn" class="releaf-button" style="font-size: 2.5rem; padding: 25px 60px; background: #10b981; color: #fff; border-radius: 20px; font-weight: bold; box-shadow: 0 15px 50px rgba(16, 185, 129, 0.6); margin: 0; cursor: pointer; text-transform: uppercase;">
                        ΞΕΚΙΝΑ ΤΩΡΑ
                    </button>
                </div>
            </div>
        `;
        mainContent.querySelector('#start-cta-btn').onclick = () => navigate('register');
        root.appendChild(mainContent);
    } 
    else {
        if (state.currentView === 'register') mainContent.appendChild(renderRegistrationForm(() => navigate('home')));
        if (state.currentView === 'login') mainContent.appendChild(renderLoginForm(() => navigate('home'), (u) => { setLoggedInUser(u); navigate('feed'); }));
        
        if (state.loggedInUser) {
            if (state.currentView === 'dashboard') mainContent.appendChild(renderDashboard(navigate, state));
            if (state.currentView === 'feed') mainContent.appendChild(renderFeed(navigate, state));
            if (state.currentView === 'create_post') mainContent.appendChild(renderCreatePost(navigate, state));
            if (state.currentView === 'admin' && state.loggedInUser.role === 'admin') mainContent.appendChild(renderAdminDashboard(navigate, state));
        }
        
        if (state.currentView === 'db') mainContent.appendChild(renderDatabaseViewer(() => navigate(state.loggedInUser ? 'feed' : 'home')));
        
        root.appendChild(mainContent);
    }

    // Floating DB Admin button
    const dbBtn = document.createElement('button');
    dbBtn.style.cssText = "position: fixed; bottom: 20px; left: 20px; background: rgba(0,0,0,0.5); color: #aaa; border: 1px solid #555; padding: 5px 10px; border-radius: 5px; font-family: var(--font-mono); font-size: 0.8rem; cursor: pointer; z-index: 100;";
    dbBtn.textContent = "🛠️ db admin";
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
        <button id="close-sidebar-btn" style="position: absolute; top: 28px; left: 30px; background: transparent; border: none; font-size: 2rem; cursor: pointer; color: #fff; padding: 0; line-height: 1;">✕</button>
        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: #10b981; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-top: 60px;">μενού</h3>
        <ul style="list-style-type: none; padding: 0; font-family: var(--font-mono); font-size: 1.1rem; text-align: left;" id="sidebar-links-list"></ul>
    `;

    sidebar.querySelector('#close-sidebar-btn').onclick = () => { state.isSidebarOpen = false; renderApp(); };
    const list = sidebar.querySelector('#sidebar-links-list');

    if (!state.loggedInUser) {
        list.innerHTML = `
            <li id="side-link-home" style="margin: 20px 0; cursor: pointer; color: #fff;">Αρχική</li>
            <li id="side-link-login" style="margin: 20px 0; cursor: pointer; color: #fff;">Σύνδεση</li>
        `;
        list.querySelector('#side-link-home').onclick = () => navigate('home');
        list.querySelector('#side-link-login').onclick = () => navigate('login');
    } else {
        list.innerHTML = `
            <li id="side-link-feed" style="margin: 20px 0; cursor: pointer; color: #10b981; font-weight: bold;">🌍 Feed (Αγγελίες)</li>
            <li id="side-link-cpost" style="margin: 20px 0; cursor: pointer; color: #fff;">+ Δώσε Φαγητό</li>
            <li id="side-link-dash" style="margin: 20px 0; cursor: pointer; color: #fff;">📊 Το Dashboard μου</li>
        `;
        
        if (state.loggedInUser.role === 'admin') {
            list.innerHTML += `<li id="side-link-admin" style="margin: 20px 0; cursor: pointer; color: #ff4d4d; font-weight: bold;">🛠️ Admin Panel</li>`;
        }

        list.innerHTML += `<li id="side-link-logout" style="margin: 20px 0; margin-top: 40px; cursor: pointer; color: #aaa;">Αποσύνδεση</li>`;

        list.querySelector('#side-link-feed').onclick = () => navigate('feed');
        list.querySelector('#side-link-cpost').onclick = () => navigate('create_post');
        list.querySelector('#side-link-dash').onclick = () => navigate('dashboard');
        
        if (state.loggedInUser.role === 'admin') {
            list.querySelector('#side-link-admin').onclick = () => navigate('admin');
        }

        list.querySelector('#side-link-logout').onclick = () => {
            state.loggedInUser = null;
            navigate('home');
        };
    }

    document.getElementById('root').appendChild(sidebar);
}

document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});