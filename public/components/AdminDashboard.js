export function renderAdminDashboard(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 900px; margin: 0 auto; padding: 20px; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: #ff4d4d; margin-bottom: 20px;">Admin Dashboard</h2>
        
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <div style="flex: 1; background: rgba(27,24,27,0.85); border-radius: 15px; padding: 30px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #ccc; margin-top: 0; font-size: 1rem;">Συνολικές Παραδόσεις (30 μέρες)</h3>
                <div id="admin-total-portions" style="font-size: 3rem; font-weight: bold; color: #10b981;">...</div>
            </div>
        </div>

        <div style="background: rgba(27,24,27,0.85); border-radius: 15px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #fff; font-family: var(--font-heading); margin-top: 0;">🏆 Leaderboard (Top Donors)</h3>
            <table style="width: 100%; border-collapse: collapse; color: #ccc; font-family: var(--font-mono); font-size: 0.9rem;" id="admin-leaderboard">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); text-align: left;">
                        <th style="padding: 10px;">Μάγειρας</th>
                        <th style="padding: 10px;">Μερίδες που μοίρασε</th>
                        <th style="padding: 10px;">Μέση Αξιολόγηση</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="3" style="text-align: center; padding: 20px;">Φόρτωση...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            container.querySelector('#admin-total-portions').textContent = data.total_portions_last_month || 0;
            
            const tbody = container.querySelector('#admin-leaderboard tbody');
            tbody.innerHTML = '';
            
            if (!data.leaderboard || data.leaderboard.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Δεν υπάρχουν δεδομένα.</td></tr>';
            } else {
                data.leaderboard.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                    tr.innerHTML = `
                        <td style="padding: 10px; font-weight: bold; color: #fff;">${row.username}</td>
                        <td style="padding: 10px;">${row.portions_shared}</td>
                        <td style="padding: 10px; color: #ffcc00;">⭐ ${parseFloat(row.avg_rating || 0).toFixed(1)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(e => {
            console.error(e);
            container.querySelector('#admin-total-portions').textContent = 'Error';
        });

    return container;
}
