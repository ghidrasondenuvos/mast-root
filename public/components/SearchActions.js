// Αρχείο: public/components/SearchActions.js

export function renderSearchActions(currentUser) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; height: 100%; display: flex; flex-direction: column; gap: 15px;";

    // 1. Εσωτερικό State (Αντί για useState)
    let criteria = { location: '', action_type: '', keyword: '' };
    let results = [];
    let error = '';
    let hasSearched = false;
    
    // State για την Οθόνη Λεπτομερειών Δράσης
    let selectedAction = null;
    let participationResult = { status: '', message: '' };

    // 2. Η συνάρτηση Render
    function render() {
        let html = '';

        // --- ΟΘΟΝΗ ΛΕΠΤΟΜΕΡΕΙΩΝ ΔΡΑΣΗΣ ---
        if (selectedAction) {
            html += `
                <button id="btn-back-search" style="align-self: flex-start; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-family: var(--font-mono);">
                    ← Πίσω στα αποτελέσματα
                </button>
                
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); margin-top: 10px;">
                    <h2 style="color: #DA291C; font-family: var(--font-heading); margin: 0 0 10px 0;">${selectedAction.title}</h2>
                    <span style="font-size: 0.8rem; background: rgba(218,41,28,0.2); padding: 5px 10px; border-radius: 20px; color: #DA291C;">Διοργάνωση: ${selectedAction.organisation}</span>
                    
                    <p style="font-family: var(--font-mono); color: #ddd; margin-top: 20px; line-height: 1.6;">${selectedAction.description}</p>
                    
                    <div style="display: flex; gap: 20px; margin-top: 20px; color: #a67c52; font-family: var(--font-mono); font-size: 0.9rem;">
                        <span> ${selectedAction.location}</span>
                        <span>️ ${selectedAction.action_type}</span>
                        <span> Όριο: ${selectedAction.max_participants} θέσεις</span>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            `;

            if (currentUser && currentUser.account_type === 'volunteer') {
                if (participationResult.message) {
                    const color = participationResult.status === 'success' ? '#DA291C' : '#ff4d4d';
                    html += `<p style="color: ${color}; font-family: var(--font-mono); font-size: 1.1rem; font-weight: bold;">${participationResult.message}</p>`;
                } else {
                    html += `<button id="btn-participate" class="releaf-button" style="background: #DA291C; color: white; font-weight: bold; margin: 0;">Δήλωση Συμμετοχής</button>`;
                }
            } else {
                html += `<p style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.9rem;">Μόνο λογαριασμοί εθελοντών μπορούν να δηλώσουν συμμετοχή.</p>`;
            }

            html += `</div></div>`;
        } 
        // --- ΟΘΟΝΗ ΑΝΑΖΗΤΗΣΗΣ (Λίστα) ---
        else {
            html += `
                <h3 style="font-family: var(--font-heading); color: var(--accent-color); margin: 0 0 5px 0; font-size: 1.4rem;">
                     Αναζήτηση Δράσεων
                </h3>
                
                <form id="search-form" style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <input id="search-keyword" class="releaf-input" placeholder="Λέξη-κλειδί (π.χ. Δάσος)" style="flex: 1 1 30%; margin: 0; padding: 10px; font-size: 0.85rem; box-sizing: border-box;" value="${criteria.keyword}" />
                    <input id="search-location" class="releaf-input" placeholder="Περιοχή (π.χ. Πάτρα)" style="flex: 1 1 30%; margin: 0; padding: 10px; font-size: 0.85rem; box-sizing: border-box;" value="${criteria.location}" />
                    <input id="search-type" class="releaf-input" placeholder="Τύπος (π.χ. Καθαρισμός)" style="flex: 1 1 30%; margin: 0; padding: 10px; font-size: 0.85rem; box-sizing: border-box;" value="${criteria.action_type}" />
                    <button class="releaf-button" type="submit" style="flex: 1 1 100%; margin: 0; padding: 10px; background: var(--accent-color); color: #fff;">Εκτέλεση Αναζήτησης</button>
                </form>

                <div style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px; border: 1px solid rgba(255,255,255,0.1); margin-top: 5px;">
            `;

            if (error) {
                html += `<p style="color: #ff4d4d; font-family: var(--font-mono); text-align: center; margin-top: 20px;">${error}</p>`;
            } else if (results.length > 0) {
                html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
                results.forEach(action => {
                    html += `
                        <div class="action-card" data-id="${action.id}" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid #DA291C; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.1)'" onmouseleave="this.style.background='rgba(255,255,255,0.05)'">
                            <h4 style="margin: 0 0 5px 0; color: #DA291C; font-family: var(--font-mono);">${action.title}</h4>
                            <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${action.description}</p>
                            <span style="font-size: 0.75rem; color: #a67c52; font-family: var(--font-mono);"> ${action.location} (Πατήστε για λεπτομέρειες)</span>
                        </div>
                    `;
                });
                html += `</div>`;
            } else if (hasSearched) {
                html += `<p style="color: #aaa; font-family: var(--font-mono); text-align: center; margin-top: 20px;">Δεν βρέθηκαν αποτελέσματα.</p>`;
            } else {
                html += `<div style="color: #888; font-family: var(--font-mono); text-align: center; margin-top: 30px; font-size: 0.9rem;">Συμπληρώστε τα φίλτρα για αναζήτηση.</div>`;
            }

            html += `</div>`;
        }

        container.innerHTML = html;

        // 3. Event Listeners
        if (selectedAction) {
            container.querySelector('#btn-back-search').addEventListener('click', () => {
                selectedAction = null;
                participationResult = { status: '', message: '' };
                render();
            });

            const btnPart = container.querySelector('#btn-participate');
            if (btnPart) {
                btnPart.addEventListener('click', async () => {
                    try {
                        const response = await fetch(`/actions/${selectedAction.id}/participate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: currentUser.id })
                        });
                        const data = await response.json();
                        
                        if (response.ok) {
                            participationResult = { status: 'success', message: data.message };
                        } else {
                            participationResult = { status: 'error', message: data.detail };
                        }
                    } catch (err) {
                        participationResult = { status: 'error', message: 'Σφάλμα σύνδεσης με το σύστημα.' };
                    }
                    render();
                });
            }
        } else {
            const kwInput = container.querySelector('#search-keyword');
            const locInput = container.querySelector('#search-location');
            const typeInput = container.querySelector('#search-type');

            kwInput.addEventListener('input', e => criteria.keyword = e.target.value);
            locInput.addEventListener('input', e => criteria.location = e.target.value);
            typeInput.addEventListener('input', e => criteria.action_type = e.target.value);

            container.querySelector('#search-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                error = '';
                hasSearched = true;
                selectedAction = null;
                
                const params = new URLSearchParams();
                if (criteria.location) params.append('location', criteria.location);
                if (criteria.action_type) params.append('action_type', criteria.action_type);
                if (criteria.keyword) params.append('keyword', criteria.keyword);

                try {
                    const response = await fetch(`/api/search-actions?${params.toString()}`);
                    const data = await response.json();
                    
                    if (response.ok) {
                        results = data;
                    } else {
                        results = [];
                        error = data.detail || 'Σφάλμα κατά την αναζήτηση.';
                    }
                } catch (err) {
                    results = [];
                    error = 'Αδυναμία σύνδεσης με τον διακομιστή.';
                }
                render();
            });

            const actionCards = container.querySelectorAll('.action-card');
            actionCards.forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.getAttribute('data-id'));
                    selectedAction = results.find(a => a.id === id);
                    render();
                });
            });
        }
    }

    render();
    return container;
}