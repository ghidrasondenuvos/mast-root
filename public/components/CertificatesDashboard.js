// Αρχείο: public/components/CertificatesDashboard.js

export function renderCertificatesDashboard(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 15px;";

    // 1. Εσωτερικό State
    let pendingActions = []; // Δράσεις που παρακολούθησε αλλά δεν έβγαλε πιστοποιητικό
    let certificates = [];   // Εκδοθέντα πιστοποιητικά
    let isLoading = true;
    let resultMsg = { status: '', text: '' };

    // 2. Mock API Data Fetching (Προσομοίωση του τι έφερνε το backend σου)
    // Στο κανονικό Releaf εδώ θα έκανες fetch('/api/certificates/...')
    function fetchData() {
        isLoading = true;
        render();

        setTimeout(() => {
            // Προσομοίωση δεδομένων που έρχονται από τη βάση
            pendingActions = [
                { action_id: 1, action_title: "Δενδροφύτευση στο Ποικίλο Όρος", organisation: "Save Your Hood", has_certificate: false },
                { action_id: 2, action_title: "Καθαρισμός Παραλίας Ρίου", organisation: "We4All", has_certificate: false }
            ];
            certificates = [
                { id: 101, action_title: "Ανακύκλωση Πλαστικού", organisation: "Releaf Org", issue_date: "12/05/2026", volunteer_name: currentUser.username }
            ];
            
            isLoading = false;
            render();
        }, 800);
    }

    // 3. Λειτουργία Έκδοσης Πιστοποιητικού
    async function issueCertificate(actionId) {
        resultMsg = { status: '', text: '' };
        render();

        try {
            // Προσομοίωση API Call για έκδοση
            /* const res = await fetch('/api/certificates/issue', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, action_id: actionId })
            }); */
            
            setTimeout(() => {
                const actionIndex = pendingActions.findIndex(a => a.action_id === actionId);
                if (actionIndex > -1) {
                    const action = pendingActions[actionIndex];
                    // Αφαίρεση από τα εκκρεμή και προσθήκη στα πιστοποιητικά
                    pendingActions.splice(actionIndex, 1);
                    certificates.push({
                        id: Math.floor(Math.random() * 10000),
                        action_title: action.action_title,
                        organisation: action.organisation,
                        issue_date: new Date().toLocaleDateString('el-GR'),
                        volunteer_name: currentUser.username
                    });
                    resultMsg = { status: 'success', text: 'Το πιστοποιητικό εκδόθηκε επιτυχώς!' };
                }
                render();
            }, 500);

        } catch (e) {
            resultMsg = { status: 'error', text: 'Αδυναμία έκδοσης πιστοποιητικού.' };
            render();
        }
    }

    // 4. Η συνάρτηση Render
    function render() {
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(27, 24, 27, 0.9); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="font-family: var(--font-heading); color: #10b981; margin: 0; font-size: 1.8rem;">🏆 Τα Πιστοποιητικά μου</h3>
                <button id="btn-back" class="releaf-button" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white; margin: 0;">Πίσω</button>
            </div>
        `;

        if (resultMsg.text) {
            const bgColor = resultMsg.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(255,77,77,0.2)';
            const txtColor = resultMsg.status === 'success' ? '#10b981' : '#ff4d4d';
            html += `
                <div style="padding: 10px; background: ${bgColor}; color: ${txtColor}; border-radius: 8px; font-family: var(--font-mono); text-align: center; font-weight: bold; margin-top: 10px;">
                    ${resultMsg.text}
                </div>
            `;
        }

        if (isLoading) {
            html += `<p style="color: #ccc; text-align: center; margin-top: 50px; font-family: var(--font-mono);">Φόρτωση δεδομένων πιστοποίησης...</p>`;
        } else {
            html += `
                <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: stretch; margin-top: 10px;">
                    
                    <div style="flex: 1; min-width: 300px; background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <h4 style="color: var(--accent-color); font-family: var(--font-mono); margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Δράσεις προς Πιστοποίηση</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
            `;
            
            if (pendingActions.length === 0) {
                html += `<p style="color: #aaa; font-size: 0.9rem; font-family: var(--font-mono);">Δεν υπάρχουν δράσεις προς πιστοποίηση.</p>`;
            } else {
                pendingActions.forEach(action => {
                    html += `
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid var(--accent-color);">
                            <strong style="color: white; display: block; margin-bottom: 5px; font-family: var(--font-mono); font-size: 0.95rem;">${action.action_title}</strong>
                            <span style="font-size: 0.8rem; color: #ccc; font-family: var(--font-mono);">Οργάνωση: ${action.organisation}</span>
                            <div style="margin-top: 10px;">
                                <button class="btn-issue releaf-button" data-id="${action.action_id}" style="padding: 5px 10px; font-size: 0.75rem; background: var(--accent-color); margin: 0;">Έκδοση Πιστοποιητικού</button>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                        </div>
                    </div>

                    <div style="flex: 1; min-width: 300px; background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <h4 style="color: #10b981; font-family: var(--font-mono); margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Διαθέσιμα Πιστοποιητικά</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
            `;

            if (certificates.length === 0) {
                html += `<p style="color: #aaa; font-size: 0.9rem; font-family: var(--font-mono);">Δεν έχουν εκδοθεί πιστοποιητικά ακόμα.</p>`;
            } else {
                certificates.forEach(cert => {
                    html += `
                        <div style="background: rgba(16,185,129,0.1); padding: 15px; border-radius: 8px; border: 1px solid #10b981; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #10b981; display: block; margin-bottom: 5px; font-family: var(--font-mono); font-size: 0.95rem;">${cert.action_title}</strong>
                                <span style="font-size: 0.75rem; color: #ccc; display: block; font-family: var(--font-mono);">Ημ/νία: ${cert.issue_date}</span>
                                <span style="font-size: 0.7rem; color: #a67c52; display: block; font-family: var(--font-mono); margin-top: 3px;">ID: #${cert.id}</span>
                            </div>
                            <button class="btn-print releaf-button" style="padding: 5px 10px; font-size: 0.75rem; background: transparent; border: 1px solid #10b981; color: #10b981; margin: 0;">🖨️ Εκτύπωση</button>
                        </div>
                    `;
                });
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // 5. Επανατοποθέτηση Event Listeners
        const btnBack = container.querySelector('#btn-back');
        if (btnBack) btnBack.addEventListener('click', onBack);

        container.querySelectorAll('.btn-issue').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                issueCertificate(id);
            });
        });

        container.querySelectorAll('.btn-print').forEach(btn => {
            btn.addEventListener('click', () => {
                // Η εντολή window.print() ανοίγει το Native Print Dialog του Browser!
                window.print(); 
            });
        });
    }

    // Εκκίνηση Φόρτωσης
    fetchData();

    return container;
}