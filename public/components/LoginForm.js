// Αρχείο: public/components/LoginForm.js

export function renderLoginForm(onBack, onLoginSuccess) {
    // 1. Δημιουργία του κεντρικού Container με τα αρχικά styles
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.8); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); width: 380px; text-align: center;";

    // 2. Εσωτερικό State (Αντικαθιστά το useState της React)
    let formState = { email: '', password: '' };
    let step = 1; 
    let result = { status: '', message: '' };

    // 3. Η συνάρτηση Render (Ανανεώνει το HTML με βάση το State)
    function render() {
        if (step === 1) {
            container.innerHTML = `
                <h2 style="font-family: var(--font-mono); color: var(--accent-color); margin-bottom: 20px;">σύνδεση</h2>
                <form id="login-form">
                    <input class="releaf-input" type="email" id="login-email" name="email" autocomplete="username" placeholder="email" required />
                    <input class="releaf-input" type="password" id="login-password" name="password" autocomplete="current-password" placeholder="password" required />
                    <button class="releaf-button" type="submit" style="margin-top: 20px;">είσοδος</button>
                </form>
                <br />
                <button id="btn-cancel" class="releaf-button" type="button" style="background: transparent; border: 1px solid white; margin-top: 10px;">ακύρωση</button>
            `;

            // Επαναφορά τιμών (Αν ο χρήστης γυρίσει από το Step 2, να μην έχουν σβηστεί)
            const emailInput = container.querySelector('#login-email');
            const passwordInput = container.querySelector('#login-password');
            emailInput.value = formState.email;
            passwordInput.value = formState.password;

            // Ενημέρωση του State όταν πληκτρολογεί (Αντίστοιχο του onChange)
            emailInput.addEventListener('input', (e) => formState.email = e.target.value);
            passwordInput.addEventListener('input', (e) => formState.password = e.target.value);

            // Κουμπί Ακύρωσης
            container.querySelector('#btn-cancel').addEventListener('click', onBack);

            // Υποβολή (Submit)
            container.querySelector('#login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // ΤΟ ΜΑΓΙΚΟ ΚΟΛΠΟ: Ξε-εστιάζει τα πεδία, οπότε ο Firefox νομίζει ότι η φόρμα υποβλήθηκε κανονικά!
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                if (!formState.email || !formState.password) {
                    result = { status: 'error', message: 'παρακαλώ συμπληρώστε όλα τα πεδία.' };
                    step = 2;
                    render(); // Επανασχεδιασμός σε Step 2
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
                        result = { status: 'success', message: 'επιτυχής σύνδεση! δημιουργία συνεδρίας...' };
                        step = 2;
                        render(); // Επανασχεδιασμός σε Step 2
                        
                        setTimeout(() => {
                            // Το app.js περιμένει έναν user (και ειδοποιήσεις, αν τις χρειαζόταν εδώ)
                            onLoginSuccess(data.user);
                        }, 1500);
                    } else {
                        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
                        result = { status: 'error', message: errorMsg };
                        step = 2;
                        render();
                    }
                } catch (err) {
                    result = { status: 'error', message: "δεν υπάρχει σύνδεση με τον διακομιστή." };
                    step = 2;
                    render();
                }
            });

        } else if (step === 2) {
            container.innerHTML = `
                <div style="padding: 20px 0;">
                    <h2 style="font-family: var(--font-heading); color: ${result.status === 'success' ? '#8db600' : '#ff4d4d'}; font-size: 2rem; margin: 0 0 10px 0;">
                        ${result.status === 'success' ? 'επιτυχία!' : 'σφάλμα!'}
                    </h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6;">
                        ${result.message}
                    </p>
                    ${result.status === 'error' ? `
                        <button id="btn-retry" class="releaf-button" style="margin-top: 30px;">
                            δοκιμή ξανά
                        </button>
                    ` : ''}
                </div>
            `;

            // Αν υπάρχει σφάλμα, επιτρέπουμε στο χρήστη να πατήσει "δοκιμή ξανά"
            if (result.status === 'error') {
                container.querySelector('#btn-retry').addEventListener('click', () => {
                    step = 1;
                    render(); // Επιστροφή στο Step 1
                });
            }
        }
    }

    // 4. Αρχική Κλήση του Render
    render();

    return container;
}