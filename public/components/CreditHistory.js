import { showToast } from '../app.js';

export function renderCreditHistory(navigate, state) {
    const container = document.createElement('div');
    if (state.currentView !== 'dashboard') {
        container.className = 'glass-panel';
        container.style.cssText = "width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; animation: fadeInUp 0.5s ease-out;";
    } else {
        container.style.cssText = "width: 100%; animation: fadeInUp 0.5s ease-out;";
    }

    const user = state.loggedInUser;

    container.innerHTML = `
        ${state.currentView !== 'dashboard' ? `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button id="ch-back" class="releaf-button secondary" style="padding: 5px 15px; font-size: 0.8rem; margin: 0;">← Πίσω</button>
                    <h2 style="font-family: var(--font-heading); color: #fff; margin: 0;">Ιστορικό Credits</h2>
                </div>
                <div style="font-family: var(--font-mono); color: #DA291C; font-weight: bold; font-size: 1.2rem;">
                     ${user.credits}
                </div>
            </div>
        ` : `<h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Ιστορικό Credits</h2>`}
        <div id="credit-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto; padding-right: 10px;">
            <p style="color: #aaa; text-align: center; font-family: var(--font-mono); margin-top: 50px;">Φόρτωση...</p>
        </div>
    `;

    container.querySelector('#ch-back').onclick = () => navigate('dashboard');

    fetch(`/api/credit-history/${user.id}`)
        .then(res => res.json())
        .then(data => {
            const list = container.querySelector('#credit-list');
            list.innerHTML = '';

            if (!data || data.length === 0) {
                list.innerHTML = '<p style="color: #aaa; text-align: center; font-family: var(--font-mono); margin-top: 50px;">Δεν υπάρχουν συναλλαγές.</p>';
                return;
            }

            data.forEach(tx => {
                const isPositive = tx.amount > 0;
                let cssClass = 'credit-entry';
                let amountClass = 'credit-amount';
                let amountStr = '';

                if (tx.type === 'penalty' || tx.type === 'spent') {
                    cssClass += ' negative';
                    amountClass += ' negative';
                    amountStr = `-${Math.abs(tx.amount)}`;
                } else if (tx.type === 'bonus' || tx.type === 'welcome') {
                    cssClass += ' bonus';
                    amountClass += ' positive';
                    amountStr = `+${tx.amount}`;
                } else {
                    cssClass += ' positive';
                    amountClass += ' positive';
                    amountStr = `+${tx.amount}`;
                }

                const dateStr = new Date(tx.created_at).toLocaleString('el-GR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });

                const entry = document.createElement('div');
                entry.className = cssClass;
                entry.innerHTML = `
                    <div style="flex: 1;">
                        <div style="color: #fff; margin-bottom: 3px;">${tx.description}</div>
                        <div style="color: #666; font-size: 0.75rem;">${dateStr}</div>
                    </div>
                    <div class="${amountClass}">
                        ${amountStr}
                    </div>
                `;
                list.appendChild(entry);
            });
        })
        .catch(err => {
            console.error(err);
            container.querySelector('#credit-list').innerHTML = '<p style="color: #ff4d4d; text-align: center;">Σφάλμα φόρτωσης.</p>';
        });

    return container;
}
