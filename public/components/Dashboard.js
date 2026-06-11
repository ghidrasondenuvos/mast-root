export function renderDashboard(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; animation: fadeInUp 0.5s ease-out;";

    const user = state.loggedInUser;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
            <h2 style="font-family: var(--font-heading); color: #fff; margin: 0;">Το Dashboard μου</h2>
            <div style="font-family: var(--font-mono); color: #10b981; font-weight: bold; font-size: 1.2rem;">
                Διαθέσιμα Credits: ${user.credits}
            </div>
        </div>

        <div style="display: flex; gap: 20px;">
            <!-- COOK SECTION -->
            <div style="flex: 1; background: rgba(27,24,27,0.85); border-radius: 15px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #10b981; font-family: var(--font-heading); margin-top: 0;">👨‍🍳 Ως Μάγειρας</h3>
                <div id="cook-requests-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto;">
                    <p style="color: #aaa; font-size: 0.9rem;">Φόρτωση...</p>
                </div>
            </div>

            <!-- CONSUMER SECTION -->
            <div style="flex: 1; background: rgba(27,24,27,0.85); border-radius: 15px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #4f46e5; font-family: var(--font-heading); margin-top: 0;">🍽️ Ως Καταναλωτής</h3>
                <div id="consumer-requests-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto;">
                    <p style="color: #aaa; font-size: 0.9rem;">Φόρτωση...</p>
                </div>
            </div>
        </div>
    `;

    // Fetch Cook Requests
    fetch(`/api/cook-requests/${user.id}`)
        .then(res => res.json())
        .then(requests => {
            const list = container.querySelector('#cook-requests-list');
            list.innerHTML = '';
            if (requests.length === 0) list.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">Δεν υπάρχουν εισερχόμενα αιτήματα.</p>';

            requests.forEach(req => {
                const card = document.createElement('div');
                card.style.cssText = "background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);";
                card.innerHTML = `
                    <div style="font-weight: bold; color: #fff;">${req.post_title}</div>
                    <div style="color: #ccc; font-size: 0.85rem; margin-bottom: 5px;">Από: ${req.consumer_name}</div>
                    <div style="font-size: 0.8rem; margin-bottom: 10px;">Status: <span style="color: ${getStatusColor(req.status)}">${req.status.toUpperCase()}</span></div>
                `;

                if (req.status === 'pending') {
                    card.innerHTML += `
                        <div style="display: flex; gap: 5px;">
                            <button class="approve-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #10b981;">Αποδοχή</button>
                            <button class="reject-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #ff4d4d;">Απόρριψη</button>
                        </div>
                    `;
                    card.querySelector('.approve-btn').onclick = () => handleDecision(req.id, 'approved');
                    card.querySelector('.reject-btn').onclick = () => handleDecision(req.id, 'rejected');
                } else if (req.status === 'approved') {
                    card.innerHTML += `
                        <div style="display: flex; gap: 5px;">
                            <button class="received-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #4f46e5;">Παραδόθηκε</button>
                            <button class="noshow-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; background: #ff4d4d;">Δεν Εμφανίστηκε (No-Show)</button>
                        </div>
                    `;
                    card.querySelector('.received-btn').onclick = () => handleCompletion(req.id, 'received');
                    card.querySelector('.noshow-btn').onclick = () => handleCompletion(req.id, 'no_show');
                }
                list.appendChild(card);
            });
        });

    // Fetch Consumer Requests
    fetch(`/api/consumer-requests/${user.id}`)
        .then(res => res.json())
        .then(requests => {
            const list = container.querySelector('#consumer-requests-list');
            list.innerHTML = '';
            if (requests.length === 0) list.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">Δεν έχεις ζητήσει κάποια μερίδα ακόμα.</p>';

            requests.forEach(req => {
                const card = document.createElement('div');
                card.style.cssText = "background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);";
                card.innerHTML = `
                    <div style="font-weight: bold; color: #fff;">${req.post_title}</div>
                    <div style="color: #ccc; font-size: 0.85rem; margin-bottom: 5px;">Μάγειρας: ${req.cook_name}</div>
                    <div style="font-size: 0.8rem; margin-bottom: 10px;">Status: <span style="color: ${getStatusColor(req.status)}">${req.status.toUpperCase()}</span></div>
                `;

                if (req.status === 'received') {
                    card.innerHTML += `
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                            <select class="rating-select releaf-input" style="padding: 3px; font-size: 0.8rem; width: auto;">
                                <option value="5">5 Αστέρια</option>
                                <option value="4">4 Αστέρια</option>
                                <option value="3">3 Αστέρια</option>
                                <option value="2">2 Αστέρια</option>
                                <option value="1">1 Αστέρι</option>
                            </select>
                            <button class="rate-btn releaf-button" style="padding: 3px 10px; font-size: 0.8rem; margin: 0;">Αξιολόγηση</button>
                        </div>
                    `;
                    card.querySelector('.rate-btn').onclick = () => handleRating(req.id, req.cook_id, card.querySelector('.rating-select').value);
                }
                list.appendChild(card);
            });
        });

    function getStatusColor(status) {
        if (status === 'pending') return '#ffcc00';
        if (status === 'approved') return '#10b981';
        if (status === 'rejected' || status === 'no_show') return '#ff4d4d';
        if (status === 'received') return '#4f46e5';
        return '#fff';
    }

    async function handleDecision(id, status) {
        await fetch(`/api/requests/${id}/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        navigate('dashboard'); // Refresh
    }

    async function handleCompletion(id, status) {
        await fetch(`/api/requests/${id}/completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        navigate('dashboard'); // Refresh
    }

    async function handleRating(req_id, cook_id, rating) {
        await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: req_id, consumer_id: user.id, cook_id, rating: parseInt(rating) })
        });
        alert('Η αξιολόγηση αποθηκεύτηκε!');
        navigate('dashboard'); // Refresh
    }

    return container;
}