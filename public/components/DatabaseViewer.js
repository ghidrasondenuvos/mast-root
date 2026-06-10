export function renderDatabaseViewer(onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 30px; border-radius: 15px; width: 100%; max-width: 900px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5);";

    let activeTab = 'users'; // 'users' | 'actions' | 'requests'

    // Mock API Data Fetching για συντομία (θα τραβάνε από το backend αν το έχουμε υλοποιήσει πλήρως)
    async function fetchData() {
        container.innerHTML = '<p style="text-align:center; color:#ccc;">Φόρτωση βάσης δεδομένων...</p>';
        // Σε πλήρη ανάπτυξη εδώ θα καλούσαμε: fetch('/api/db-view')
        setTimeout(renderUI, 500); 
    }

    function renderUI() {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="font-family: var(--font-heading); color: #8db600; margin: 0; font-size: 1.8rem;">🛠️ DB Admin Panel</h2>
                <button class="releaf-button" id="btn-back" style="padding: 5px 15px; font-size: 0.85rem; background: transparent; border: 1px solid white;">Κλείσιμο</button>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="releaf-button btn-tab" data-tab="users" style="padding: 8px 15px; font-size: 0.85rem; background: ${activeTab === 'users' ? 'var(--accent-color)' : 'transparent'};">Χρήστες</button>
                <button class="releaf-button btn-tab" data-tab="actions" style="padding: 8px 15px; font-size: 0.85rem; background: ${activeTab === 'actions' ? 'var(--accent-color)' : 'transparent'};">Δράσεις</button>
            </div>

            <div id="table-container" style="background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; min-height: 200px; padding: 15px;">
                ${getTableHTML()}
            </div>
        `;

        container.querySelector('#btn-back').addEventListener('click', onBack);
        
        container.querySelectorAll('.btn-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeTab = e.target.getAttribute('data-tab');
                renderUI();
            });
        });
    }

    function getTableHTML() {
        if (activeTab === 'users') {
            return `
                <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.85rem;">
                    <thead><tr style="color: var(--accent-color); border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <th style="padding: 10px;">ID</th><th>USERNAME</th><th>EMAIL</th><th>ΡΟΛΟΣ</th>
                    </tr></thead>
                    <tbody>
                        <tr><td style="padding: 10px;">1</td><td>john_doe</td><td>john@example.com</td><td><span style="color:#10b981;">volunteer</span></td></tr>
                        <tr><td style="padding: 10px;">2</td><td>save_hood</td><td>info@savehood.com</td><td><span style="color:#4f46e5;">organisation</span></td></tr>
                    </tbody>
                </table>`;
        } else {
            return `<p style="color: #aaa; text-align: center; margin-top: 20px;">[Προβολή δεδομένων δράσεων]</p>`;
        }
    }

    fetchData();
    return container;
}