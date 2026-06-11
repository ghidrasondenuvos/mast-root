// Αρχείο: public/components/LoginForm.js

export function renderLoginForm(onBack, onLoginSuccess) {
    // 1. Δημιουργία του κεντρικού Container με τα νέα styles
    const container = document.createElement('div');
    container.className = 'glass-panel fade-in-up';
    container.style.cssText = "padding: 50px 40px; width: 100%; max-width: 400px; text-align: center; margin: auto; box-sizing: border-box;";

    // 2. Εσωτερικό State
    let formState = { email: '', password: '' };
    let step = 1; 
    let result = { status: '', message: '' };

    // 3. Η συνάρτηση Render
    function render() {
        if (step === 1) {
            container.innerHTML = `
                <div class="fade-in-up">
                    <h2 style="font-family: var(--font-heading); color: var(--accent-color); font-size: 2.2rem; margin: 0 0 10px 0; letter-spacing: 1px;">Σύνδεση</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px; font-size: 0.95rem;">Καλώς ήρθατε πίσω στο Releaf</p>
                    <form id="login-form" style="display: flex; flex-direction: column; gap: 15px;">
                        <input class="releaf-input" type="email" id="login-email" name="email" autocomplete="username" placeholder="Διεύθυνση Email" required />
                        <input class="releaf-input" type="password" id="login-password" name="password" autocomplete="current-password" placeholder="Κωδικός Πρόσβασης" required />
                        <button class="releaf-button" type="submit" style="margin-top: 15px; width: 100%;">Είσοδος</button>
                    </form>
                    <div style="margin-top: 25px;">
                        <button id="btn-cancel" class="releaf-button secondary" type="button" style="width: 100%;">Ακύρωση</button>
                    </div>
                </div>
            `;

            const emailInput = container.querySelector('#login-email');
            const passwordInput = container.querySelector('#login-password');
            emailInput.value = formState.email;
            passwordInput.value = formState.password;

            emailInput.addEventListener('input', (e) => formState.email = e.target.value);
            passwordInput.addEventListener('input', (e) => formState.password = e.target.value);

            container.querySelector('#btn-cancel').addEventListener('click', onBack);

            container.querySelector('#login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                if (!formState.email || !formState.password) {
                    result = { status: 'error', message: 'Παρακαλώ συμπληρώστε όλα τα πεδία.' };
                    step = 2;
                    render();
                    return;
                }

                try {
                    const res = await fetch('/login', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(formState)
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        result = { status: 'success', message: 'Επιτυχής σύνδεση! Ανακατεύθυνση...' };
                        step = 2;
                        render();
                        
                        setTimeout(() => {
                            onLoginSuccess(data.user);
                        }, 1500);
                    } else {
                        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
                        result = { status: 'error', message: errorMsg };
                        step = 2;
                        render();
                    }
                } catch (err) {
                    result = { status: 'error', message: "Δεν υπάρχει σύνδεση με τον διακομιστή." };
                    step = 2;
                    render();
                }
            });

        } else if (step === 2) {
            const isSuccess = result.status === 'success';
            container.innerHTML = `
                <div class="fade-in-up" style="padding: 30px 0;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">
                        ${isSuccess ? '🌱' : '⚠️'}
                    </div>
                    <h2 style="font-family: var(--font-heading); color: ${isSuccess ? 'var(--accent-color)' : '#ef4444'}; font-size: 2rem; margin: 0 0 15px 0;">
                        ${isSuccess ? 'Επιτυχία!' : 'Σφάλμα!'}
                    </h2>
                    <p style="font-family: var(--font-main); color: var(--text-primary); font-size: 1.1rem; line-height: 1.6;">
                        ${result.message}
                    </p>
                    ${!isSuccess ? `
                        <button id="btn-retry" class="releaf-button secondary" style="margin-top: 30px; width: 100%;">
                            Δοκιμή Ξανά
                        </button>
                    ` : ''}
                </div>
            `;

            if (!isSuccess) {
                container.querySelector('#btn-retry').addEventListener('click', () => {
                    step = 1;
                    render();
                });
            }
        }
    }

    render();
    return container;
}