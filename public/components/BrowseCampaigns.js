export function renderBrowseCampaigns(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 800px; height: 80vh; display: flex; flex-direction: column; gap: 15px;";

    let campaigns = [];
    let selectedCampaign = null;

    // 1. Οθόνη Λίστας Καμπανιών
    async function renderList() {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-family: var(--font-heading); color: #4f46e5; margin: 0; font-size: 1.8rem;">🤝 Ενεργές Καμπάνιες</h3>
                <button class="releaf-button" id="btn-back" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white;">Πίσω</button>
            </div>
            
            <div id="campaigns-area" style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.5); border-radius: 10px; padding: 15px; border: 1px solid rgba(255,255,255,0.1);">
                <p style="text-align: center; color: #ccc;">Φόρτωση καμπανιών...</p>
            </div>
        `;

        container.querySelector('#btn-back').addEventListener('click', onBack);
        const area = container.querySelector('#campaigns-area');

        try {
            const res = await fetch('/api/campaigns');
            campaigns = await res.json();

            if (campaigns.length === 0) {
                area.innerHTML = '<p style="text-align: center; color: #aaa;">Δεν υπάρχουν ενεργές καμπάνιες αυτή τη στιγμή.</p>';
                return;
            }

            area.innerHTML = '';
            campaigns.forEach(camp => {
                const progress = Math.min((camp.current_amount / camp.goal_amount) * 100, 100);
                
                const card = document.createElement('div');
                card.style.cssText = "background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin-bottom: 15px;";
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: #4f46e5; font-family: var(--font-mono); font-size: 1.2rem;">${camp.title}</h4>
                            <span style="font-size: 0.8rem; background: rgba(79, 70, 229, 0.2); padding: 3px 8px; border-radius: 15px; color: #a5b4fc;">Δράση: ${camp.action_title}</span>
                        </div>
                        <button class="releaf-button btn-donate" data-id="${camp.id}" style="background: #4f46e5; padding: 8px 15px; font-size: 0.9rem;">Κάνε Δωρεά</button>
                    </div>
                    <p style="color: #ccc; font-size: 0.9rem; line-height: 1.5; margin: 15px 0;">${camp.description}</p>
                    
                    <div style="margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-family: var(--font-mono); margin-bottom: 5px;">
                            <span style="color: #10b981;">Συγκεντρώθηκαν: €${camp.current_amount}</span>
                            <span style="color: #ccc;">Στόχος: €${camp.goal_amount}</span>
                        </div>
                        <div style="width: 100%; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${progress}%; background: #4f46e5; height: 100%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                `;
                
                card.querySelector('.btn-donate').addEventListener('click', () => {
                    selectedCampaign = camp;
                    renderCheckout();
                });
                
                area.appendChild(card);
            });
        } catch (err) {
            area.innerHTML = '<p style="text-align: center; color: #ff4d4d;">Σφάλμα διακομιστή.</p>';
        }
    }

    // 2. Οθόνη Checkout (Πληρωμή)
    function renderCheckout() {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                <div id="checkout-panel" style="background: rgba(27, 24, 27, 0.95); padding: 30px; border-radius: 15px; width: 100%; max-width: 400px; text-align: center; border: 1px solid rgba(79, 70, 229, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h2 style="font-family: var(--font-heading); color: #4f46e5; margin: 0 0 5px 0;">RELEAF Pay</h2>
                    <p style="color: #ccc; font-size: 0.85rem; margin-bottom: 20px;">Δωρεά για: ${selectedCampaign.title}</p>
                    
                    <form id="pay-form" style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
                        <input type="number" class="releaf-input" id="pay-amount" placeholder="Ποσό (€)" required />
                        <input type="text" class="releaf-input" id="pay-card" placeholder="Αριθμός Κάρτας (16 ψηφία)" minlength="16" required />
                        <div style="display: flex; gap: 10px;">
                            <input type="text" class="releaf-input" placeholder="MM/YY" required />
                            <input type="text" class="releaf-input" placeholder="CVV" required />
                        </div>
                        <input type="text" class="releaf-input" placeholder="Ονοματεπώνυμο Κατόχου" required />
                        
                        <button type="submit" class="releaf-button" style="background: #4f46e5; margin-top: 15px;">Ολοκλήρωση Πληρωμής</button>
                        <button type="button" id="btn-cancel-pay" style="background: transparent; border: none; color: #ccc; text-decoration: underline; cursor: pointer; margin-top: 10px;">Ακύρωση</button>
                    </form>
                </div>
            </div>
        `;

        container.querySelector('#btn-cancel-pay').addEventListener('click', renderList);

        container.querySelector('#pay-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = container.querySelector('#pay-amount').value;
            const card = container.querySelector('#pay-card').value;
            const panel = container.querySelector('#checkout-panel');

            // Processing UI (To spinner που είχες)
            panel.innerHTML = `
                <div style="padding: 40px 0;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 20px; color: #ccc; font-family: var(--font-mono);">Επεξεργασία πληρωμής...</p>
                </div>
            `;

            try {
                const res = await fetch('/api/donate', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sponsor_id: currentUser.id, campaign_id: selectedCampaign.id, amount, card_number: card })
                });
                const data = await res.json();

                if (res.ok) {
                    panel.innerHTML = `
                        <div style="padding: 30px 0;">
                            <div style="font-size: 4rem; margin: 0 0 10px 0;">✅</div>
                            <h3 style="color: #10b981; margin: 0 0 10px 0; font-family: var(--font-heading);">Επιτυχία!</h3>
                            <p style="color: #ccc; font-size: 0.9rem;">${data.message}</p>
                            <p style="color: #a67c52; font-family: var(--font-mono); font-size: 0.8rem; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;">Αρ. Απόδειξης: ${data.receipt}</p>
                            <button id="btn-done" class="releaf-button" style="background: #10b981;">Επιστροφή</button>
                        </div>
                    `;
                    panel.querySelector('#btn-done').addEventListener('click', renderList);
                } else {
                    panel.innerHTML = `
                        <div style="padding: 30px 0;">
                            <h3 style="color: #ff4d4d; margin: 0 0 10px 0; font-family: var(--font-heading);">Αποτυχία</h3>
                            <p style="color: #ccc; font-size: 0.9rem;">${data.detail}</p>
                            <button id="btn-fail" class="releaf-button" style="margin-top: 15px;">Δοκιμή Ξανά</button>
                        </div>
                    `;
                    panel.querySelector('#btn-fail').addEventListener('click', renderCheckout);
                }
            } catch (err) {
                alert("Σφάλμα σύνδεσης");
                renderList();
            }
        });
    }

    renderList();
    return container;
}