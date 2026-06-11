// Αρχείο: public/components/CreateCampaignForm.js

export function renderCreateCampaignForm(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 40px; border-radius: 15px; width: 100%; max-width: 450px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;";

    // 1. Εσωτερικό State
    let formState = { title: '', description: '', goal_amount: '', action_id: '' };
    let userActions = [];
    let step = 0; // 0: Φόρτωση, 1: Φόρμα, 2: Αποτέλεσμα
    let result = { status: '', message: '' };

    // 2. Φόρτωση των δράσεων του χρήστη (Όπως έκανε το useEffect στη React)
    async function fetchActions() {
        try {
            const res = await fetch(`/api/user-actions/${currentUser.id}`);
            userActions = await res.json();
            step = 1; 
            render();
        } catch (err) {
            console.error(err);
            result = { status: 'error', message: 'Σφάλμα φόρτωσης συσχετισμένων δράσεων.' };
            step = 2;
            render();
        }
    }

    // 3. Η συνάρτηση Render
    function render() {
        let html = '';

        if (step === 0) {
            html = `<p style="color: #ccc; font-family: var(--font-mono);">Φόρτωση δεδομένων...</p>`;
        } 
        else if (step === 1) {
            // Αν ο χρήστης ΔΕΝ έχει δράσεις, του βγάζουμε το αντίστοιχο μήνυμα
            if (userActions.length === 0) {
                html = `
                    <h2 style="font-family: var(--font-heading); color: #ff4d4d; font-size: 1.8rem;">Αδυναμία Δημιουργίας</h2>
                    <p style="font-family: var(--font-mono); color: #ccc; margin: 20px 0; line-height: 1.6;">Πρέπει πρώτα να δημιουργήσετε τουλάχιστον μία Περιβαλλοντική Δράση πριν ζητήσετε χρηματοδότηση.</p>
                    <button class="releaf-button" id="btn-back-error" style="background: transparent; border: 1px solid white;">Επιστροφή</button>
                `;
            } else {
                const labelStyle = "font-size: 0.75rem; color: #4f46e5; margin-left: 15px; margin-bottom: 3px; font-family: var(--font-mono); display: block; text-align: left;";
                html = `
                    <h2 style="font-family: var(--font-heading); color: #4f46e5; font-size: 2rem; margin: 0 0 20px 0;">Νέα Καμπάνια</h2>
                    <form id="campaign-form" style="display: flex; flex-direction: column; gap: 15px;">
                        <div>
                            <span style="${labelStyle}">ΣΧΕΤΙΖΟΜΕΝΗ ΔΡΑΣΗ</span>
                            <select class="releaf-input" id="camp-action" style="-webkit-appearance: none; -moz-appearance: none; appearance: none; cursor: pointer; width: 100%; box-sizing: border-box; margin: 0;">
                                <option value="" disabled ${!formState.action_id ? 'selected' : ''}>Επιλέξτε Δράση...</option>
                                ${userActions.map(a => `<option value="${a.id}" ${formState.action_id == a.id ? 'selected' : ''}>${a.title}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <span style="${labelStyle}">ΤΙΤΛΟΣ ΚΑΜΠΑΝΙΑΣ</span>
                            <input class="releaf-input" id="camp-title" placeholder="π.χ. Αγορά δενδρυλλίων" value="${formState.title}" style="width: 100%; box-sizing: border-box; margin: 0;" />
                        </div>
                        <div>
                            <span style="${labelStyle}">ΠΕΡΙΓΡΑΦΗ & ΣΤΟΧΟΣ</span>
                            <textarea class="releaf-input" id="camp-desc" rows="3" placeholder="Εξηγήστε γιατί χρειάζεστε τα χρήματα..." style="resize: none; padding: 12px; width: 100%; box-sizing: border-box; margin: 0;">${formState.description}</textarea>
                        </div>
                        <div>
                            <span style="${labelStyle}">ΠΟΣΟ ΣΤΟΧΟΣ (€)</span>
                            <input class="releaf-input" type="number" id="camp-goal" placeholder="π.χ. 500" value="${formState.goal_amount}" style="width: 100%; box-sizing: border-box; margin: 0;" />
                        </div>
                        
                        <div id="error-msg" style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 5px; min-height: 20px;"></div>

                        <button class="releaf-button" type="submit" style="margin-top: 10px; background: #4f46e5;">Έναρξη Καμπάνιας</button>
                        <button class="releaf-button" type="button" id="btn-cancel" style="background: transparent; border: 1px solid white;">Ακύρωση</button>
                    </form>
                `;
            }
        } 
        else if (step === 2) {
            html = `
                <div style="padding: 20px 0;">
                    <h2 style="font-family: var(--font-heading); color: ${result.status === 'success' ? '#8db600' : '#ff4d4d'}; font-size: 2rem; margin: 0 0 15px 0;">
                        ${result.status === 'success' ? 'Επιτυχία!' : 'Σφάλμα!'}
                    </h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6; margin-bottom: 30px;">
                        ${result.message}
                    </p>
                    <button id="btn-finish" class="releaf-button">Επιστροφή</button>
                </div>
            `;
        }

        container.innerHTML = html;

        // 4. Events
        if (step === 1) {
            if (userActions.length === 0) {
                container.querySelector('#btn-back-error').addEventListener('click', onBack);
            } else {
                const actionInput = container.querySelector('#camp-action');
                const titleInput = container.querySelector('#camp-title');
                const descInput = container.querySelector('#camp-desc');
                const goalInput = container.querySelector('#camp-goal');
                const errorDiv = container.querySelector('#error-msg');

                actionInput.addEventListener('change', e => formState.action_id = e.target.value);
                titleInput.addEventListener('input', e => formState.title = e.target.value);
                descInput.addEventListener('input', e => formState.description = e.target.value);
                goalInput.addEventListener('input', e => formState.goal_amount = e.target.value);

                container.querySelector('#btn-cancel').addEventListener('click', onBack);

                container.querySelector('#campaign-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (!formState.title || !formState.description || !formState.goal_amount || !formState.action_id) {
                        errorDiv.textContent = 'Παρακαλώ συμπληρώστε όλα τα πεδία.';
                        return;
                    }

                    try {
                        const res = await fetch('/api/campaigns', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...formState, creator_user_id: currentUser.id })
                        });
                        const data = await res.json();
                        
                        if (res.ok) {
                            result = { status: 'success', message: data.message || 'Η καμπάνια καταχωρήθηκε επιτυχώς!' };
                        } else {
                            result = { status: 'error', message: data.detail || 'Αποτυχία δημιουργίας.' };
                        }
                    } catch (err) {
                        result = { status: 'error', message: 'Σφάλμα σύνδεσης με τον διακομιστή.' };
                    }
                    step = 2; render();
                });
            }
        } else if (step === 2) {
            container.querySelector('#btn-finish').addEventListener('click', () => {
                if (result.status === 'success') onBack();
                else { step = 1; render(); }
            });
        }
    }

    // Αρχικοποίηση (Trigger data fetch)
    fetchActions();

    return container;
}