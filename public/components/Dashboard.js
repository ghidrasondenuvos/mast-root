import { showToast } from '../app.js';
import { renderCreditHistory } from './CreditHistory.js';
import { renderNotifications } from './Notifications.js';

export function renderDashboard(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; flex-direction: column; animation: fadeInUp 0.5s ease-out;";

    const user = state.loggedInUser;

    container.innerHTML = `
        <div style="background: rgba(218, 41, 28, 0.15); border: 1px solid rgba(218, 41, 28, 0.3); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #DA291C; font-family: var(--font-heading);"> Καλώς ήρθες, ${user.username}!</h3>
            <p style="margin: 0; color: #ddd; font-family: var(--font-mono); font-size: 0.95rem; line-height: 1.5;">
                Αυτό είναι το Dashboard σου. Εδώ μπορείς να διαχειριστείς τα <strong>Αιτήματα</strong> (ό,τι έχεις ζητήσει ή ό,τι σου έχουν ζητήσει), 
                να δεις το <strong>Ιστορικό Credits</strong> σου και να παρακολουθήσεις τις <strong>Ειδοποιήσεις</strong> σου, όλα σε ένα σημείο!
            </p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="font-family: var(--font-heading); color: #fff; margin: 0;">Το Dashboard μου</h2>
            <div style="font-family: var(--font-mono); color: #DA291C; font-weight: bold; font-size: 1.2rem;">
                 ${user.credits}
            </div>
        </div>

        <div class="tab-bar" style="display: flex; gap: 10px; border-bottom: 2px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
            <button class="tab-item active" data-tab="requests" style="background: none; border: none; color: #fff; padding: 10px 20px; cursor: pointer; font-family: var(--font-heading); font-size: 1.1rem; border-bottom: 3px solid #DA291C; opacity: 1;">Αιτήματα</button>
            <button class="tab-item" data-tab="history" style="background: none; border: none; color: #fff; padding: 10px 20px; cursor: pointer; font-family: var(--font-heading); font-size: 1.1rem; border-bottom: 3px solid transparent; opacity: 0.6;">Ιστορικό Credits</button>
            <button class="tab-item" data-tab="notifications" style="background: none; border: none; color: #fff; padding: 10px 20px; cursor: pointer; font-family: var(--font-heading); font-size: 1.1rem; border-bottom: 3px solid transparent; opacity: 0.6;">Ειδοποιήσεις</button>
        </div>

        <div id="tab-content" style="width: 100%;">
            <!-- Content will be injected here -->
        </div>
    `;

    const tabContent = container.querySelector('#tab-content');
    const tabs = container.querySelectorAll('.tab-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.borderBottomColor = 'transparent';
                t.style.opacity = '0.6';
            });
            e.target.classList.add('active');
            e.target.style.borderBottomColor = '#DA291C';
            e.target.style.opacity = '1';
            renderTab(e.target.getAttribute('data-tab'));
        });
    });

    function renderTab(tabName) {
        tabContent.innerHTML = '';
        if (tabName === 'requests') {
            renderRequestsTab();
        } else if (tabName === 'history') {
            const histComp = renderCreditHistory(navigate, state);
            // Remove the title/padding of the original component if desired, but adding it directly is fine
            tabContent.appendChild(histComp);
        } else if (tabName === 'notifications') {
            const notifComp = renderNotifications(navigate, state);
            tabContent.appendChild(notifComp);
        }
    }

    function renderRequestsTab() {
        tabContent.innerHTML = `
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <!-- COOK SECTION -->
                <div class="section-panel" style="flex: 1; min-width: 300px;">
                    <h3 class="section-title" style="color: #DA291C;">‍ Ως Μάγειρας</h3>
                    <div id="cook-requests-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
                        <p style="color: #aaa; font-size: 0.9rem;">Φόρτωση...</p>
                    </div>
                </div>

                <!-- CONSUMER SECTION -->
                <div class="section-panel" style="flex: 1; min-width: 300px;">
                    <h3 class="section-title" style="color: #4f46e5;">️ Ως Καταναλωτής</h3>
                    <div id="consumer-requests-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
                        <p style="color: #aaa; font-size: 0.9rem;">Φόρτωση...</p>
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
                    list.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">Δεν υπάρχουν εισερχόμενα αιτήματα.</p>';
                    return;
                }

                requests.forEach(req => {
                    const card = document.createElement('div');
                    card.className = 'request-card';
                    card.innerHTML = `
                        <div style="font-weight: bold; color: #fff;">${req.post_title}</div>
                        <div style="color: #ccc; font-size: 0.85rem; margin-bottom: 5px;">Από: ${req.consumer_name}</div>
                        <div style="margin-bottom: 10px;">
                            <span class="status-badge status-${req.status}">${req.status}</span>
                        </div>
                    `;

                    if (req.status === 'pending') {
                        card.innerHTML += `
                            <div style="display: flex; gap: 5px;">
                                <button class="approve-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #DA291C; margin: 0;">Αποδοχή</button>
                                <button class="reject-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #ff4d4d; margin: 0;">Απόρριψη</button>
                            </div>
                        `;
                        card.querySelector('.approve-btn').onclick = () => handleDecision(req.id, 'approved');
                        card.querySelector('.reject-btn').onclick = () => handleDecision(req.id, 'rejected');
                    } else if (req.status === 'approved') {
                        card.innerHTML += `
                            <div style="display: flex; gap: 5px;">
                                <button class="received-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #4f46e5; margin: 0;">Παραδόθηκε</button>
                                <button class="noshow-btn releaf-button secondary" style="padding: 3px 10px; font-size: 0.8rem; border-color: #ff4d4d; color: #ff4d4d; margin: 0;">No-Show</button>
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
                    list.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">Δεν έχεις ζητήσει κάποια μερίδα ακόμα.</p>';
                    return;
                }

                requests.forEach(req => {
                    const card = document.createElement('div');
                    card.className = 'request-card';
                    card.innerHTML = `
                        <div style="font-weight: bold; color: #fff;">${req.post_title}</div>
                        <div style="color: #ccc; font-size: 0.85rem; margin-bottom: 5px;">Μάγειρας: ${req.cook_name}</div>
                        <div style="margin-bottom: 10px;">
                            <span class="status-badge status-${req.status}">${req.status}</span>
                        </div>
                    `;

                    if (req.status === 'received') {
                        card.innerHTML += `
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                                <select class="rating-select releaf-input" style="padding: 5px; font-size: 0.8rem; width: auto; margin: 0;">
                                    <option value="5">⭐⭐⭐⭐⭐</option>
                                    <option value="4">⭐⭐⭐⭐</option>
                                    <option value="3">⭐⭐⭐</option>
                                    <option value="2">⭐⭐</option>
                                    <option value="1">⭐</option>
                                </select>
                                <button class="rate-btn releaf-button" style="padding: 5px 10px; font-size: 0.8rem; margin: 0;">Αξιολόγηση</button>
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