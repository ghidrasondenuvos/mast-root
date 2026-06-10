export function renderCreateCampaignForm(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 40px; border-radius: 15px; width: 100%; max-width: 450px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;";

    let userActions = [];
    let formState = { title: '', description: '', goal_amount: '', action_id: '' };

    // 1. Φόρτωση Δράσεων του Οργανισμού
    async function loadActions() {
        container.innerHTML = '<p style="color: #ccc;">Έλεγχος διαθέσιμων δράσεων...</p>';
        try {
            const res = await fetch(`/api/user-actions/${currentUser.id}`);
            userActions = await res.json();
            renderForm();
        } catch (err) {
            container.innerHTML = '<p style="color: #ff4d4d;">Σφάλμα ελέγχου δράσεων.</p>';
        }
    }

    // 2. Εμφάνιση της Φόρμας
    function renderForm() {
        if (userActions.length === 0) {
            container.innerHTML = `
                <h2 style="font-family: var(--font-heading); color: #ff4d4d; font-size: 1.8rem;">Αδυναμία Δημιουργίας</h2>
                <p style="font-family: var(--font-mono); color: #ccc; margin: 20px 0;">Πρέπει πρώτα να δημιουργήσετε τουλάχιστον μία Περιβαλλοντική Δράση πριν ζητήσετε χρηματοδότηση.</p>
                <button class="releaf-button" id="btn-back-error">Επιστροφή</button>
            `;
            container.querySelector('#btn-back-error').addEventListener('click', onBack);
            return;
        }

        container.innerHTML = `
            <h2 style="font-family: var(--font-heading); color: #4f46e5; font-size: 2rem; margin: 0 0 20px 0;">Νέα Καμπάνια</h2>
            <form id="campaign-form" style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
                
                <div>
                    <span style="font-size: 0.75rem; color: #4f46e5; font-family: var(--font-mono);">ΣΧΕΤΙΖΟΜΕΝΗ ΔΡΑΣΗ</span>
                    <select class="releaf-input" id="camp-action" required>
                        <option value="" disabled selected>Επιλέξτε Δράση...</option>
                        ${userActions.map(a => `<option value="${a.id}">${a.title}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <span style="font-size: 0.75rem; color: #4f46e5; font-family: var(--font-mono);">ΤΙΤΛΟΣ ΚΑΜΠΑΝΙΑΣ</span>
                    <input class="releaf-input" id="camp-title" placeholder="π.χ. Αγορά δενδρυλλίων" required />
                </div>

                <div>
                    <span style="font-size: 0.75rem; color: #4f46e5; font-family: var(--font-mono);">ΠΕΡΙΓΡΑΦΗ & ΣΤΟΧΟΣ</span>
                    <textarea class="releaf-input" id="camp-desc" rows="3" placeholder="Εξηγήστε γιατί χρειάζεστε τα χρήματα..." required></textarea>
                </div>

                <div>
                    <span style="font-size: 0.75rem; color: #4f46e5; font-family: var(--font-mono);">ΠΟΣΟ ΣΤΟΧΟΣ (€)</span>
                    <input type="number" class="releaf-input" id="camp-goal" placeholder="π.χ. 500" required />
                </div>

                <button class="releaf-button" type="submit" style="margin-top: 10px; background: #4f46e5;">Έναρξη Καμπάνιας</button>
                <button class="releaf-button" type="button" id="btn-cancel" style="background: transparent; border: 1px solid white;">Ακύρωση</button>
            </form>
        `;

        container.querySelector('#btn-cancel').addEventListener('click', onBack);
        
        container.querySelector('#campaign-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            formState = {
                title: container.querySelector('#camp-title').value,
                description: container.querySelector('#camp-desc').value,
                goal_amount: container.querySelector('#camp-goal').value,
                action_id: container.querySelector('#camp-action').value,
                creator_user_id: currentUser.id
            };

            try {
                const res = await fetch('/api/campaigns', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formState)
                });
                const data = await res.json();
                
                container.innerHTML = `
                    <div style="padding: 20px 0;">
                        <h2 style="font-family: var(--font-heading); color: ${res.ok ? '#8db600' : '#ff4d4d'}; font-size: 2rem;">
                            ${res.ok ? 'Επιτυχία!' : 'Σφάλμα!'}
                        </h2>
                        <p style="font-family: var(--font-mono); color: #fff; margin-bottom: 30px;">${data.message || data.detail}</p>
                        <button id="btn-finish" class="releaf-button">Επιστροφή</button>
                    </div>
                `;
                container.querySelector('#btn-finish').addEventListener('click', onBack);
            } catch (err) {
                alert('Σφάλμα διακομιστή.');
            }
        });
    }

    loadActions();
    return container;
}