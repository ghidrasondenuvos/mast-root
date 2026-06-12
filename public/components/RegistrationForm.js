import { showToast, sanitize } from '../app.js';

export function renderRegistrationForm(navigate) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "width: 100%; display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 120px); padding: var(--space-xl) 0;";

    const container = document.createElement('div');
    container.className = 'glass-panel fade-in-up';
    container.style.cssText = "width: 100%; max-width: 460px; padding: var(--space-2xl) var(--space-xl); text-align: center;";

    container.innerHTML = `
        <div style="margin-bottom: var(--space-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--space-sm);">🍲</div>
            <h2 class="font-heading" style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xs);">Γίνε μέλος</h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">Ξεκίνα να μοιράζεσαι φαγητό σήμερα!</p>
        </div>

        <div id="register-success" class="hidden" style="animation: scaleIn 0.3s ease;">
            <div style="font-size: 4rem; color: var(--success); margin-bottom: var(--space-md);">✅</div>
            <h3 class="font-heading" style="color: var(--success); margin-bottom: var(--space-sm);">Η εγγραφή ολοκληρώθηκε!</h3>
            <p style="color: var(--text-secondary); margin-bottom: var(--space-xl);">Ο λογαριασμός σου δημιουργήθηκε με επιτυχία.</p>
            <button id="go-login-success" class="releaf-button" style="width: 100%; justify-content: center; padding: 14px;">Σύνδεση τώρα</button>
        </div>

        <form id="register-form" style="display: flex; flex-direction: column; gap: var(--space-md); text-align: left;">
            <div>
                <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Όνομα Χρήστη</label>
                <input type="text" id="reg-username" class="releaf-input" placeholder="π.χ. MariaK" required maxlength="100" />
            </div>
            
            <div>
                <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Ιδρυματικό Email</label>
                <input type="email" id="reg-email" class="releaf-input" placeholder="up10123@upnet.gr" required />
                <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">Προτείνεται η χρήση πανεπιστημιακού email.</p>
            </div>
            
            <div>
                <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Κωδικός Πρόσβασης</label>
                <input type="password" id="reg-password" class="releaf-input" placeholder="Τουλάχιστον 6 χαρακτήρες" required minlength="4" />
            </div>

            <button type="submit" class="releaf-button" style="width: 100%; justify-content: center; margin-top: var(--space-sm); padding: 14px;">Δημιουργία Λογαριασμού</button>
            <div id="reg-msg" style="color: var(--danger); font-size: 0.85rem; text-align: center; min-height: 20px; margin-top: var(--space-xs);"></div>
        </form>

        <div id="register-footer" style="margin-top: var(--space-xl); border-top: 1px solid var(--border); padding-top: var(--space-lg);">
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Έχεις ήδη λογαριασμό; 
                <button type="button" id="go-login" style="background: none; border: none; color: var(--accent); font-weight: 600; cursor: pointer; padding: 0; font-family: var(--font-main);">Σύνδεση →</button>
            </p>
        </div>
    `;

    container.querySelector('#go-login').onclick = (e) => { e.preventDefault(); navigate('login'); };
    container.querySelector('#go-login-success').onclick = () => navigate('login');

    container.querySelector('#register-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = container.querySelector('#reg-username').value.trim();
        const email = container.querySelector('#reg-email').value.trim();
        const password = container.querySelector('#reg-password').value;
        const msgDiv = container.querySelector('#reg-msg');
        const btn = container.querySelector('button[type="submit"]');

        msgDiv.textContent = '';
        btn.textContent = 'Εγγραφή...';
        btn.disabled = true;

        try {
            const res = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                container.querySelector('#register-form').classList.add('hidden');
                container.querySelector('#register-footer').classList.add('hidden');
                container.querySelector('#register-success').classList.remove('hidden');
            } else {
                msgDiv.textContent = sanitize(data.detail || 'Σφάλμα εγγραφής');
                btn.textContent = 'Δημιουργία Λογαριασμού';
                btn.disabled = false;
            }
        } catch (err) {
            msgDiv.textContent = 'Σφάλμα επικοινωνίας με τον server.';
            btn.textContent = 'Δημιουργία Λογαριασμού';
            btn.disabled = false;
        }
    };

    wrapper.appendChild(container);
    return wrapper;
}