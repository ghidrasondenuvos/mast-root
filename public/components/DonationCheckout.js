// Αρχείο: public/components/DonationCheckout.js

export function renderDonationCheckout(currentUser, campaign, onClose, onSuccess) {
    const container = document.createElement('div');
    // Το ακριβές style του React για το σκοτεινό, θολό background (Overlay)
    container.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999;";

    // 1. Εσωτερικό State (Αντί για τα useState της React)
    let form = { amount: '', card_number: '', expiry: '', cvv: '', card_name: '' };
    let status = 'idle'; // 'idle', 'processing', 'success', 'error'
    let message = '';
    let receipt = '';

    const inputStyle = "width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; margin-bottom: 15px; font-family: var(--font-mono);";

    // 2. Η συνάρτηση Render
    function render() {
        let html = `
            <div style="background: #fff; width: 100%; max-width: 450px; border-radius: 12px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); position: relative; overflow: hidden; text-align: left; color: #1b181b;">
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-family: var(--font-heading); color: #1b181b; font-size: 1.8rem;">RELEAF Pay</h2>
                    <p style="margin: 5px 0 0 0; color: #666; font-family: var(--font-mono); font-size: 0.9rem;">
                        Χρηματοδότηση: <strong>${campaign.title}</strong>
                    </p>
                </div>
        `;

        // --- STATE: IDLE ή ERROR (Η Φόρμα) ---
        if (status === 'idle' || status === 'error') {
            html += `
                <form id="checkout-form">
                    <div style="position: relative;">
                        <span style="position: absolute; left: 15px; top: 14px; color: #666; font-weight: bold;">€</span>
                        <input type="number" id="chk-amount" required placeholder="Ποσό Δωρεάς" style="${inputStyle} padding-left: 35px; font-weight: bold; font-size: 1.2rem;" value="${form.amount}" min="1" />
                    </div>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                        <label style="display: block; font-size: 0.8rem; color: #495057; margin-bottom: 5px; font-weight: bold; font-family: var(--font-mono);">Στοιχεία Κάρτας</label>
                        <input type="text" id="chk-card" required placeholder="Αριθμός Κάρτας (16 ψηφία)" style="${inputStyle}" value="${form.card_number}" maxlength="16" />
                        
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chk-expiry" required placeholder="MM/YY" style="${inputStyle} margin-bottom: 0;" value="${form.expiry}" maxlength="5" />
                            <input type="text" id="chk-cvv" required placeholder="CVC" style="${inputStyle} margin-bottom: 0;" value="${form.cvv}" maxlength="3" />
                        </div>
                    </div>
                    
                    <input type="text" id="chk-name" required placeholder="Όνομα Κατόχου (όπως αναγράφεται)" style="${inputStyle}" value="${form.card_name}" />

                    ${status === 'error' ? `
                        <div style="color: #d93025; background: #fce8e6; padding: 10px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 15px; text-align: center; font-family: var(--font-mono);">
                            ${message}
                        </div>
                    ` : ''}

                    <button type="submit" style="width: 100%; padding: 15px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(16,185,129,0.3); font-family: var(--font-mono);">
                        Πληρωμή ${form.amount ? `€${form.amount}` : ''}
                    </button>
                    
                    <button type="button" id="btn-cancel" style="width: 100%; padding: 10px; background: transparent; color: #666; border: none; margin-top: 10px; cursor: pointer; text-decoration: underline; font-family: var(--font-mono);">
                        Ακύρωση
                    </button>
                </form>
            `;
        } 
        // --- STATE: PROCESSING (Το Spinner) ---
        else if (status === 'processing') {
            html += `
                <div style="text-align: center; padding: 40px 0;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 20px; color: #666; font-family: var(--font-mono);">Επεξεργασία πληρωμής...</p>
                    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                </div>
            `;
        } 
        // --- STATE: SUCCESS (Η Επιτυχία) ---
        else if (status === 'success') {
            html += `
                <div style="text-align: center; padding: 30px 0;">
                    <div style="font-size: 4rem; margin: 0 0 10px 0;">✅</div>
                    <h3 style="color: #10b981; margin: 0 0 10px 0; font-family: var(--font-heading);">Επιτυχής Δωρεά!</h3>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 5px; font-family: var(--font-mono);">${message}</p>
                    <p style="color: #999; font-size: 0.8rem; font-family: var(--font-mono);">Κωδικός Απόδειξης: ${receipt}</p>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

        // 3. Επανατοποθέτηση Event Listeners
        if (status === 'idle' || status === 'error') {
            const amtInput = container.querySelector('#chk-amount');
            const cardInput = container.querySelector('#chk-card');
            const expInput = container.querySelector('#chk-expiry');
            const cvvInput = container.querySelector('#chk-cvv');
            const nameInput = container.querySelector('#chk-name');

            // Όταν αλλάζει το ποσό, κάνουμε render για να ανανεωθεί το νούμερο πάνω στο κουμπί
            amtInput.addEventListener('input', e => { form.amount = e.target.value; render(); });
            cardInput.addEventListener('input', e => form.card_number = e.target.value);
            expInput.addEventListener('input', e => form.expiry = e.target.value);
            cvvInput.addEventListener('input', e => form.cvv = e.target.value);
            nameInput.addEventListener('input', e => form.card_name = e.target.value);

            container.querySelector('#btn-cancel').addEventListener('click', onClose);

            container.querySelector('#checkout-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                status = 'processing';
                message = '';
                render();

                try {
                    const res = await fetch('/api/donate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sponsor_id: currentUser.id,
                            campaign_id: campaign.id,
                            amount: parseInt(form.amount),
                            card_number: form.card_number
                        })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        status = 'success';
                        message = data.message;
                        receipt = data.receipt;
                        render();
                        
                        // Κλείνει αυτόματα το παράθυρο μετά από 3 δευτερόλεπτα, όπως στη React!
                        setTimeout(() => onSuccess(), 3000);
                    } else {
                        status = 'error';
                        message = data.detail || 'Αποτυχία πληρωμής.';
                        render();
                    }
                } catch (err) {
                    status = 'error';
                    message = 'Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.';
                    render();
                }
            });
        }
    }

    render();
    return container;
}