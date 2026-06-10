export function renderSearchActions(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 800px; height: 80vh; display: flex; flex-direction: column; gap: 15px;";

    let selectedAction = null;

    function renderList() {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-family: var(--font-heading); color: var(--accent-color); margin: 0; font-size: 1.8rem;">🔍 Αναζήτηση Δράσεων</h3>
                <button class="releaf-button" id="btn-back" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white;">Πίσω</button>
            </div>
            
            <form id="search-form" style="display: flex; flex-wrap: wrap; gap: 10px;">
                <input class="releaf-input" id="s-keyword" placeholder="Λέξη-κλειδί (π.χ. Δάσος)" style="flex: 1 1 30%; margin: 0; padding: 10px;" />
                <input class="releaf-input" id="s-location" placeholder="Περιοχή" style="flex: 1 1 30%; margin: 0; padding: 10px;" />
                <input class="releaf-input" id="s-type" placeholder="Τύπος" style="flex: 1 1 30%; margin: 0; padding: 10px;" />
                <button class="releaf-button" type="submit" style="flex: 1 1 100%; padding: 10px;">Εκτέλεση Αναζήτησης</button>
            </form>

            <div id="results-area" style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.5); border-radius: 10px; padding: 15px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="color: #888; font-family: var(--font-mono); text-align: center; margin-top: 30px;">Συμπληρώστε τα φίλτρα για αναζήτηση.</div>
            </div>
        `;

        container.querySelector('#btn-back').addEventListener('click', onBack);

        container.querySelector('#search-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const keyword = container.querySelector('#s-keyword').value;
            const location = container.querySelector('#s-location').value;
            const type = container.querySelector('#s-type').value;

            const params = new URLSearchParams();
            if (location) params.append('location', location);
            if (type) params.append('action_type', type);
            if (keyword) params.append('keyword', keyword);

            const resultsArea = container.querySelector('#results-area');
            resultsArea.innerHTML = '<p style="text-align: center;">Αναζήτηση...</p>';

            try {
                const response = await fetch(`/api/search-actions?${params.toString()}`);
                const data = await response.json();

                if (response.ok && data.length > 0) {
                    resultsArea.innerHTML = '';
                    data.forEach(action => {
                        const card = document.createElement('div');
                        card.style.cssText = "background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; cursor: pointer; margin-bottom: 10px;";
                        card.innerHTML = `
                            <h4 style="margin: 0 0 5px 0; color: #10b981; font-family: var(--font-mono);">${action.title}</h4>
                            <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #ccc;">${action.description}</p>
                            <span style="font-size: 0.75rem; color: #a67c52; font-family: var(--font-mono);">📍 ${action.location}</span>
                        `;
                        card.onmouseover = () => card.style.background = 'rgba(255,255,255,0.1)';
                        card.onmouseout = () => card.style.background = 'rgba(255,255,255,0.05)';
                        card.onclick = () => { selectedAction = action; renderDetails(); };
                        resultsArea.appendChild(card);
                    });
                } else {
                    resultsArea.innerHTML = '<p style="text-align: center; color: #aaa;">Δεν βρέθηκαν αποτελέσματα.</p>';
                }
            } catch (err) {
                resultsArea.innerHTML = '<p style="text-align: center; color: #ff4d4d;">Σφάλμα διακομιστή.</p>';
            }
        });
    }

    function renderDetails() {
        container.innerHTML = `
            <button id="btn-back-list" class="releaf-button" style="align-self: flex-start; background: transparent; border: 1px solid rgba(255,255,255,0.3); padding: 5px 15px;">← Πίσω στα αποτελέσματα</button>
            
            <div style="background: rgba(0,0,0,0.5); padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); margin-top: 10px;">
                <h2 style="color: #10b981; font-family: var(--font-heading); margin: 0 0 10px 0;">${selectedAction.title}</h2>
                <span style="font-size: 0.8rem; background: rgba(16,185,129,0.2); padding: 5px 10px; border-radius: 20px; color: #10b981;">Διοργάνωση: ${selectedAction.organisation}</span>
                
                <p style="font-family: var(--font-mono); color: #ddd; margin-top: 20px; line-height: 1.6;">${selectedAction.description}</p>
                
                <div style="display: flex; gap: 20px; margin-top: 20px; color: #a67c52; font-family: var(--font-mono); font-size: 0.9rem;">
                    <span>📍 ${selectedAction.location}</span>
                    <span>🏷️ ${selectedAction.action_type}</span>
                    <span>👥 Όριο: ${selectedAction.max_participants} θέσεις</span>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    ${currentUser.account_type === 'volunteer' 
                        ? `<button id="btn-participate" class="releaf-button" style="background: #10b981;">Δήλωση Συμμετοχής</button>` 
                        : `<p style="color: #ff4d4d;">Μόνο εθελοντές μπορούν να δηλώσουν συμμετοχή.</p>`}
                </div>
                <div id="participate-msg" style="text-align: center; margin-top: 10px; font-weight: bold;"></div>
            </div>
        `;

        container.querySelector('#btn-back-list').addEventListener('click', renderList);

        const btnParticipate = container.querySelector('#btn-participate');
        if (btnParticipate) {
            btnParticipate.addEventListener('click', async () => {
                try {
                    const response = await fetch(`/actions/${selectedAction.id}/participate`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentUser.id })
                    });
                    const data = await response.json();
                    
                    const msgDiv = container.querySelector('#participate-msg');
                    msgDiv.textContent = data.message || data.detail;
                    msgDiv.style.color = response.ok ? '#10b981' : '#ff4d4d';
                    if (response.ok) btnParticipate.classList.add('hidden');
                } catch (err) {
                    alert('Σφάλμα συστήματος');
                }
            });
        }
    }

    renderList();
    return container;
}