// Αρχείο: public/components/ManageRequests.js

export function renderManageRequests(currentUser, onBack, onRequestHandled) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.95); padding: 30px; border-radius: 15px; width: 100%; max-width: 600px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; min-height: 400px;";

    let requests = [];
    let selectedRequest = null;
    let result = { status: '', message: '' };
    let step = 1; // 1: Λίστα, 2: Λεπτομέρειες, 3: Αποτέλεσμα

    // Ανάκτηση των αιτήσεων από το backend
    async function fetchRequests() {
        try {
            const res = await fetch(`/api/org-requests/${currentUser.id}`);
            requests = await res.json();
            render();
        } catch (err) {
            console.error("Σφάλμα ανάκτησης αιτήσεων", err);
        }
    }

    // Υποβολή Απόφασης (Approve / Reject)
    async function submitDecision(decision) {
        try {
            const res = await fetch(`/api/requests/${selectedRequest.request_id}/decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ org_user_id: currentUser.id, status: decision })
            });
            const data = await res.json();
            
            if (res.ok) {
                result = { 
                    status: 'success', 
                    message: `Η αίτηση του/της ${selectedRequest.volunteer_name} ${decision === 'approved' ? 'εγκρίθηκε' : 'απορρίφθηκε'} επιτυχώς!` 
                };
                if (onRequestHandled) onRequestHandled(); // Ενημερώνει το App.js για να πέσει το counter
            } else {
                result = { status: 'error', message: data.detail || 'Σφάλμα κατά την επεξεργασία.' };
            }
        } catch (err) {
            result = { status: 'error', message: 'Αδυναμία σύνδεσης με τον διακομιστή.' };
        }
        step = 3; 
        render();
    }

    // Κεντρική συνάρτηση σχεδιασμού
    function render() {
        let html = '';

        if (step === 1) {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="font-family: var(--font-heading); color: var(--accent-color); margin: 0; font-size: 1.8rem;">Διαχείριση Αιτήσεων</h2>
                    <button id="btn-close" style="background: transparent; border: 1px solid white; color: white; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-family: var(--font-mono);">X</button>
                </div>
                
                <div style="flex: 1; overflow-y: auto;">
            `;

            if (requests.length === 0) {
                html += `<p style="color: #888; font-family: var(--font-mono); text-align: center; margin-top: 50px;">Δεν υπάρχουν εκκρεμείς αιτήσεις.</p>`;
            } else {
                html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
                requests.forEach(req => {
                    html += `
                        <div class="req-card" data-id="${req.request_id}" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid var(--accent-color); cursor: pointer; transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.1)'" onmouseleave="this.style.background='rgba(255,255,255,0.05)'">
                            <div style="display: flex; justify-content: space-between;">
                                <h4 style="margin: 0 0 5px 0; color: white; font-family: var(--font-mono);">${req.volunteer_name}</h4>
                                <span style="font-size: 0.8rem; color: #10b981;">Αναμονή</span>
                            </div>
                            <p style="margin: 0; font-size: 0.85rem; color: #ccc; font-family: var(--font-mono);">Δράση: ${req.action_title}</p>
                        </div>
                    `;
                });
                html += `</div>`;
            }
            html += `</div>`;
        } 
        else if (step === 2 && selectedRequest) {
            html += `
                <button id="btn-back-list" style="align-self: flex-start; background: transparent; border: none; color: #10b981; cursor: pointer; font-family: var(--font-mono); margin-bottom: 15px; padding: 0;">← Πίσω στη Λίστα</button>
                
                <h2 style="font-family: var(--font-heading); color: white; margin: 0 0 5px 0;">Αίτηση Συμμετοχής</h2>
                <p style="font-family: var(--font-mono); color: var(--accent-color); margin: 0 0 20px 0;">Δράση: ${selectedRequest.action_title}</p>
                
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.2);">
                    <h4 style="color: #10b981; font-family: var(--font-mono); margin: 0 0 15px 0;">Στοιχεία Εθελοντή</h4>
                    <p style="margin: 5px 0; color: #ccc; font-family: var(--font-mono);"><strong>Όνομα:</strong> ${selectedRequest.volunteer_name}</p>
                    <p style="margin: 5px 0; color: #ccc; font-family: var(--font-mono);"><strong>Δεξιότητες:</strong> ${selectedRequest.volunteer_skills}</p>
                    <p style="margin: 5px 0; color: #ccc; font-family: var(--font-mono);"><strong>Διαθέσιμα Μέσα:</strong> ${selectedRequest.volunteer_resources}</p>
                </div>

                <div style="display: flex; gap: 15px; margin-top: auto; padding-top: 20px;">
                    <button id="btn-approve" class="releaf-button" style="flex: 1; background: #10b981; color: white; margin: 0;">Έγκριση</button>
                    <button id="btn-reject" class="releaf-button" style="flex: 1; background: #ff4d4d; color: white; border: none; margin: 0;">Απόρριψη</button>
                </div>
            `;
        } 
        else if (step === 3) {
            html += `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center;">
                    <h2 style="font-family: var(--font-heading); color: ${result.status === 'success' ? '#8db600' : '#ff4d4d'}; font-size: 2rem; margin: 0 0 15px 0;">
                        ${result.status === 'success' ? 'Επιτυχία!' : 'Σφάλμα!'}
                    </h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6; margin-bottom: 30px;">${result.message}</p>
                    <button id="btn-finish" class="releaf-button">Επιστροφή στις Αιτήσεις</button>
                </div>
            `;
        }

        container.innerHTML = html;

        // Εφαρμογή Event Listeners
        if (step === 1) {
            const closeBtn = container.querySelector('#btn-close');
            if (closeBtn) closeBtn.addEventListener('click', onBack);

            const cards = container.querySelectorAll('.req-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    const reqId = parseInt(card.getAttribute('data-id'));
                    selectedRequest = requests.find(r => r.request_id === reqId);
                    step = 2; 
                    render();
                });
            });
        } 
        else if (step === 2) {
            container.querySelector('#btn-back-list').addEventListener('click', () => { step = 1; render(); });
            container.querySelector('#btn-approve').addEventListener('click', () => submitDecision('approved'));
            container.querySelector('#btn-reject').addEventListener('click', () => submitDecision('rejected'));
        } 
        else if (step === 3) {
            container.querySelector('#btn-finish').addEventListener('click', () => { 
                step = 1; 
                fetchRequests(); 
            });
        }
    }

    // Αρχική κλήση
    fetchRequests();

    return container;
}