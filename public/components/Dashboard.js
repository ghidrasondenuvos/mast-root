import { showToast, sanitize } from '../app.js';
import { renderCreditHistory } from './CreditHistory.js';
import { renderNotifications } from './Notifications.js';

export function renderDashboard(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column;";

    const user = state.loggedInUser;

    container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-xl); margin-bottom: var(--space-lg); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-md);">
            <div>
                <h2 class="font-heading" style="margin: 0 0 var(--space-xs) 0; color: var(--text-primary); font-size: 2rem; font-weight: 800;">
                    Καλώς ήρθες, <span style="background: linear-gradient(135deg, var(--accent), #FBBF24); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${sanitize(user.username)}</span>!
                </h2>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.95rem;">
                    Διαχειρίσου τα αιτήματά σου, παρακολούθησε τα credits σου και δες τις ειδοποιήσεις σου.
                </p>
            </div>
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: var(--space-md) var(--space-lg); border-radius: var(--radius-lg); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px;">Υπόλοιπο</span>
                <div class="font-heading" style="color: var(--accent); font-weight: 800; font-size: 2rem; line-height: 1;">${user.credits} <span style="font-size: 1rem; color: var(--accent);">credits</span></div>
            </div>
        </div>

        <div class="tab-bar">
            <button class="tab-item active" data-tab="requests">Αιτήματα & Παραδόσεις</button>
            <button class="tab-item" data-tab="history">Ιστορικό Credits</button>
            <button class="tab-item" data-tab="notifications">Ειδοποιήσεις <span class="badge" style="background: var(--danger); color: white; padding: 2px 6px; font-size: 0.7rem; border: none; margin-left: 6px; display: ${state.notificationCount > 0 ? 'inline-block' : 'none'};">${state.notificationCount}</span></button>
        </div>

        <div id="tab-content" style="width: 100%;">
            <!-- Content will be injected here -->
        </div>
    `;

    const tabContent = container.querySelector('#tab-content');
    const tabs = container.querySelectorAll('.tab-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderTab(e.currentTarget.getAttribute('data-tab'));
        });
    });

    function renderTab(tabName) {
        tabContent.innerHTML = '';
        tabContent.className = 'fade-in';
        if (tabName === 'requests') {
            renderRequestsTab();
        } else if (tabName === 'history') {
            const histComp = renderCreditHistory(navigate, state);
            tabContent.appendChild(histComp);
        } else if (tabName === 'notifications') {
            const notifComp = renderNotifications(navigate, state);
            tabContent.appendChild(notifComp);
        }
    }

    function renderRequestsTab() {
        tabContent.innerHTML = `
            <div style="display: flex; gap: var(--space-xl); flex-wrap: wrap; align-items: flex-start;">
                <!-- COOK SECTION -->
                <div class="glass-panel" style="flex: 1; min-width: 320px; padding: var(--space-lg);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-md); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">
                        <span style="font-size: 1.5rem;">👨‍🍳</span>
                        <h3 class="font-heading" style="margin: 0; font-size: 1.2rem; color: var(--accent);">Ως Μάγειρας</h3>
                    </div>
                    <div id="cook-requests-list" style="display: flex; flex-direction: column; gap: var(--space-md); max-height: 500px; overflow-y: auto; padding-right: 5px;">
                        <div class="skeleton" style="height: 100px; border-radius: var(--radius-md);"></div>
                        <div class="skeleton" style="height: 100px; border-radius: var(--radius-md);"></div>
                    </div>
                </div>

                <!-- CONSUMER SECTION -->
                <div class="glass-panel" style="flex: 1; min-width: 320px; padding: var(--space-lg);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-md); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">
                        <span style="font-size: 1.5rem;">🍽️</span>
                        <h3 class="font-heading" style="margin: 0; font-size: 1.2rem; color: var(--secondary);">Ως Καταναλωτής</h3>
                    </div>
                    <div id="consumer-requests-list" style="display: flex; flex-direction: column; gap: var(--space-md); max-height: 500px; overflow-y: auto; padding-right: 5px;">
                        <div class="skeleton" style="height: 100px; border-radius: var(--radius-md);"></div>
                        <div class="skeleton" style="height: 100px; border-radius: var(--radius-md);"></div>
                    </div>
                </div>
            </div>
        `;

        fetchCookRequests();
        fetchConsumerRequests();
    }

    function fetchCookRequests() {
        fetch(`/api/cook-requests/${user.id}`)
            .then(res => res.json())
            .then(requests => {
                const list = tabContent.querySelector('#cook-requests-list');
                if (!list) return;
                list.innerHTML = '';
                if (requests.length === 0) {
                    list.innerHTML = `
                        <div style="text-align: center; padding: var(--space-xl) 0; opacity: 0.6;">
                            <div style="font-size: 2.5rem; margin-bottom: 8px;">📭</div>
                            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Δεν υπάρχουν αιτήματα για το φαγητό σας.</p>
                        </div>
                    `;
                    return;
                }

                requests.forEach((req, idx) => {
                    const card = document.createElement('div');
                    card.className = 'glass-card stagger';
                    card.style.animationDelay = `${idx * 0.05}s`;
                    card.style.padding = 'var(--space-md)';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div style="font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">${sanitize(req.post_title)}</div>
                            <span class="status-badge status-${req.status}">${req.status}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: var(--space-md);">
                            <span style="width: 20px; height: 20px; border-radius: 50%; background: var(--surface-elevated); display: inline-flex; align-items: center; justify-content: center; font-size: 0.6rem;">👤</span>
                            Ζητήθηκε από: <strong>${sanitize(req.consumer_name)}</strong>
                        </div>
                    `;

                    if (req.status === 'pending') {
                        card.innerHTML += `
                            <div style="display: flex; gap: 8px; margin-top: auto;">
                                <button class="releaf-button approve-btn" style="flex: 1; padding: 6px 12px; font-size: 0.8rem; background: var(--success); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Αποδοχή</button>
                                <button class="releaf-button danger reject-btn" style="flex: 1; padding: 6px 12px; font-size: 0.8rem;">Απόρριψη</button>
                            </div>
                        `;
                        card.querySelector('.approve-btn').onclick = () => handleDecision(req.id, 'approved');
                        card.querySelector('.reject-btn').onclick = () => handleDecision(req.id, 'rejected');
                    } else if (req.status === 'approved') {
                        card.innerHTML += `
                            <div style="display: flex; gap: 8px; margin-top: auto;">
                                <button class="releaf-button indigo received-btn" style="flex: 1; padding: 6px 12px; font-size: 0.8rem;">Παραδόθηκε ✓</button>
                                <button class="releaf-button danger noshow-btn" style="flex: 1; padding: 6px 12px; font-size: 0.8rem;">Δεν Εμφανίστηκε</button>
                            </div>
                        `;
                        card.querySelector('.received-btn').onclick = () => handleCompletion(req.id, 'received');
                        card.querySelector('.noshow-btn').onclick = () => handleCompletion(req.id, 'no_show');
                    }
                    list.appendChild(card);
                });
            });
    }

    function fetchConsumerRequests() {
        fetch(`/api/consumer-requests/${user.id}`)
            .then(res => res.json())
            .then(requests => {
                const list = tabContent.querySelector('#consumer-requests-list');
                if (!list) return;
                list.innerHTML = '';
                if (requests.length === 0) {
                    list.innerHTML = `
                        <div style="text-align: center; padding: var(--space-xl) 0; opacity: 0.6;">
                            <div style="font-size: 2.5rem; margin-bottom: 8px;">🍽️</div>
                            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Δεν έχεις ζητήσει κάποια μερίδα ακόμα.</p>
                        </div>
                    `;
                    return;
                }

                requests.forEach((req, idx) => {
                    const card = document.createElement('div');
                    card.className = 'glass-card stagger';
                    card.style.animationDelay = `${idx * 0.05}s`;
                    card.style.padding = 'var(--space-md)';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div style="font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">${sanitize(req.post_title)}</div>
                            <span class="status-badge status-${req.status}">${req.status}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: var(--space-md);">
                            <span style="width: 20px; height: 20px; border-radius: 50%; background: var(--surface-elevated); display: inline-flex; align-items: center; justify-content: center; font-size: 0.6rem;">👨‍🍳</span>
                            Μάγειρας: <strong>${sanitize(req.cook_name)}</strong>
                        </div>
                    `;

                    if (req.status === 'received') {
                        card.innerHTML += `
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-sm); margin-top: auto;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Αξιολόγησε τον μάγειρα:</div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <select class="releaf-input rating-select" style="padding: 6px 10px; font-size: 0.8rem; flex: 1;">
                                        <option value="5">⭐⭐⭐⭐⭐ Τέλεια!</option>
                                        <option value="4">⭐⭐⭐⭐ Πολύ καλά</option>
                                        <option value="3">⭐⭐⭐ Μέτρια</option>
                                        <option value="2">⭐⭐ Κακούτσικα</option>
                                        <option value="1">⭐ Πολύ κακά</option>
                                    </select>
                                    <button class="releaf-button rate-btn" style="padding: 6px 14px; font-size: 0.8rem; white-space: nowrap;">Βαθμολογία</button>
                                </div>
                            </div>
                        `;
                        card.querySelector('.rate-btn').onclick = () => handleRating(req.id, req.cook_id, card.querySelector('.rating-select').value);
                    }
                    list.appendChild(card);
                });
            });
    }

    async function handleDecision(id, status) {
        try {
            const res = await fetch(`/api/requests/${id}/decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if(res.ok) {
                showToast(`Το αίτημα ${status === 'approved' ? 'εγκρίθηκε' : 'απορρίφθηκε'}`, 'success');
                fetchCookRequests();
            } else {
                const data = await res.json();
                showToast(data.detail, 'error');
            }
        } catch(e) {
            showToast('Σφάλμα σύνδεσης', 'error');
        }
    }

    async function handleCompletion(id, status) {
        try {
            const res = await fetch(`/api/requests/${id}/completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if(res.ok) {
                showToast('Η κατάσταση ενημερώθηκε', 'success');
                fetchCookRequests();
            } else {
                const data = await res.json();
                showToast(data.detail, 'error');
            }
        } catch(e) {
            showToast('Σφάλμα σύνδεσης', 'error');
        }
    }

    async function handleRating(req_id, cook_id, rating) {
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: req_id, consumer_id: user.id, cook_id, rating: parseInt(rating) })
            });
            const data = await res.json();
            if(res.ok) {
                showToast(data.message, 'success');
                fetchConsumerRequests();
            } else {
                showToast(data.detail, 'error');
            }
        } catch(e) {
            showToast('Σφάλμα σύνδεσης', 'error');
        }
    }

    // Initial render
    renderTab('requests');

    return container;
}