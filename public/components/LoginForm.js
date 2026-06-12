import { showToast } from '../app.js';

export function renderLoginForm(onBack, onSuccess) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.cssText = "width: 100%; max-width: 400px; margin: 0 auto; padding: 40px 30px; text-align: center; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 5px; font-size: 2rem;">Σύνδεση</h2>
        <p style="font-family: var(--font-mono); color: #ccc; font-size: 0.9rem; margin-bottom: 25px;">Καλώς ήρθες ξανά στο UniBite!</p>

        <form id="login-form" style="display: flex; flex-direction: column; gap: 15px;" novalidate>
            <input type="email" id="login-email" class="releaf-input" placeholder="Email" autocomplete="email" />
            <input type="password" id="login-password" class="releaf-input" placeholder="Κωδικός" autocomplete="current-password" />

            <div style="display: flex; gap: 10px; margin-top: -5px; justify-content: center;">
                <button type="button" id="btn-fill-admin" style="background: rgba(255,77,77,0.2); color: #ff4d4d; border: 1px solid #ff4d4d; border-radius: 20px; padding: 3px 10px; font-size: 0.75rem; cursor: pointer;">Autofill Admin</button>
            </div>

            <button type="submit" class="releaf-button" style="margin-top: 10px;">Σύνδεση</button>
            <button type="button" id="login-back-btn" class="releaf-button" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2);">Επιστροφή</button>
        </form>

        <div id="login-message" style="margin-top: 15px; font-family: var(--font-mono); font-size: 0.9rem; color: #ff4d4d;"></div>
    `;

    container.querySelector('#login-back-btn').onclick = onBack;
    container.querySelector('#btn-fill-admin').onclick = () => {
        container.querySelector('#login-email').value = 'admin@unibite.gr';
        container.querySelector('#login-password').value = 'admin123';
    };

    container.querySelector('#login-form').onsubmit = async (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value.trim();
        const password = container.querySelector('#login-password').value;
        const msgDiv = container.querySelector('#login-message');

        if (!email || !password) {
            msgDiv.style.color = '#ff4d4d';
            msgDiv.textContent = 'Παρακαλώ συμπληρώστε όλα τα πεδία.';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            msgDiv.style.color = '#ff4d4d';
            msgDiv.textContent = 'Μη έγκυρη μορφή email.';
            return;
        }

        msgDiv.textContent = 'Σύνδεση...';
        msgDiv.style.color = '#ccc';

        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (res.ok) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 30px 0; animation: fadeInUp 0.5s ease-out;">
                        <div style="font-size: 4rem; margin-bottom: 15px;">🍲</div>
                        <h2 style="font-family: var(--font-heading); color: var(--accent-color); margin-bottom: 10px;">Επιτυχής Σύνδεση!</h2>
                        <p style="font-family: var(--font-mono); color: #ddd; margin-bottom: 25px;">Καλώς ήρθες, ${data.user.username}</p>
                    </div>
                `;
                showToast(`Καλώς ήρθες, ${data.user.username}!`, 'success');
                setTimeout(() => onSuccess(data.user), 1500);
            } else {
                msgDiv.style.color = '#ff4d4d';
                msgDiv.textContent = data.detail;
            }
        } catch (error) {
            msgDiv.style.color = '#ff4d4d';
            msgDiv.textContent = 'Σφάλμα επικοινωνίας με τον server.';
        }
    };

    return container;
}