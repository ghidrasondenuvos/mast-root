export function renderCertificatesDashboard(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 15px;";

    // Mock Data όπως στο React project
    let approvedActions = [
        { action_id: 1, action_title: "Δενδροφύτευση στο Ποικίλο Όρος", organisation: "Save Your Hood", has_certificate: false },
        { action_id: 2, action_title: "Καθαρισμός Παραλίας", organisation: "We4All", has_certificate: true }
    ];

    let certificates = [
        { id: 101, action_title: "Καθαρισμός Παραλίας", organisation: "We4All", issue_date: new Date().toLocaleDateString('el-GR'), volunteer_name: currentUser.username }
    ];

    function renderContent() {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(27, 24, 27, 0.9); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="font-family: var(--font-heading); color: #10b981; margin: 0; font-size: 1.8rem;">🏆 Πιστοποιητικά Εθελοντισμού</h3>
                <button class="releaf-button" id="btn-back" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white;">Πίσω</button>
            </div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: stretch;">
                
                <div style="flex: 1; min-width: 300px; background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="color: var(--accent-color); font-family: var(--font-mono); margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Δράσεις προς Πιστοποίηση</h4>
                    <div id="actions-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
                </div>

                <div style="flex: 1; min-width: 300px; background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="color: #10b981; font-family: var(--font-mono); margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Διαθέσιμα Πιστοποιητικά</h4>
                    <div id="certs-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
                </div>

            </div>
        `;

        container.querySelector('#btn-back').addEventListener('click', onBack);

        // Render Λίστας Δράσεων
        const actionsList = container.querySelector('#actions-list');
        if (approvedActions.length === 0) actionsList.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">Δεν έχετε ολοκληρώσει δράσεις.</p>';
        
        approvedActions.forEach(action => {
            const div = document.createElement('div');
            div.style.cssText = "background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid var(--accent-color);";
            div.innerHTML = `
                <strong style="color: white; display: block; margin-bottom: 5px;">${action.action_title}</strong>
                <span style="font-size: 0.8rem; color: #ccc;">Οργάνωση: ${action.organisation}</span>
                <div style="margin-top: 10px;">
                    ${action.has_certificate 
                        ? `<span style="font-size: 0.75rem; color: #10b981; border: 1px solid #10b981; padding: 3px 8px; border-radius: 4px;">Εκδόθηκε ✓</span>` 
                        : `<button class="releaf-button btn-issue" data-id="${action.action_id}" style="padding: 5px 10px; font-size: 0.75rem; background: var(--accent-color);">Έκδοση PDF</button>`}
                </div>
            `;
            actionsList.appendChild(div);
        });

        // Event Listeners για Έκδοση
        container.querySelectorAll('.btn-issue').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                issueCertificate(id);
            });
        });

        // Render Λίστας Πιστοποιητικών
        const certsList = container.querySelector('#certs-list');
        if (certificates.length === 0) certsList.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">Δεν έχουν εκδοθεί πιστοποιητικά.</p>';
        
        certificates.forEach(cert => {
            const div = document.createElement('div');
            div.style.cssText = "background: rgba(16,185,129,0.1); padding: 15px; border-radius: 8px; border: 1px solid #10b981; display: flex; justify-content: space-between; align-items: center;";
            div.innerHTML = `
                <div>
                    <strong style="color: #10b981; display: block; margin-bottom: 5px;">${cert.action_title}</strong>
                    <span style="font-size: 0.75rem; color: #ccc; display: block;">Ημ/νία: ${cert.issue_date}</span>
                </div>
                <button class="releaf-button btn-print" style="padding: 5px 10px; font-size: 0.75rem; background: transparent; border: 1px solid #10b981; color: #10b981;">🖨️ Εκτύπωση</button>
            `;
            certsList.appendChild(div);
        });

        // Event Listener για Εκτύπωση (Native Browser Print)
        container.querySelectorAll('.btn-print').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Άνοιγμα Native Print Dialog...'); // Εδώ θα έμπαινε η λογική print() που είχες
            });
        });
    }

    function issueCertificate(actionId) {
        const action = approvedActions.find(a => a.action_id === actionId);
        if (!action) return;

        // Ενημερώνουμε τα Arrays
        approvedActions = approvedActions.map(a => a.action_id === actionId ? { ...a, has_certificate: true } : a);
        certificates.push({
            id: Math.floor(Math.random() * 1000),
            action_title: action.action_title,
            organisation: action.organisation,
            issue_date: new Date().toLocaleDateString('el-GR'),
            volunteer_name: currentUser.username
        });

        // Ξανασχεδιάζουμε το UI
        renderContent();
    }

    renderContent();
    return container;
}