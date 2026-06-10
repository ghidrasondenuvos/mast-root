export function renderLoginForm(onBack, onLoginSuccess) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.8); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); width: 380px; text-align: center;";

    container.innerHTML = `
        <div id="step-1">
            <h2 style="font-family: var(--font-mono); color: var(--accent-color); margin-bottom: 20px;">σύνδεση</h2>
            <form id="login-form">
                <input class="releaf-input" type="email" id="login-email" placeholder="email" required />
                <input class="releaf-input" type="password" id="login-password" placeholder="password" required />
                <button class="releaf-button" type="submit" style="margin-top: 20px;">είσοδος</button>
            </form>
            <button class="releaf-button" id="btn-back" style="background: transparent; border: 1px solid white; margin-top: 10px;">ακύρωση</button>
        </div>
        <div id="step-2" class="hidden" style="padding: 20px 0;">
            <h2 id="result-title" style="font-family: var(--font-heading); font-size: 2rem; margin: 0 0 10px 0;"></h2>
            <p id="result-msg" style="font-family: var(--font-mono); color: #fff; line-height: 1.6;"></p>
            <button id="btn-retry" class="releaf-button hidden" style="margin-top: 30px;">δοκιμή ξανά</button>
        </div>
    `;

    container.querySelector('#btn-back').addEventListener('click', onBack);

    container.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value;
        const password = container.querySelector('#login-password').value;

        container.querySelector('#step-1').classList.add('hidden');
        container.querySelector('#step-2').classList.remove('hidden');

        try {
            const res = await fetch('/login', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                container.querySelector('#result-title').textContent = 'επιτυχία!';
                container.querySelector('#result-title').style.color = '#8db600';
                container.querySelector('#result-msg').textContent = 'επιτυχής σύνδεση! δημιουργία συνεδρίας...';
                setTimeout(() => onLoginSuccess(data.user), 1500);
            } else {
                showError(data.detail);
            }
        } catch (err) {
            showError("δεν υπάρχει σύνδεση με τον διακομιστή.");
        }
    });

    function showError(msg) {
        container.querySelector('#result-title').textContent = 'σφάλμα!';
        container.querySelector('#result-title').style.color = '#ff4d4d';
        container.querySelector('#result-msg').textContent = msg;
        const retryBtn = container.querySelector('#btn-retry');
        retryBtn.classList.remove('hidden');
        retryBtn.onclick = () => {
            container.querySelector('#step-2').classList.add('hidden');
            container.querySelector('#step-1').classList.remove('hidden');
            retryBtn.classList.add('hidden');
        };
    }

    return container;
}