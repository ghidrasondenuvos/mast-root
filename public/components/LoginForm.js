import { showToast, sanitize } from '../app.js';

export function renderLoginForm(navigate, onLoginSuccess) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "width: 100%; display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 120px);";

    const container = document.createElement('div');
    container.className = 'glass-panel fade-in-up';
    container.style.cssText = "width: 100%; max-width: 420px; padding: var(--space-2xl) var(--space-xl); text-align: center;";

    container.innerHTML = `
        <div style="margin-bottom: var(--space-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--space-sm);">🍲</div>
            <h2 class="font-heading" style="font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, var(--accent), #FBBF24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: var(--space-xs);">UniBite</h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">Καλώς ήρθες ξανά!</p>
        </div>

        <form id="login-form" style="display: flex; flex-direction: column; gap: var(--space-md); text-align: left;">
            <div>
                <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Email</label>
                <input type="email" id="login-email" class="releaf-input" placeholder="student@upatras.gr" required />
            </div>
            
            <div>
                <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Κωδικός Πρόσβασης</label>
                <input type="password" id="login-password" class="releaf-input" placeholder="••••••••" required />
            </div>

            <button type="submit" class="releaf-button" style="width: 100%; justify-content: center; margin-top: var(--space-sm); padding: 14px;">Σύνδεση</button>
            <div id="login-msg" style="color: var(--danger); font-size: 0.85rem; text-align: center; min-height: 20px; margin-top: var(--space-xs);"></div>
        </form>

        <div style="margin-top: var(--space-xl); border-top: 1px solid var(--border); padding-top: var(--space-lg);">
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Δεν έχεις λογαριασμό; 
                <button type="button" id="go-register" style="background: none; border: none; color: var(--accent); font-weight: 600; cursor: pointer; padding: 0; font-family: var(--font-main);">Εγγράψου →</button>
            </p>
        </div>
    `;

    container.querySelector('#go-register').onclick = (e) => { e.preventDefault(); navigate('register'); };

    container.querySelector('#login-form').onsubmit = async (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value.trim();
        const password = container.querySelector('#login-password').value;
        const msgDiv = container.querySelector('#login-msg');
        const btn = container.querySelector('button[type="submit"]');

        msgDiv.textContent = '';
        btn.textContent = 'Σύνδεση...';
        btn.disabled = true;

        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                showToast('Επιτυχής σύνδεση!', 'success');
                onLoginSuccess(data.user);
            } else {
                msgDiv.textContent = sanitize(data.detail || 'Σφάλμα σύνδεσης');
                btn.textContent = 'Σύνδεση';
                btn.disabled = false;
            }
        } catch (err) {
            msgDiv.textContent = 'Σφάλμα επικοινωνίας με τον server.';
            btn.textContent = 'Σύνδεση';
            btn.disabled = false;
        }
    };

    wrapper.appendChild(container);
    return wrapper;
}