import { showToast, sanitize } from '../app.js';

export function renderDatabaseViewer(onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.95); padding: 20px; border-radius: 15px; width: 95%; max-width: 1200px; height: 80vh; display: flex; flex-direction: column; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; margin-top: 20px;";

    let dataMap = {
        users: [],
        posts: [],
        requests: [],
        reviews: []
    };
    let activeTab = 'users';
    let isEditMode = false;

    async function fetchData() {
        try {
            const [resUsers, resPosts, resReqs, resRevs] = await Promise.all([
                fetch('/api/db-users'),
                fetch('/api/db-posts'),
                fetch('/api/db-requests'),
                fetch('/api/db-reviews')
            ]);
            
            dataMap.users = await resUsers.json();
            dataMap.posts = await resPosts.json();
            dataMap.requests = await resReqs.json();
            dataMap.reviews = await resRevs.json();
            
            isEditMode = false;
            render();
        } catch (err) {
            console.error("Σφάλμα:", err);
            container.innerHTML = `<p style="color: #ff4d4d; text-align: center; margin-top: 50px;">Σφάλμα σύνδεσης με τη Βάση.</p>
            <button id="btn-err-back" class="releaf-button" style="margin: 20px auto; display: block;">Επιστροφή</button>`;
            container.querySelector('#btn-err-back').addEventListener('click', onBack);
        }
    }

    function render() {
        const thStyle = "padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.2); text-transform: uppercase;";
        const tdStyle = "padding: 8px 10px; font-size: 0.85rem;";

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="font-family: var(--font-mono); color: var(--accent-color); margin: 0; font-size: 1.5rem;">
                    ️ db admin (UniBite)
                </h2>
                
                <div style="display: flex; gap: 10px; overflow-x: auto;">
                    <button class="tab-btn" data-tab="users" style="padding: 5px 15px; background: ${activeTab === 'users' ? 'var(--accent-color)' : 'transparent'}; color: #fff; border: 1px solid var(--accent-color); border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">users</button>
                    <button class="tab-btn" data-tab="posts" style="padding: 5px 15px; background: ${activeTab === 'posts' ? '#DA291C' : 'transparent'}; color: #fff; border: 1px solid #DA291C; border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">posts</button>
                    <button class="tab-btn" data-tab="requests" style="padding: 5px 15px; background: ${activeTab === 'requests' ? '#4f46e5' : 'transparent'}; color: #fff; border: 1px solid #4f46e5; border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">requests</button>
                    <button class="tab-btn" data-tab="reviews" style="padding: 5px 15px; background: ${activeTab === 'reviews' ? '#ffcc00' : 'transparent'}; color: #fff; border: 1px solid #ffcc00; border-radius: 5px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem;">reviews</button>
                </div>

                <div style="display: flex; gap: 10px;">
                    ${isEditMode 
                        ? `<button id="btn-save-all" class="releaf-button" style="padding: 5px 15px; font-size: 0.9rem; background: #10b981;">💾 Save All Changes</button>
                           <button id="btn-cancel-edit" class="releaf-button secondary" style="padding: 5px 15px; font-size: 0.9rem;">❌ Cancel</button>`
                        : `<button id="btn-toggle-edit" class="releaf-button" style="padding: 5px 15px; font-size: 0.9rem; background: #3b82f6;">✏️ Ενεργοποίηση Επεξεργασίας</button>`
                    }
                    <button id="btn-close" class="releaf-button" style="padding: 5px 15px; font-size: 0.9rem; margin: 0;">κλείσιμο</button>
                </div>
            </div>
            
            <div style="overflow-y: auto; flex: 1; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: var(--font-mono);" id="db-table">
        `;

        let activeData = dataMap[activeTab];
        if (activeData.length > 0) {
            let columns = Object.keys(activeData[0]);
            
            html += `<thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;"><tr>`;
            columns.forEach(col => { html += `<th style="${thStyle}">${col}</th>`; });
            html += `</tr></thead><tbody>`;

            activeData.forEach((row, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';

                html += `<tr class="db-row" data-id="${row.id}" style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.1)'" onmouseleave="this.style.background='${bg}'">`;
                
                columns.forEach(col => {
                    if (isEditMode && col !== 'id' && col !== 'created_at') {
                        html += `<td style="${tdStyle}"><input type="text" class="edit-input" data-col="${col}" value="${sanitize(String(row[col]))}" style="width: 120px; padding: 4px 6px; background: #2a2a2a; color: #fff; border: 1px solid #555; border-radius: 4px;"></td>`;
                    } else {
                        let val = row[col];
                        if (val !== null && val.length > 50) val = val.substring(0, 50) + '...';
                        html += `<td style="${tdStyle}" title="${sanitize(String(row[col]))}">${sanitize(String(val))}</td>`;
                    }
                });
                
                html += `</tr>`;
            });
            html += `</tbody>`;
        } else {
            html += `<tr><td style="padding: 20px; text-align: center; color: #aaa;">Κανένα δεδομένο</td></tr>`;
        }

        html += `</table></div>`;
        container.innerHTML = html;

        // Attach global events
        container.querySelector('#btn-close').addEventListener('click', onBack);
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeTab = e.target.getAttribute('data-tab');
                isEditMode = false;
                render();
            });
        });

        // Edit Mode Events
        if (isEditMode) {
            container.querySelector('#btn-cancel-edit').addEventListener('click', () => {
                isEditMode = false;
                render();
            });

            container.querySelector('#btn-save-all').addEventListener('click', async () => {
                const rows = container.querySelectorAll('.db-row');
                const batchUpdates = [];
                let hasError = false;

                rows.forEach(row => {
                    const id = parseInt(row.getAttribute('data-id'));
                    const inputs = row.querySelectorAll('.edit-input');
                    const updates = { id };
                    
                    inputs.forEach(input => {
                        const col = input.getAttribute('data-col');
                        const val = input.value.trim();
                        if (!val) {
                            hasError = true;
                        }
                        updates[col] = val;
                    });
                    
                    batchUpdates.push(updates);
                });

                if (hasError) {
                    showToast('Κανένα πεδίο δεν μπορεί να είναι κενό! Διορθώστε τα κενά πεδία.', 'error');
                    return;
                }

                try {
                    const res = await fetch(`/api/db-edit-batch/${activeTab}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(batchUpdates)
                    });
                    
                    if (res.ok) {
                        showToast('Επιτυχής μαζική αποθήκευση!', 'success');
                        await fetchData(); // re-fetch data (this also resets isEditMode to false)
                    } else {
                        const errData = await res.json();
                        showToast(errData.detail || 'Σφάλμα αποθήκευσης.', 'error');
                    }
                } catch (err) {
                    showToast('Σφάλμα δικτύου.', 'error');
                }
            });
        } else {
            const toggleBtn = container.querySelector('#btn-toggle-edit');
            if(toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    isEditMode = true;
                    render();
                });
            }
        }
    }

    container.innerHTML = `<p style="color: #ccc; text-align: center; margin-top: 50px; font-family: var(--font-mono);">Ανάκτηση δεδομένων από τη βάση...</p>`;
    fetchData();

    return container;
}
