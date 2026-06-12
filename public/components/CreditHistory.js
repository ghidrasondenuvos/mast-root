import { showToast, sanitize } from '../app.js';

export function renderCreditHistory(navigate, state) {
    const container = document.createElement('div');
    const isStandalone = state.currentView !== 'dashboard';
    
    container.className = isStandalone ? 'fade-in-up glass-panel' : 'fade-in-up';
    container.style.cssText = isStandalone 
        ? "width: 100%; max-width: 800px; margin: 0 auto; padding: var(--space-xl); display: flex; flex-direction: column;"
        : "width: 100%; display: flex; flex-direction: column;";

    const user = state.loggedInUser;

    container.innerHTML = `
        ${isStandalone ? `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: var(--space-md); margin-bottom: var(--space-lg);">
                <div style="display: flex; align-items: center; gap: var(--space-md);">
                    <button id="ch-back" class="releaf-button secondary" style="padding: 6px 12px; font-size: 0.85rem; margin: 0;">← Πίσω</button>
                    <h2 class="font-heading" style="color: var(--text-primary); margin: 0; font-size: 1.5rem;">Ιστορικό Credits</h2>
                </div>
                <div style="background: rgba(245,158,11,0.1); color: var(--accent); border: 1px solid rgba(245,158,11,0.2); padding: 4px 12px; border-radius: var(--radius-full); font-family: var(--font-mono); font-weight: 700; font-size: 1.1rem;">
                     ${user.credits} CR
                </div>
            </div>
        ` : ''}
        
        <div class="${isStandalone ? '' : 'glass-panel'}" style="${isStandalone ? '' : 'padding: var(--space-lg);'} flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            ${!isStandalone ? '<h3 class="font-heading" style="margin: 0 0 var(--space-md) 0; font-size: 1.2rem; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Κινήσεις Λογαριασμού</h3>' : ''}
            
            <div id="credit-list" style="display: flex; flex-direction: column; gap: var(--space-sm); max-height: 500px; overflow-y: auto; padding-right: 5px;">
                <div class="skeleton" style="height: 60px; border-radius: var(--radius-md);"></div>
                <div class="skeleton" style="height: 60px; border-radius: var(--radius-md);"></div>
                <div class="skeleton" style="height: 60px; border-radius: var(--radius-md);"></div>
            </div>
        </div>
    `;

    if (isStandalone) {
        container.querySelector('#ch-back').onclick = () => navigate('dashboard');
    }

    fetch(`/api/credit-history/${user.id}`)
        .then(res => res.json())
        .then(data => {
            const list = container.querySelector('#credit-list');
            list.innerHTML = '';

            if (!data || data.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: var(--space-xl) 0; opacity: 0.6;">
                        <div style="font-size: 2.5rem; margin-bottom: 8px;">💳</div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Δεν υπάρχουν ακόμα κινήσεις.</p>
                    </div>
                `;
                return;
            }

            data.forEach((tx, idx) => {
                const isPositive = tx.amount > 0;
                const isNegative = tx.amount < 0;
                
                let icon = '🔄';
                let amountColor = 'var(--text-primary)';
                let bgColor = 'rgba(255,255,255,0.02)';
                let amountStr = tx.amount > 0 ? `+${tx.amount}` : tx.amount;

                if (tx.type === 'penalty' || tx.type === 'spent') {
                    icon = '📉';
                    amountColor = 'var(--danger)';
                    bgColor = 'rgba(239, 68, 68, 0.05)';
                } else if (tx.type === 'bonus' || tx.type === 'welcome') {
                    icon = '🎁';
                    amountColor = 'var(--success)';
                    bgColor = 'rgba(16, 185, 129, 0.05)';
                } else if (tx.amount > 0) {
                    icon = '📈';
                    amountColor = 'var(--accent)';
                    bgColor = 'rgba(245, 158, 11, 0.05)';
                }

                const dateStr = new Date(tx.created_at).toLocaleString('el-GR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });

                const entry = document.createElement('div');
                entry.className = 'stagger';
                entry.style.animationDelay = `${idx * 0.05}s`;
                entry.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); background: ${bgColor}; border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-md); transition: background var(--transition-fast);`;
                
                entry.onmouseenter = () => entry.style.background = 'rgba(255,255,255,0.05)';
                entry.onmouseleave = () => entry.style.background = bgColor;

                entry.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <div style="font-size: 1.2rem;">${icon}</div>
                        <div>
                            <div style="color: var(--text-primary); font-weight: 500; font-size: 0.95rem; margin-bottom: 2px;">${sanitize(tx.description)}</div>
                            <div style="color: var(--text-tertiary); font-size: 0.75rem; font-family: var(--font-mono);">${dateStr}</div>
                        </div>
                    </div>
                    <div style="font-family: var(--font-mono); font-weight: 700; font-size: 1.2rem; color: ${amountColor};">
                        ${amountStr}
                    </div>
                `;
                list.appendChild(entry);
            });
        })
        .catch(err => {
            console.error(err);
            container.querySelector('#credit-list').innerHTML = '<p style="color: var(--danger); text-align: center;">Σφάλμα φόρτωσης.</p>';
        });

    return container;
}
