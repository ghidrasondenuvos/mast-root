import { showToast, setLoggedInUser } from '../app.js';

export function renderBuyCredits(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 500px; margin: 0 auto; padding: 20px; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <div class="section-panel" style="text-align: center;">
            <h2 class="section-title" style="color: #DA291C;">Αγορά Credits 🪙</h2>
            <p style="color: #ccc; margin-bottom: 20px; font-size: 0.95rem;">
                Μπορείς να κερδίσεις credits προσφέροντας φαγητό δωρεάν ή μπορείς να αγοράσεις επιπλέον αν χρειάζεσαι άμεσα!
            </p>

            <div id="packages-container" style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; justify-content: center;">
                <div class="credit-pkg" data-credits="5" data-price="2" style="border: 2px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; width: 120px; cursor: pointer; transition: all 0.2s;">
                    <h3 style="margin:0 0 5px 0; color:#fff;">5 Credits</h3>
                    <p style="margin:0; color:#DA291C; font-weight:bold; font-size:1.2rem;">2.00€</p>
                </div>
                <div class="credit-pkg" data-credits="10" data-price="3.5" style="border: 2px solid #DA291C; border-radius: 12px; padding: 15px; width: 120px; cursor: pointer; transition: all 0.2s; background: rgba(218,41,28,0.1);">
                    <h3 style="margin:0 0 5px 0; color:#fff;">10 Credits</h3>
                    <p style="margin:0; color:#DA291C; font-weight:bold; font-size:1.2rem;">3.50€</p>
                    <span style="font-size:0.7rem; background:#DA291C; color:#fff; padding:2px 5px; border-radius:5px; position:absolute; transform:translate(-50%, -25px);">ΔΗΜΟΦΙΛΕΣ</span>
                </div>
                <div class="credit-pkg" data-credits="25" data-price="7" style="border: 2px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; width: 120px; cursor: pointer; transition: all 0.2s;">
                    <h3 style="margin:0 0 5px 0; color:#fff;">25 Credits</h3>
                    <p style="margin:0; color:#DA291C; font-weight:bold; font-size:1.2rem;">7.00€</p>
                </div>
            </div>

            <form id="payment-form" style="display: flex; flex-direction: column; gap: 12px; text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                <h4 style="margin: 0 0 10px 0; color: #fff; font-family: var(--font-heading);">Στοιχεία Πληρωμής</h4>
                
                <input type="text" id="cc-name" class="releaf-input" placeholder="Ονοματεπώνυμο Κατόχου" style="margin:0;" />
                <input type="text" id="cc-number" class="releaf-input" placeholder="Αριθμός Κάρτας (π.χ. 4111 1111 ...)" style="margin:0;" maxlength="19" />
                
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="cc-exp" class="releaf-input" placeholder="MM/YY" style="margin:0; flex:1;" maxlength="5" />
                    <input type="password" id="cc-cvv" class="releaf-input" placeholder="CVV" style="margin:0; flex:1;" maxlength="3" />
                </div>

                <div id="pay-error" style="color: #ff4d4d; font-size: 0.85rem; text-align: center; margin-top: 5px;"></div>

                <button type="submit" id="pay-btn" class="releaf-button" style="width: 100%; margin-top: 10px; font-size: 1.1rem;">
                    Πληρωμή 3.50€
                </button>
            </form>
            
            <button id="cancel-btn" class="releaf-button secondary" style="width: 100%; margin-top: 15px;">Ακύρωση</button>
        </div>
    `;

    let selectedCredits = 10;
    let selectedPrice = 3.5;

    const pkgs = container.querySelectorAll('.credit-pkg');
    const payBtn = container.querySelector('#pay-btn');

    pkgs.forEach(pkg => {
        pkg.addEventListener('click', () => {
            pkgs.forEach(p => {
                p.style.borderColor = 'rgba(255,255,255,0.2)';
                p.style.background = 'transparent';
                const badge = p.querySelector('span');
                if(badge) badge.style.display = 'none';
            });

            pkg.style.borderColor = '#DA291C';
            pkg.style.background = 'rgba(218,41,28,0.1)';
            const badge = pkg.querySelector('span');
            if(badge) badge.style.display = 'block';

            selectedCredits = parseInt(pkg.getAttribute('data-credits'));
            selectedPrice = parseFloat(pkg.getAttribute('data-price'));
            payBtn.textContent = `Πληρωμή ${selectedPrice.toFixed(2)}€`;
        });
    });

    container.querySelector('#cancel-btn').onclick = () => navigate('dashboard');

    container.querySelector('#payment-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = container.querySelector('#cc-name').value.trim();
        const number = container.querySelector('#cc-number').value.trim();
        const exp = container.querySelector('#cc-exp').value.trim();
        const cvv = container.querySelector('#cc-cvv').value.trim();
        const errDiv = container.querySelector('#pay-error');

        if (!name || !number || !exp || !cvv) {
            errDiv.textContent = 'Παρακαλώ συμπληρώστε όλα τα πεδία πληρωμής.';
            return;
        }

        if (number.length < 15) {
            errDiv.textContent = 'Μη έγκυρος αριθμός κάρτας.';
            return;
        }

        errDiv.textContent = '';
        payBtn.disabled = true;
        payBtn.textContent = 'Επεξεργασία...';
        payBtn.style.opacity = '0.7';

        // Mock payment delay
        setTimeout(async () => {
            try {
                const res = await fetch('/api/buy-credits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: state.loggedInUser.id,
                        amount: selectedCredits,
                        money_paid: selectedPrice
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast(data.message, 'success');
                    // Fetch updated user to reflect new credits
                    setLoggedInUser(state.loggedInUser); 
                    setTimeout(() => navigate('dashboard'), 1500);
                } else {
                    errDiv.textContent = data.detail || 'Σφάλμα πληρωμής';
                    payBtn.disabled = false;
                    payBtn.textContent = `Πληρωμή ${selectedPrice.toFixed(2)}€`;
                    payBtn.style.opacity = '1';
                }
            } catch (err) {
                errDiv.textContent = 'Πρόβλημα σύνδεσης με τον διακομιστή.';
                payBtn.disabled = false;
                payBtn.textContent = `Πληρωμή ${selectedPrice.toFixed(2)}€`;
                payBtn.style.opacity = '1';
            }
        }, 2000);
    };

    return container;
}
