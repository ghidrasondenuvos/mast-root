// Αρχείο: public/components/EnvironmentalNeedsDashboard.js

export function renderEnvironmentalNeedsDashboard(currentUser) {
    const container = document.createElement('div');
    // Το CSS style του εξωτερικού wrapper (όπως στο React)
    container.style.cssText = "flex: 1; background: rgba(27, 24, 27, 0.85); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";

    // 1. Εσωτερικό State
    let proposals = [];
    let analyzing = false;
    let resultMsg = { status: '', text: '' };

    // 2. Fetch Δεδομένων
    async function fetchProposals() {
        try {
            const res = await fetch('/api/action-proposals');
            proposals = await res.json();
            render(); // Ανανέωση του UI
        } catch (e) {
            console.error("Σφάλμα κατά τη φόρτωση προτάσεων:", e);
        }
    }

    // 3. Η λειτουργία της Σάρωσης (Mock Analysis)
    async function triggerAnalysis() {
        analyzing = true;
        resultMsg = { status: '', text: '' };
        render();

        try {
            const res = await fetch('/api/analyze-needs', { method: 'POST' });
            const data = await res.json();
            
            // Το timeout 1.5 δευτερολέπτου που είχες βάλει για εφφέ "φόρτωσης"
            setTimeout(() => {
                analyzing = false;
                resultMsg = { status: data.status, text: data.message };
                
                if (data.status === 'success') {
                    fetchProposals(); // Αν βρέθηκαν νέες, τις φορτώνουμε
                } else {
                    render();
                }
            }, 1500);

        } catch (e) {
            analyzing = false;
            resultMsg = { status: 'error', text: 'Σφάλμα σύνδεσης με τον σέρβερ Ανάλυσης.' };
            render();
        }
    }

    // 4. Μετατροπή Πρότασης σε Δράση
    async function convertToAction(proposalId) {
        if (!currentUser) return;
        
        try {
            const res = await fetch(`/api/action-proposals/${proposalId}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id })
            });
            const data = await res.json();
            
            if (res.ok) {
                resultMsg = { status: 'success', text: data.message };
                fetchProposals(); // Ανανεώνει τη λίστα
            } else {
                resultMsg = { status: 'error', text: data.detail || 'Αποτυχία μετατροπής.' };
                render();
            }
        } catch (e) {
            resultMsg = { status: 'error', text: 'Σφάλμα δικτύου.' };
            render();
        }
    }

    // 5. Η συνάρτηση Render
    function render() {
        let html = `
            <div style="padding: 15px 20px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-family: var(--font-heading); color: #8db600; font-size: 1.2rem;">
                     Ανάλυση Περιβαλλοντικών Αναγκών
                </h3>
                <button id="btn-analyze" class="releaf-button" style="margin: 0; padding: 5px 15px; font-size: 0.8rem; background: #8db600;" ${analyzing ? 'disabled' : ''}>
                    ${analyzing ? 'Ανάλυση...' : 'Εκτέλεση Σάρωσης'}
                </button>
            </div>
        `;

        // Εμφάνιση Μηνύματος (Success/Error)
        if (resultMsg.text) {
            const bgColor = resultMsg.status === 'success' ? 'rgba(218,41,28,0.2)' : 'rgba(255,193,7,0.2)';
            const txtColor = resultMsg.status === 'success' ? '#DA291C' : '#fbbf24';
            html += `
                <div style="padding: 10px 20px; background: ${bgColor}; color: ${txtColor}; font-family: var(--font-mono); font-size: 0.9rem; text-align: center; font-weight: bold;">
                    ${resultMsg.text}
                </div>
            `;
        }

        html += `<div style="flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px;">`;

        // Loading Spinner
        if (analyzing) {
            html += `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #8db600; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>
                    <span style="margin-top: 10px; color: #888; font-family: var(--font-mono); font-size: 0.9rem;">Επεξεργασία δεδομένων περιοχής...</span>
                </div>
            `;
        } 
        // Αν δεν υπάρχουν προτάσεις
        else if (proposals.length === 0) {
            html += `
                <div style="text-align: center; color: #666; font-family: var(--font-mono); margin-top: 20px; font-size: 0.9rem;">
                    Δεν υπάρχουν εκκρεμείς προτάσεις.<br/>Πατήστε "Εκτέλεση Σάρωσης" για ανάλυση.
                </div>
            `;
        } 
        // Λίστα προτάσεων
        else {
            proposals.forEach(p => {
                html += `
                    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; border-left: 3px solid #8db600; position: relative;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4 style="margin: 0 0 5px 0; color: white; font-family: var(--font-mono); font-size: 0.95rem;">${p.title}</h4>
                            <span style="font-size: 0.7rem; background: #a67c52; color: white; padding: 2px 6px; border-radius: 4px;">${p.action_type}</span>
                        </div>
                        <p style="margin: 5px 0 10px 0; color: #ccc; font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.4;">${p.description}</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.75rem; color: #8db600; font-family: var(--font-mono);"> ${p.location}</div>
                            
                            <button class="btn-convert" data-id="${p.id}" style="background: #DA291C; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-family: var(--font-mono); font-size: 0.75rem; font-weight: bold;">
                                 Ανάληψη Δράσης
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        container.innerHTML = html;

        // 6. Επανατοποθέτηση Event Listeners μετά το innerHTML update
        const btnAnalyze = container.querySelector('#btn-analyze');
        if (btnAnalyze && !analyzing) {
            btnAnalyze.addEventListener('click', triggerAnalysis);
        }

        const convertBtns = container.querySelectorAll('.btn-convert');
        convertBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                convertToAction(id);
            });
        });
    }

    // Αρχική κλήση
    fetchProposals(); 
    return container;
}