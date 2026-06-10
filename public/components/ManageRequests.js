export function renderManageRequests(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 40px; border-radius: 15px; width: 100%; max-width: 600px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; min-height: 400px;";

    let requests = [];
    let selectedRequest = null;

    // 1. Φόρτωση δεδομένων από το API
    async function fetchRequests() {
        container.innerHTML = '<p style="text-align:center; color: #ccc;">Φόρτωση αιτήσεων...</p>';
        try {
            const res = await fetch(`/api/org-requests/${currentUser.id}`);
            requests = await res.json();
            renderList();
        } catch (err) {
            container.innerHTML = '<p style="color:#ff4d4d; text-align:center;">Σφάλμα ανάκτησης αιτήσεων.</p>';
        }
    }

    // 2. Οθόνη (Step 1): Λίστα
    function renderList() {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-family: var(--font-heading); color: var(--accent-color); margin: 0; font-size: 1.8rem;">Διαχείριση Αιτήσεων</h2>
                <button class="releaf-button" id="btn-back" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white;">Πίσω</button>
            </div>
        `;
        
        container.querySelector('#btn-back').addEventListener('click', onBack);

        if (requests.length === 0) {
            container.innerHTML += `<p style="color: #aaa; text-align: center; margin-top: 50px;">Δεν υπάρχουν εκκρεμείς αιτήσεις.</p>`;
            return;
        }

        const listDiv = document.createElement('div');
        listDiv.style.cssText = "display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1;";
        
        requests.forEach(req => {
            const card = document.createElement('div');
            card.style.cssText = "background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; cursor: pointer; display: flex; justify-content: space-between; align-items: center;";
            card.innerHTML = `
                <div>
                    <h4 style="margin: 0 0 5px 0; color: white; font-family: var(--font-mono);">${req.volunteer_name}</h4>
                    <span style="font-size: 0.8rem; color: #ccc;">Για: <strong style="color: #4f46e5;">${req.action_title}</strong></span>
                </div>
                <span style="font-size: 1.2rem;">➔</span>
            `;
            card.onmouseover = () => card.style.background = 'rgba(255,255,255,0.1)';
            card.onmouseout = () => card.style.background = 'rgba(255,255,255,0.05)';
            card.onclick = () => { selectedRequest = req; renderDetails(); };
            listDiv.appendChild(card);
        });

        container.appendChild(listDiv);
    }

    // 3. Οθόνη (Step 2): Λεπτομέρειες & Απόφαση
    function renderDetails() {
        container.innerHTML = `
            <button class="releaf-button" id="btn-back-list" style="align-self: flex-start; background: transparent; border: 1px solid rgba(255,255,255,0.3); padding: 5px 15px;">← Πίσω στη Λίστα</button>
            
            <div style="background: rgba(0,0,0,0.5); padding: 25px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #4f46e5; font-family: var(--font-heading); margin: 0 0 15px 0; font-size: 1.5rem;">${selectedRequest.volunteer_name}</h3>
                <p style="margin: 5px 0; color: #ddd; font-family: var(--font-mono); font-size: 0.9rem;"><strong>Αιτείται για:</strong> ${selectedRequest.action_title}</p>
                <div style="margin: 15px 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <p style="margin: 5px 0; color: #ccc; font-family: var(--font-mono);"><strong>Δεξιότητες:</strong> ${selectedRequest.volunteer_skills || 'Δεν δηλώθηκαν'}</p>
                    <p style="margin: 5px 0; color: #ccc; font-family: var(--font-mono);"><strong>Διαθέσιμα Μέσα:</strong> ${selectedRequest.volunteer_resources || 'Δεν δηλώθηκαν'}</p>
                </div>
            </div>

            <div style="display: flex; gap: 15px; margin-top: auto; padding-top: 20px;">
                <button id="btn-approve" class="releaf-button" style="flex: 1; background: #10b981; color: white;">Έγκριση</button>
                <button id="btn-reject" class="releaf-button" style="flex: 1; background: #ff4d4d; color: white; border: none;">Απόρριψη</button>
            </div>
        `;

        container.querySelector('#btn-back-list').addEventListener('click', renderList);
        container.querySelector('#btn-approve').addEventListener('click', () => submitDecision('approved'));
        container.querySelector('#btn-reject').addEventListener('click', () => submitDecision('rejected'));
    }

    // 4. Υποβολή και Οθόνη (Step 3): Αποτέλεσμα
    async function submitDecision(decision) {
        try {
            const res = await fetch(`/api/requests/${selectedRequest.request_id}/decision`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ org_user_id: currentUser.id, status: decision })
            });
            const data = await res.json();

            container.innerHTML = `
                <div style="display: flex; flexDirection: column; align-items: center; justify-content: center; flex: 1; text-align: center;">
                    <h2 style="font-family: var(--font-heading); color: ${res.ok ? '#8db600' : '#ff4d4d'}; font-size: 2rem; margin: 0 0 15px 0;">
                        ${res.ok ? 'Επιτυχία!' : 'Σφάλμα!'}
                    </h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6; margin-bottom: 30px;">
                        ${data.message || data.detail}
                    </p>
                    <button id="btn-finish" class="releaf-button">Επιστροφή στις Αιτήσεις</button>
                </div>
            `;
            
            container.querySelector('#btn-finish').addEventListener('click', fetchRequests);
        } catch (err) {
            alert('Σφάλμα σύνδεσης');
        }
    }

    fetchRequests(); // Ξεκινάμε φορτώνοντας τα δεδομένα
    return container;
}