export function renderProfileEditForm(currentUser, onBack, onUpdateSuccess, onLogout) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 40px; border-radius: 15px; width: 100%; max-width: 450px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;";

    // Κρατάμε τα αρχικά δεδομένα
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

    function renderForm() {
        container.innerHTML = `
            <h2 style="font-family: var(--font-heading); color: var(--accent-color); font-size: 2rem; margin: 0 0 20px 0;">Επεξεργασία Προφίλ</h2>
            
            <form id="profile-form" style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
                <div>
                    <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΟΝΟΜΑΤΕΠΩΝΥΜΟ</span>
                    <input class="releaf-input" id="prof-name" value="${formState.full_name}" required />
                </div>
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">USERNAME</span>
                        <input class="releaf-input" id="prof-user" value="${formState.username}" required />
                    </div>
                    <div style="flex: 1;">
                        <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">EMAIL</span>
                        <input type="email" class="releaf-input" id="prof-email" value="${formState.email}" required />
                    </div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΚΩΔΙΚΟΣ (PASSWORD)</span>
                    <input type="text" class="releaf-input" id="prof-pass" value="${formState.password}" required />
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 10px; padding-top: 15px;">
                    <span style="font-size: 0.75rem; color: #10b981; font-family: var(--font-mono);">ΔΕΞΙΟΤΗΤΕΣ & ΜΕΣΑ</span>
                    <input class="releaf-input" id="prof-skills" value="${formState.skills}" placeholder="Δεξιότητες..." />
                    <input class="releaf-input" id="prof-res" value="${formState.resources}" placeholder="Διαθέσιμα μέσα..." />
                </div>

                <div id="msg-area" style="text-align: center; font-weight: bold; font-family: var(--font-mono); min-height: 20px;"></div>

                <button class="releaf-button" type="submit" style="margin-top: 10px;">Αποθήκευση Αλλαγών</button>
                <button class="releaf-button" type="button" id="btn-cancel" style="background: transparent; border: 1px solid white;">Ακύρωση</button>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button class="releaf-button" type="button" id="btn-logout" style="background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; width: 100%;">Αποσύνδεση</button>
                </div>
            </form>
        `;

        container.querySelector('#btn-cancel').addEventListener('click', onBack);
        container.querySelector('#btn-logout').addEventListener('click', onLogout);

        container.querySelector('#profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            formState.full_name = container.querySelector('#prof-name').value;
            formState.username = container.querySelector('#prof-user').value;
            formState.email = container.querySelector('#prof-email').value;
            formState.password = container.querySelector('#prof-pass').value;
            formState.skills = container.querySelector('#prof-skills').value;
            formState.resources = container.querySelector('#prof-res').value;

            const msgArea = container.querySelector('#msg-area');
            msgArea.textContent = 'Αποθήκευση...';
            msgArea.style.color = '#ccc';

            try {
                const res = await fetch('/update-profile', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formState)
                });
                const data = await res.json();
                
                if (res.ok) {
                    msgArea.textContent = 'Επιτυχής τροποποίηση!';
                    msgArea.style.color = '#10b981';
                    // Ενημερώνουμε το global state
                    setTimeout(() => onUpdateSuccess({ ...currentUser, ...formState }), 1500);
                } else {
                    msgArea.textContent = data.detail || 'Αποτυχία.';
                    msgArea.style.color = '#ff4d4d';
                }
            } catch (err) {
                msgArea.textContent = 'Σφάλμα διακομιστή.';
                msgArea.style.color = '#ff4d4d';
            }
        });
    }

    renderForm();
    return container;
}