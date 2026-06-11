export function renderRegistrationForm(onBack) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.cssText = "width: 100%; max-width: 450px; margin: 0 auto; padding: 40px 30px; text-align: center; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 5px; font-size: 2rem;">Εγγραφή στο UniBite</h2>
        <p style="font-family: var(--font-mono); color: #ccc; font-size: 0.9rem; margin-bottom: 25px;">Μοιράσου το φαγητό σου, κέρδισε credits!</p>

        <form id="reg-form" style="display: flex; flex-direction: column; gap: 15px;">
            <input type="text" id="reg-username" class="releaf-input" placeholder="Όνομα Χρήστη" required />
            <input type="email" id="reg-email" class="releaf-input" placeholder="Email" required />
            <input type="password" id="reg-password" class="releaf-input" placeholder="Κωδικός" required />

            <button type="submit" class="releaf-button" style="margin-top: 10px;">Εγγραφή</button>
            <button type="button" id="reg-back-btn" class="releaf-button" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2);">Επιστροφή</button>
        </form>

        <div id="reg-message" style="margin-top: 15px; font-family: var(--font-mono); font-size: 0.9rem;"></div>
    `;

    container.querySelector('#reg-back-btn').onclick = onBack;

    container.querySelector('#reg-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = container.querySelector('#reg-username').value;
        const email = container.querySelector('#reg-email').value;
        const password = container.querySelector('#reg-password').value;
        const msgDiv = container.querySelector('#reg-message');

        try {
            const res = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            if (res.ok) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 30px 0; animation: fadeInUp 0.5s ease-out;">
                        <div style="font-size: 4rem; margin-bottom: 15px;">🎉</div>
                        <h2 style="font-family: var(--font-heading); color: var(--accent-color); margin-bottom: 10px;">Καλώς ήρθες!</h2>
                        <p style="font-family: var(--font-mono); color: #ddd; margin-bottom: 25px;">${data.message}</p>
                        <button id="success-back-btn" class="releaf-button">Επιστροφή στην Αρχική</button>
                    </div>
                `;
                container.querySelector('#success-back-btn').onclick = onBack;
            } else {
                msgDiv.style.color = '#ff4d4d';
                msgDiv.textContent = data.detail;
            }
        } catch (error) {
            msgDiv.style.color = '#ff4d4d';
            msgDiv.textContent = 'Σφάλμα σύνδεσης με τον server.';
        }
    };

    return container;
}