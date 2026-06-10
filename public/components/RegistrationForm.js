export function renderRegistrationForm(onBack, onComplete) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.8); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); width: 380px; text-align: center;";

    let formState = { username: '', email: '', password: '', full_name: '', account_type: 'volunteer', skills: '', resources: '' };

    function renderStep1() {
        container.innerHTML = `
            <h2 style="font-family: var(--font-mono); color: var(--accent-color);">προσωπικά στοιχεία</h2>
            <form id="form-step-1">
                <input class="releaf-input" type="text" id="reg-name" placeholder="ονοματεπώνυμο" value="${formState.full_name}" />
                <input class="releaf-input" type="text" id="reg-user" placeholder="username" value="${formState.username}" />
                <input class="releaf-input" type="email" id="reg-email" placeholder="email" value="${formState.email}" />
                <input class="releaf-input" type="password" id="reg-pass" placeholder="password" value="${formState.password}" />
                <div id="error-msg" style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 10px; min-height: 20px;"></div>
                <button class="releaf-button" type="submit" style="margin-top: 15px;">επόμενο</button>
            </form>
            <button class="releaf-button" id="btn-cancel" style="background: transparent; border: 1px solid white; margin-top: 10px;">ακύρωση</button>
        `;

        container.querySelector('#btn-cancel').addEventListener('click', onBack);
        container.querySelector('#form-step-1').addEventListener('submit', (e) => {
            e.preventDefault();
            formState.full_name = container.querySelector('#reg-name').value;
            formState.username = container.querySelector('#reg-user').value;
            formState.email = container.querySelector('#reg-email').value;
            formState.password = container.querySelector('#reg-pass').value;

            if (!formState.full_name || !formState.username || !formState.email || !formState.password) {
                container.querySelector('#error-msg').textContent = 'παρακαλώ συμπληρώστε όλα τα προσωπικά στοιχεία.';
                return;
            }
            renderStep2();
        });
    }

    function renderStep2() {
        container.innerHTML = `
            <h2 style="font-family: var(--font-mono); color: var(--accent-color);">συμπληρωματικά στοιχεία</h2>
            <form id="form-step-2">
                <select id="reg-type" class="releaf-input" style="text-align: center; cursor: pointer;">
                    <option value="volunteer" ${formState.account_type === 'volunteer' ? 'selected' : ''}>εθελοντής</option>
                    <option value="organisation" ${formState.account_type === 'organisation' ? 'selected' : ''}>οργανισμός</option>
                    <option value="sponsor" ${formState.account_type === 'sponsor' ? 'selected' : ''}>χορηγός</option>
                </select>
                <input class="releaf-input" id="reg-skills" placeholder="δεξιότητες (π.χ. κηπουρική)" value="${formState.skills}" />
                <input class="releaf-input" id="reg-res" placeholder="διαθέσιμα μέσα (π.χ. οχήματα)" value="${formState.resources}" />
                <div id="error-msg-2" style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 10px; min-height: 20px;"></div>
                <button class="releaf-button" type="submit" style="margin-top: 15px;">υποβολή εγγραφής</button>
            </form>
            <button class="releaf-button" id="btn-back-1" style="background: transparent; border: 1px solid white; margin-top: 10px;">πίσω</button>
        `;

        container.querySelector('#btn-back-1').addEventListener('click', renderStep1);
        container.querySelector('#form-step-2').addEventListener('submit', async (e) => {
            e.preventDefault();
            formState.account_type = container.querySelector('#reg-type').value;
            formState.skills = container.querySelector('#reg-skills').value;
            formState.resources = container.querySelector('#reg-res').value;

            try {
                const res = await fetch('/register', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formState)
                });
                const data = await res.json();
                if (res.ok) renderStep3();
                else container.querySelector('#error-msg-2').textContent = data.detail;
            } catch (err) {
                container.querySelector('#error-msg-2').textContent = "Σφάλμα επικοινωνίας με server.";
            }
        });
    }

    function renderStep3() {
        container.innerHTML = `
            <div style="padding: 20px 0;">
                <h2 style="font-family: var(--font-heading); color: #8db600; font-size: 2rem; margin: 0 0 10px 0;">επιτυχία!</h2>
                <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6;">ο λογαριασμός σας δημιουργήθηκε.<br/>καλώς ήρθατε στο releaf.</p>
                <button id="btn-finish" class="releaf-button" style="margin-top: 30px;">σύνδεση</button>
            </div>
        `;
        container.querySelector('#btn-finish').addEventListener('click', onComplete);
    }

    renderStep1();
    return container;
}