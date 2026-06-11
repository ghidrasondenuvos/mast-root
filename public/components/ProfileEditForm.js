// Αρχείο: public/components/ProfileEditForm.js

export function renderProfileEditForm(currentUser, onBack, onUpdateSuccess, onLogout) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.95); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); width: 380px; text-align: center;";

    // 1. Εσωτερικό State (Αρχικοποιούμε με τα ΗΔΗ ΥΠΑΡΧΟΝΤΑ στοιχεία του χρήστη)
    let formState = {
        user_id: currentUser.id,
        username: currentUser.username || '',
        email: currentUser.email || '',
        password: currentUser.password || '',
        full_name: currentUser.full_name || '',
        account_type: currentUser.account_type || 'volunteer',
        skills: currentUser.skills || '',
        resources: currentUser.resources || ''
    };
    
    let step = 1;
    let result = { status: '', message: '' };

    // 2. Η συνάρτηση Render
    function render() {
        let html = '';

        if (step === 1) {
            html += `
                <h2 style="font-family: var(--font-mono); color: var(--accent-color); margin-bottom: 20px;">επεξεργασία προφίλ</h2>
                <form id="profile-form" style="display: flex; flex-direction: column; gap: 8px;">
                    <input class="releaf-input" id="prof-name" placeholder="ονοματεπώνυμο" value="${formState.full_name}" style="margin: 0; width: 100%; box-sizing: border-box;" />
                    <input class="releaf-input" id="prof-user" placeholder="username" value="${formState.username}" style="margin: 0; width: 100%; box-sizing: border-box;" />
                    <input class="releaf-input" type="email" id="prof-email" placeholder="email" value="${formState.email}" style="margin: 0; width: 100%; box-sizing: border-box;" />
                    <input class="releaf-input" type="text" id="prof-pass" placeholder="νέος κωδικός" value="${formState.password}" style="margin: 0; width: 100%; box-sizing: border-box;" />
                    
                    <select id="prof-type" class="releaf-input" style="-webkit-appearance: none; -moz-appearance: none; appearance: none; text-align: center; cursor: pointer; margin: 0; width: 100%; box-sizing: border-box;">
                        <option value="volunteer" ${formState.account_type === 'volunteer' ? 'selected' : ''}>εθελοντής</option>
                        <option value="organization" ${formState.account_type === 'organization' ? 'selected' : ''}>οργανισμός</option>
                        <option value="sponsor" ${formState.account_type === 'sponsor' ? 'selected' : ''}>χορηγός</option>
                    </select>

                    <input class="releaf-input" id="prof-skills" placeholder="δεξιότητες" value="${formState.skills}" style="margin: 0; width: 100%; box-sizing: border-box;" />
                    <input class="releaf-input" id="prof-res" placeholder="διαθέσιμα μέσα" value="${formState.resources}" style="margin: 0; width: 100%; box-sizing: border-box;" />
                    
                    <button class="releaf-button" type="submit" style="margin-top: 15px;">αποθήκευση αλλαγών</button>
                </form>
                
                <button id="btn-cancel" class="releaf-button" type="button" style="background: transparent; border: 1px solid white; margin-top: 10px;">ακύρωση</button>

                <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button id="btn-logout" class="releaf-button" type="button" style="background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; width: 100%; margin: 0; box-sizing: border-box; font-weight: bold;">
                        αποσύνδεση
                    </button>
                </div>
            `;
        } 
        else if (step === 2) {
            html += `
                <div style="padding: 20px 0;">
                    <h2 style="font-family: var(--font-heading); color: ${result.status === 'success' ? '#8db600' : '#ff4d4d'}; font-size: 2rem; margin: 0 0 10px 0;">
                        ${result.status === 'success' ? 'επιτυχής τροποποίηση!' : 'αποτυχία!'}
                    </h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6;">${result.message}</p>
                    ${result.status === 'error' ? `
                        <button id="btn-retry" class="releaf-button" style="margin-top: 30px;">δοκιμή ξανά</button>
                    ` : ''}
                </div>
            `;
        }

        container.innerHTML = html;

        // 3. Event Listeners
        if (step === 1) {
            const nameInput = container.querySelector('#prof-name');
            const userInput = container.querySelector('#prof-user');
            const emailInput = container.querySelector('#prof-email');
            const passInput = container.querySelector('#prof-pass');
            const typeInput = container.querySelector('#prof-type');
            const skillsInput = container.querySelector('#prof-skills');
            const resInput = container.querySelector('#prof-res');

            nameInput.addEventListener('input', e => formState.full_name = e.target.value);
            userInput.addEventListener('input', e => formState.username = e.target.value);
            emailInput.addEventListener('input', e => formState.email = e.target.value);
            passInput.addEventListener('input', e => formState.password = e.target.value);
            typeInput.addEventListener('change', e => formState.account_type = e.target.value);
            skillsInput.addEventListener('input', e => formState.skills = e.target.value);
            resInput.addEventListener('input', e => formState.resources = e.target.value);

            // Κουμπιά ελέγχου (Ακύρωση / Αποσύνδεση)
            container.querySelector('#btn-cancel').addEventListener('click', onBack);
            container.querySelector('#btn-logout').addEventListener('click', onLogout);

            // Υποβολή (Submit)
            container.querySelector('#profile-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                if (!formState.full_name || !formState.username || !formState.email || !formState.password || !formState.skills || !formState.resources) {
                    result = { status: 'error', message: 'παρακαλώ συμπληρώστε όλα τα πεδία.' };
                    step = 2; render(); return;
                }

                try {
                    const res = await fetch('/update-profile', {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(formState)
                    });
                    const data = await res.json();
                    
                    if(res.ok) {
                        result = { status: 'success', message: 'επιτυχής τροποποίηση!' };
                        step = 2; render();
                        setTimeout(() => {
                            onUpdateSuccess(data.user); // Γυρνάει τον ανανεωμένο χρήστη στο app.js
                        }, 1500);
                    } else {
                        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
                        result = { status: 'error', message: errorMsg };
                        step = 2; render();
                    }
                } catch (err) {
                    result = { status: 'error', message: "δεν υπάρχει σύνδεση με τον διακομιστή." };
                    step = 2; render();
                }
            });
        } 
        else if (step === 2) {
            if (result.status === 'error') {
                container.querySelector('#btn-retry').addEventListener('click', () => {
                    step = 1; render();
                });
            }
        }
    }

    render();
    return container;
}