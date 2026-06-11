// Αρχείο: public/components/DatabaseViewer.js

export function renderDatabaseViewer(onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.95); padding: 20px; border-radius: 15px; width: 95%; max-width: 1200px; height: 80vh; display: flex; flex-direction: column; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden;";

    // 1. Εσωτερικό State
    let users = [];
    let actions = [];
    let requests = [];
    let activeTab = 'users';

    // 2. Φόρτωση Δεδομένων (Αντίστοιχο του useEffect)
    async function fetchData() {
        try {
            const [resUsers, resActions, resReqs] = await Promise.all([
                fetch('/api/db-view'),
                fetch('/api/db-actions'),
                fetch('/api/db-requests')
            ]);
            
            users = await resUsers.json();
            actions = await resActions.json();
            requests = await resReqs.json();
            
            render();
        } catch (err) {
            console.error("Σφάλμα κατά τη φόρτωση της βάσης δεδομένων:", err);
            container.innerHTML = `<p style="color: #ff4d4d; text-align: center; margin-top: 50px; font-family: var(--font-mono);">Σφάλμα σύνδεσης με τη Βάση Δεδομένων.</p>
            <button id="btn-err-back" class="releaf-button" style="margin: 20px auto; display: block;">Επιστροφή</button>`;
            container.querySelector('#btn-err-back').addEventListener('click', onBack);
        }
    }

    // 3. Η συνάρτηση Render
    function render() {
        const thStyle = "padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.2);";
        const tdStyle = "padding: 8px 10px; font-size: 0.85rem;";

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="font-family: var(--font-mono); color: var(--accent-color); margin: 0; font-size: 1.5rem;">
                    🛠️ db admin
                </h2>
                
                <div style="display: flex; gap: 10px;">
                    <button class="tab-btn" data-tab="users" style="padding: 5px 15px; background: ${activeTab === 'users' ? 'var(--accent-color)' : 'transparent'}; color: #fff; border: 1px solid var(--accent-color); border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">Χρήστες</button>
                    <button class="tab-btn" data-tab="actions" style="padding: 5px 15px; background: ${activeTab === 'actions' ? '#10b981' : 'transparent'}; color: #fff; border: 1px solid #10b981; border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">Δράσεις</button>
                    <button class="tab-btn" data-tab="requests" style="padding: 5px 15px; background: ${activeTab === 'requests' ? '#4f46e5' : 'transparent'}; color: #fff; border: 1px solid #4f46e5; border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">Αιτήσεις</button>
                </div>

                <button id="btn-close" class="releaf-button" style="padding: 5px 15px; font-size: 0.9rem; margin: 0;">κλείσιμο</button>
            </div>
            
            <div style="overflow-y: auto; flex: 1; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: var(--font-mono);">
        `;

        if (activeTab === 'users') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: var(--accent-color); font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">username</th><th style="${thStyle}">password</th>
                        <th style="${thStyle}">email</th><th style="${thStyle}">full_name</th><th style="${thStyle}">type</th>
                        <th style="${thStyle}">skills</th><th style="${thStyle}">resources</th>
                    </tr>
                </thead>
                <tbody>
            `;
            users.forEach((u, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                html += `
                    <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(166,124,82,0.15)'" onmouseleave="this.style.background='${bg}'">
                        <td style="${tdStyle}">${u.id}</td><td style="${tdStyle}">${u.username}</td>
                        <td style="${tdStyle} color: #ff4d4d;">${u.password}</td><td style="${tdStyle}">${u.email}</td>
                        <td style="${tdStyle}">${u.full_name}</td><td style="${tdStyle} font-weight: bold;">${u.account_type}</td>
                        <td style="${tdStyle}">${u.skills}</td><td style="${tdStyle}">${u.resources}</td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        } 
        else if (activeTab === 'actions') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: #10b981; font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">τίτλος</th><th style="${thStyle}">περιγραφή</th>
                        <th style="${thStyle}">συμμετέχοντες</th><th style="${thStyle}">τοποθεσία</th>
                        <th style="${thStyle}">τύπος</th><th style="${thStyle}">προφίλ</th>
                    </tr>
                </thead>
                <tbody>
            `;
            actions.forEach((a, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                html += `
                    <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(16,185,129,0.15)'" onmouseleave="this.style.background='${bg}'">
                        <td style="${tdStyle}">${a.id}</td><td style="${tdStyle} font-weight: bold;">${a.title}</td>
                        <td style="${tdStyle} color: #aaa; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${a.description}">${a.description}</td>
                        <td style="${tdStyle}">${a.max_participants}</td><td style="${tdStyle}">${a.location}</td>
                        <td style="${tdStyle}">${a.action_type}</td><td style="${tdStyle} color: #10b981;">${a.organisation}</td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        }
        else if (activeTab === 'requests') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: #4f46e5; font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">εθελοντής</th>
                        <th style="${thStyle}">τίτλος δράσης</th><th style="${thStyle}">κατάσταση (status)</th>
                    </tr>
                </thead>
                <tbody>
            `;
            if (requests.length === 0) {
                html += `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #888;">Δεν βρέθηκαν αιτήσεις.</td></tr>`;
            } else {
                requests.forEach((r, index) => {
                    const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                    const statusColor = r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ff4d4d' : '#fbbf24';
                    html += `
                        <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(79, 70, 229, 0.15)'" onmouseleave="this.style.background='${bg}'">
                            <td style="${tdStyle}">${r.id}</td><td style="${tdStyle} font-weight: bold;">${r.volunteer_name}</td>
                            <td style="${tdStyle}">${r.action_title}</td>
                            <td style="${tdStyle} color: ${statusColor}; font-weight: bold;">${r.status.toUpperCase()}</td>
                        </tr>
                    `;
                });
            }
            html += `</tbody>`;
        }

        html += `</table></div>`;
        container.innerHTML = html;

        // 4. Events
        container.querySelector('#btn-close').addEventListener('click', onBack);
        
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeTab = e.target.getAttribute('data-tab');
                render();
            });
        });
    }

    // Αρχικοποίηση: Φορτώνει τα δεδομένα και ΜΕΤΑ κάνει render
    container.innerHTML = `<p style="color: #ccc; text-align: center; margin-top: 50px; font-family: var(--font-mono);">Ανάκτηση δεδομένων από τη βάση...</p>`;
    fetchData();

    return container;
}