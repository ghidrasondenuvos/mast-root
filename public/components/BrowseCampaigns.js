// Αρχείο: public/components/BrowseCampaigns.js

import { renderDonationCheckout } from './DonationCheckout.js';

export function renderBrowseCampaigns(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 850px; display: flex; flex-direction: column; gap: 15px; position: relative;";

    let campaigns = [];
    let isLoading = true;

    // 1. Fetch Δεδομένων
    async function fetchCampaigns() {
        isLoading = true;
        render();

        try {
            const res = await fetch('/api/campaigns');
            campaigns = await res.json();
            isLoading = false;
            render();
        } catch (e) {
            console.error("Σφάλμα φόρτωσης καμπανιών:", e);
            isLoading = false;
            render();
        }
    }

    // 2. Η συνάρτηση Render της λίστας
    function render() {
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(27, 24, 27, 0.9); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="font-family: var(--font-heading); color: #4f46e5; margin: 0; font-size: 1.8rem;">🤝 Ενεργές Καμπάνιες</h3>
                <button id="btn-back" class="releaf-button" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white; margin: 0;">Πίσω</button>
            </div>
        `;

        if (isLoading) {
            html += `<div style="text-align: center; color: #ccc; margin-top: 50px; font-family: var(--font-mono);">Φόρτωση καμπανιών...</div>`;
        } else if (campaigns.length === 0) {
            html += `
                <div style="background: rgba(0,0,0,0.5); border-radius: 10px; padding: 30px; text-align: center; border: 1px solid rgba(255,255,255,0.1); margin-top: 10px;">
                    <p style="color: #aaa; font-family: var(--font-mono);">Δεν υπάρχουν ενεργές καμπάνιες αυτή τη στιγμή.</p>
                </div>
            `;
        } else {
            html += `<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 10px; height: 60vh; overflow-y: auto; padding-right: 10px;">`;
            
            campaigns.forEach(camp => {
                const progress = Math.min((camp.current_amount / camp.goal_amount) * 100, 100).toFixed(1);
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border-left: 5px solid #4f46e5; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0 0 5px 0; color: #4f46e5; font-family: var(--font-mono); font-size: 1.2rem;">${camp.title}</h4>
                                <span style="font-size: 0.8rem; background: rgba(79, 70, 229, 0.2); padding: 3px 8px; border-radius: 15px; color: #a5b4fc; font-family: var(--font-mono);">Δράση: ${camp.action_title}</span>
                            </div>
                            <button class="btn-donate releaf-button" data-id="${camp.id}" style="background: #4f46e5; margin: 0; padding: 8px 20px; box-shadow: 0 4px 10px rgba(79,70,229,0.3);">Κάνε Δωρεά</button>
                        </div>
                        
                        <p style="color: #ccc; font-size: 0.9rem; line-height: 1.5; margin: 0; font-family: var(--font-mono);">${camp.description}</p>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-family: var(--font-mono); margin-bottom: 5px;">
                                <span style="color: #10b981; font-weight: bold;">Συγκεντρώθηκαν: €${camp.current_amount}</span>
                                <span style="color: #ccc;">Στόχος: €${camp.goal_amount}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                                <div style="width: ${progress}%; background: #4f46e5; height: 100%; transition: width 1s ease-in-out;"></div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;

        // 3. Event Listeners
        const btnBack = container.querySelector('#btn-back');
        if (btnBack) btnBack.addEventListener('click', onBack);

        container.querySelectorAll('.btn-donate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const selectedCampaign = campaigns.find(c => c.id === id);
                
                // --- Η ΜΑΓΕΙΑ: Εμφάνιση του DonationCheckout Component! ---
                const checkoutModal = renderDonationCheckout(
                    currentUser, 
                    selectedCampaign, 
                    () => {
                        // onClose Callback (όταν πατάει ακύρωση)
                        container.removeChild(checkoutModal);
                    }, 
                    () => {
                        // onSuccess Callback (όταν ολοκληρώνεται η πληρωμή)
                        container.removeChild(checkoutModal);
                        fetchCampaigns(); // Ξαναφορτώνουμε τις καμπάνιες για να δούμε τη μπάρα να ανεβαίνει!
                    }
                );
                
                // Προσθέτουμε το modal πάνω από τη λίστα
                container.appendChild(checkoutModal);
            });
        });
    }

    // Εκκίνηση
    fetchCampaigns();

    return container;
}