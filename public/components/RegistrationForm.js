// Αρχείο: public/components/RegistrationForm.js

export function renderRegistrationForm(onBack, onComplete) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.8); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); width: 380px; text-align: center;";

    // 1. Εσωτερικό State (Αντικαθιστά τα useState της React)
    const initialFormState = { username: '', email: '', password: '', full_name: '', account_type: 'volunteer', skills: '', resources: '' };
    let formState = { ...initialFormState };
    let step = 1;
    let errorMessage = '';

    // 2. Η συνάρτηση Render (Ανανεώνει το DOM δυναμικά)
    function render() {
        let html = '';

        // Τίτλος Φόρμας
        if (step !== 3) {
            html += `<h2 style="font-family: var(--font-mono); color: var(--accent-color);">${step === 1 ? 'προσωπικά στοιχεία' : 'συμπληρωματικά στοιχεία'}</h2>`;
        }

        // --- STEP 1: Προσωπικά Στοιχεία ---
        if (step === 1) {
            html += `
                <form id="form-step-1">
                    <input class="releaf-input" type="text" id="reg_fullname" autocomplete="off" placeholder="ονοματεπώνυμο" value="${formState.full_name}" />
                    <input class="releaf-input" type="text" id="reg_user_id" autocomplete="off" placeholder="username" value="${formState.username}" />
                    <input class="releaf-input" type="email" id="reg_email" autocomplete="username" placeholder="email (π.χ. test@test.com)" value="${formState.email}" />
                    <input class="releaf-input" type="password" id="reg_password" autocomplete="new-password" placeholder="password" value="${formState.password}" />
                    <div style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 10px; min-height: 20px;">${errorMessage}</div>
                    <button class="releaf-button" type="submit" style="margin-top: 15px;">επόμενο</button>
                </form>
            `;
        } 
        // --- STEP 2: Συμπληρωματικά Στοιχεία ---
        else if (step === 2) {
            html += `
                <form id="form-step-2">
                    <div style="font-family: var(--font-mono); font-size: 0.8rem; color: #ccc; margin-bottom: 20px; line-height: 1.6;">
                        επίλεξε τον ρόλο που σου ταιριάζει.<br/>
                        αν είσαι εθελοντής, δήλωσε τις γνώσεις σου.<br/>
                        αλλιώς, μπορείς να βοηθήσεις το έργο μας<br/>
                        ως οργανισμός ή ως χορηγός.
                    </div>
                    <select id="reg_account_type" class="releaf-input" style="-webkit-appearance: none; -moz-appearance: none; appearance: none; text-align: center; cursor: pointer;">
                        <option value="volunteer" ${formState.account_type === 'volunteer' ? 'selected' : ''}>εθελοντής</option>
                        <option value="organization" ${formState.account_type === 'organization' ? 'selected' : ''}>οργανισμός</option>
                        <option value="sponsor" ${formState.account_type === 'sponsor' ? 'selected' : ''}>χορηγός</option>
                    </select>
                    <input class="releaf-input" id="reg_skills" placeholder="δεξιότητες (π.χ. κηπουρική, pr)" value="${formState.skills}" />
                    <input class="releaf-input" id="reg_resources" placeholder="διαθέσιμα μέσα (π.χ. οχήματα, budget)" value="${formState.resources}" />
                    <div style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 10px; min-height: 20px;">${errorMessage}</div>
                    <button class="releaf-button" type="submit" style="margin-top: 15px;">υποβολή εγγραφής</button>
                </form>
            `;
        } 
        // --- STEP 3: Επιτυχία ---
        else if (step === 3) {
            html += `
                <div style="padding: 20px 0;">
                    <h2 style="font-family: var(--font-heading); color: #8db600; font-size: 2rem; margin: 0 0 10px 0;">επιτυχία!</h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6;">ο λογαριασμός σας δημιουργήθηκε.<br/>καλώς ήρθατε στο releaf.</p>
                    <button id="btn-finish" class="releaf-button" style="margin-top: 30px;">επιστροφή στο μενού</button>
                </div>
            `;
        }

        // Κουμπί Ακύρωσης στα βήματα 1 και 2
        if (step !== 3) {
            html += `
                <br />
                <button id="btn-cancel" class="releaf-button" type="button" style="background: transparent; border: 1px solid white; margin-top: 10px;">ακύρωση</button>
            `;
        }

        container.innerHTML = html;

        // 3. Εφαρμογή Event Listeners ΜΕΤΑ το render του HTML
        if (step === 1) {
            const fnameInput = container.querySelector('#reg_fullname');
            const userInput = container.querySelector('#reg_user_id');
            const emailInput = container.querySelector('#reg_email');
            const passInput = container.querySelector('#reg_password');

            fnameInput.addEventListener('input', e => formState.full_name = e.target.value);
            userInput.addEventListener('input', e => formState.username = e.target.value);
            emailInput.addEventListener('input', e => formState.email = e.target.value);
            passInput.addEventListener('input', e => formState.password = e.target.value);

            container.querySelector('#form-step-1').addEventListener('submit', (e) => {
                e.preventDefault();
                errorMessage = '';

                if (!formState.full_name || !formState.username || !formState.email || !formState.password) {
                    errorMessage = 'παρακαλώ συμπληρώστε όλα τα προσωπικά στοιχεία.';
                    render(); return;
                }
                if (formState.full_name.length < 2) { errorMessage = 'το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 2 χαρακτήρες.'; render(); return; }
                if (formState.username.length < 2) { errorMessage = 'το username πρέπει να έχει τουλάχιστον 2 χαρακτήρες.'; render(); return; }
                if (formState.password.length < 4) { errorMessage = 'το password πρέπει να έχει τουλάχιστον 4 χαρακτήρες.'; render(); return; }
                
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(formState.email)) {
                    errorMessage = 'το email πρέπει να έχει ΜΟΝΟ αγγλικούς χαρακτήρες, ένα "@" και ένα "."';
                    render(); return;
                }

                step = 2; // Μετάβαση στο Βήμα 2
                render();
            });
        } 
        else if (step === 2) {
            const typeInput = container.querySelector('#reg_account_type');
            const skillsInput = container.querySelector('#reg_skills');
            const resInput = container.querySelector('#reg_resources');

            typeInput.addEventListener('change', e => formState.account_type = e.target.value);
            skillsInput.addEventListener('input', e => formState.skills = e.target.value);
            resInput.addEventListener('input', e => formState.resources = e.target.value);

            container.querySelector('#form-step-2').addEventListener('submit', async (e) => {
                e.preventDefault();
                errorMessage = '';

                if (!formState.skills || !formState.resources) {
                    errorMessage = 'παρακαλώ συμπληρώστε τις δεξιότητες και τα μέσα.';
                    render(); return;
                }

                try {
                    const res = await fetch('/register', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(formState)
                    });
                    const data = await res.json();
                    
                    if(res.ok) {
                        step = 3;
                        onComplete(); // Ενημερώνουμε τον γονέα αν χρειάζεται
                        render();
                    } else {
                        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
                        if (["username", "email", "password", "full_name"].includes(errorMsg) || errorMsg.includes("Email") || errorMsg.includes("Username")) {
                            step = 1; // Επιστροφή στο Βήμα 1 αν το λάθος είναι εκεί
                        }
                        errorMessage = `σφάλμα: ${errorMsg}`;
                        render();
                    }
                } catch (err) {
                    errorMessage = "σφάλμα: δεν υπάρχει σύνδεση με το backend.";
                    render();
                }
            });
        } 
        else if (step === 3) {
            container.querySelector('#btn-finish').addEventListener('click', () => {
                formState = { ...initialFormState };
                step = 1;
                onBack(); // Επιστροφή στην αρχική
            });
        }

        // Κουμπί Ακύρωσης
        if (step !== 3) {
            container.querySelector('#btn-cancel').addEventListener('click', () => {
                formState = { ...initialFormState };
                errorMessage = '';
                step = 1;
                onBack();
            });
        }
    }

    // 4. Αρχική Κλήση Render
    render();
    
    return container;
}