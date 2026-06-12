import { showToast, setLoggedInUser } from '../app.js';

export function renderBuyCredits(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column;";

    container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-2xl) var(--space-xl); text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: var(--accent); opacity: 0.1; filter: blur(60px); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -50px; right: -50px; width: 200px; height: 200px; background: var(--secondary); opacity: 0.1; filter: blur(60px); border-radius: 50%;"></div>
            
            <h2 class="font-heading" style="color: var(--text-primary); font-size: 2rem; margin-bottom: var(--space-sm); z-index: 1; position: relative;">Αγορά Credits 💳</h2>
            <p style="color: var(--text-secondary); margin-bottom: var(--space-xl); font-size: 1.05rem; z-index: 1; position: relative;">
                Ενίσχυσε το λογαριασμό σου για να ζητήσεις περισσότερες μερίδες!
            </p>

            <div id="packages-container" style="display: flex; gap: var(--space-md); margin-bottom: var(--space-2xl); flex-wrap: wrap; justify-content: center; z-index: 1; position: relative;">
                <!-- 5 Credits -->
                <div class="credit-pkg glass-card" data-credits="5" data-price="2" style="padding: var(--space-lg); width: 140px; cursor: pointer; transition: all var(--transition-fast); position: relative;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🥉</div>
                    <h3 class="font-heading" style="margin: 0 0 4px 0; color: var(--text-primary); font-size: 1.1rem;">5 Credits</h3>
                    <p class="font-mono" style="margin: 0; color: var(--text-secondary); font-weight: 700; font-size: 1.2rem;">2.00€</p>
                </div>
                
                <!-- 10 Credits (Popular) -->
                <div class="credit-pkg glass-card active" data-credits="10" data-price="3.5" style="padding: var(--space-lg); width: 140px; cursor: pointer; transition: all var(--transition-fast); position: relative; border-color: var(--accent); background: rgba(245, 158, 11, 0.05); transform: scale(1.05); box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🥈</div>
                    <h3 class="font-heading" style="margin: 0 0 4px 0; color: var(--text-primary); font-size: 1.1rem;">10 Credits</h3>
                    <p class="font-mono" style="margin: 0; color: var(--accent); font-weight: 800; font-size: 1.2rem;">3.50€</p>
                    <span style="font-size: 0.65rem; font-weight: 700; background: linear-gradient(135deg, var(--accent), #FBBF24); color: #fff; padding: 4px 10px; border-radius: var(--radius-full); position: absolute; top: -10px; left: 50%; transform: translateX(-50%); letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);">ΔΗΜΟΦΙΛΕΣ</span>
                </div>
                
                <!-- 25 Credits -->
                <div class="credit-pkg glass-card" data-credits="25" data-price="7" style="padding: var(--space-lg); width: 140px; cursor: pointer; transition: all var(--transition-fast); position: relative;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🥇</div>
                    <h3 class="font-heading" style="margin: 0 0 4px 0; color: var(--text-primary); font-size: 1.1rem;">25 Credits</h3>
                    <p class="font-mono" style="margin: 0; color: var(--secondary); font-weight: 700; font-size: 1.2rem;">7.00€</p>
                    <span style="font-size: 0.65rem; font-weight: 700; background: var(--secondary); color: #fff; padding: 2px 8px; border-radius: var(--radius-full); position: absolute; top: -10px; left: 50%; transform: translateX(-50%); letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);">VALUE</span>
                </div>
            </div>

            <form id="payment-form" style="display: flex; flex-direction: column; gap: var(--space-md); text-align: left; background: rgba(0,0,0,0.2); padding: var(--space-xl); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); z-index: 1; position: relative;">
                <h4 class="font-heading" style="margin: 0 0 var(--space-sm) 0; color: var(--text-primary); font-size: 1.1rem;">Στοιχεία Πληρωμής</h4>
                
                <input type="text" id="cc-name" class="releaf-input" placeholder="Ονοματεπώνυμο Κατόχου" style="margin: 0;" />
                <input type="text" id="cc-number" class="releaf-input" placeholder="Αριθμός Κάρτας (π.χ. 4111 1111 ...)" style="margin: 0; font-family: var(--font-mono);" maxlength="19" />
                
                <div style="display: flex; gap: var(--space-sm);">
                    <input type="text" id="cc-exp" class="releaf-input" placeholder="MM/YY" style="margin: 0; flex: 1; font-family: var(--font-mono);" maxlength="5" />
                    <input type="password" id="cc-cvv" class="releaf-input" placeholder="CVV" style="margin: 0; flex: 1; font-family: var(--font-mono);" maxlength="3" />
                </div>

                <div id="pay-error" style="color: var(--danger); font-size: 0.85rem; text-align: center; min-height: 20px;"></div>

                <button type="submit" id="pay-btn" class="releaf-button" style="width: 100%; justify-content: center; margin-top: var(--space-sm); padding: 14px; font-size: 1.1rem; background: linear-gradient(135deg, var(--accent), #FBBF24); border: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                    Ολοκλήρωση Πληρωμής (3.50€)
                </button>
            </form>
            
            <button id="cancel-btn" class="releaf-button secondary" style="width: 100%; justify-content: center; margin-top: var(--space-md); border: none; z-index: 1; position: relative;">Άκυρο</button>
        </div>
    `;

    let selectedCredits = 10;
    let selectedPrice = 3.5;

    const pkgs = container.querySelectorAll('.credit-pkg');
    const payBtn = container.querySelector('#pay-btn');

    pkgs.forEach(pkg => {
        pkg.addEventListener('click', () => {
            pkgs.forEach(p => {
                p.classList.remove('active');
                p.style.borderColor = 'var(--border)';
                p.style.background = 'rgba(255,255,255,0.02)';
                p.style.transform = 'scale(1)';
                p.style.boxShadow = 'none';
                
                // reset text colors
                const priceEl = p.querySelector('p');
                if(p.getAttribute('data-credits') == '5') priceEl.style.color = 'var(--text-secondary)';
                if(p.getAttribute('data-credits') == '10') priceEl.style.color = 'var(--accent)';
                if(p.getAttribute('data-credits') == '25') priceEl.style.color = 'var(--secondary)';
            });

            pkg.classList.add('active');
            
            // Apply active styles based on package
            const credits = parseInt(pkg.getAttribute('data-credits'));
            if (credits === 5) {
                pkg.style.borderColor = 'var(--text-secondary)';
                pkg.style.background = 'rgba(255,255,255,0.05)';
            } else if (credits === 10) {
                pkg.style.borderColor = 'var(--accent)';
                pkg.style.background = 'rgba(245, 158, 11, 0.05)';
            } else if (credits === 25) {
                pkg.style.borderColor = 'var(--secondary)';
                pkg.style.background = 'rgba(99, 102, 241, 0.05)';
            }
            
            pkg.style.transform = 'scale(1.05)';
            pkg.style.boxShadow = `0 8px 24px ${pkg.style.background.replace('0.05', '0.15')}`;

            selectedCredits = credits;
            selectedPrice = parseFloat(pkg.getAttribute('data-price'));
            payBtn.textContent = `Ολοκλήρωση Πληρωμής (${selectedPrice.toFixed(2)}€)`;
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
        payBtn.textContent = 'Ασφαλής Επεξεργασία... 🔒';

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
                    payBtn.textContent = `Ολοκλήρωση Πληρωμής (${selectedPrice.toFixed(2)}€)`;
                }
            } catch (err) {
                errDiv.textContent = 'Πρόβλημα σύνδεσης με τον διακομιστή.';
                payBtn.disabled = false;
                payBtn.textContent = `Ολοκλήρωση Πληρωμής (${selectedPrice.toFixed(2)}€)`;
            }
        }, 2000);
    };

    return container;
}
