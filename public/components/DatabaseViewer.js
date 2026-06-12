export function renderDatabaseViewer(onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.95); padding: 20px; border-radius: 15px; width: 95%; max-width: 1200px; height: 80vh; display: flex; flex-direction: column; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; margin-top: 20px;";

    let users = [];
    let posts = [];
    let requests = [];
    let reviews = [];
    let activeTab = 'users';

    async function fetchData() {
        try {
            const [resUsers, resPosts, resReqs, resRevs] = await Promise.all([
                fetch('/api/db-users'),
                fetch('/api/db-posts'),
                fetch('/api/db-requests'),
                fetch('/api/db-reviews')
            ]);
            
            users = await resUsers.json();
            posts = await resPosts.json();
            requests = await resReqs.json();
            reviews = await resRevs.json();
            
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

                <button id="btn-close" class="releaf-button" style="padding: 5px 15px; font-size: 0.9rem; margin: 0;">κλείσιμο</button>
            </div>
            
            <div style="overflow-y: auto; flex: 1; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: var(--font-mono);">
        `;

        if (activeTab === 'users') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: var(--accent-color); font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">username</th><th style="${thStyle}">email</th>
                        <th style="${thStyle}">password</th>
                        <th style="${thStyle}">role</th><th style="${thStyle}">credits</th>
                    </tr>
                </thead>
                <tbody>
            `;
            users.forEach((u, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                html += `
                    <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(166,124,82,0.15)'" onmouseleave="this.style.background='${bg}'">
                        <td style="${tdStyle}">${u.id}</td><td style="${tdStyle} font-weight: bold;">${u.username}</td>
                        <td style="${tdStyle}">${u.email}</td><td style="${tdStyle} font-size: 0.7rem; color: #888; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${u.password}">${u.password}</td><td style="${tdStyle}">${u.role}</td><td style="${tdStyle} color: #DA291C;">${u.credits}</td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        } 
        else if (activeTab === 'posts') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: #DA291C; font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">cook_id</th><th style="${thStyle}">title</th>
                        <th style="${thStyle}">location</th><th style="${thStyle}">portions (avail/tot)</th>
                        <th style="${thStyle}">status</th><th style="${thStyle}">created_at</th>
                    </tr>
                </thead>
                <tbody>
            `;
            posts.forEach((p, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                html += `
                    <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(218,41,28,0.15)'" onmouseleave="this.style.background='${bg}'">
                        <td style="${tdStyle}">${p.id}</td><td style="${tdStyle}">${p.cook_id}</td>
                        <td style="${tdStyle} font-weight: bold;">${p.title}</td><td style="${tdStyle}">${p.pickup_location}</td>
                        <td style="${tdStyle}">${p.available_portions} / ${p.total_portions}</td>
                        <td style="${tdStyle}">${p.status}</td><td style="${tdStyle} color: #aaa;">${new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        }
        else if (activeTab === 'requests') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: #4f46e5; font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">post_id</th><th style="${thStyle}">consumer_id</th>
                        <th style="${thStyle}">status</th><th style="${thStyle}">created_at</th>
                    </tr>
                </thead>
                <tbody>
            `;
            requests.forEach((r, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                html += `
                    <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(79, 70, 229, 0.15)'" onmouseleave="this.style.background='${bg}'">
                        <td style="${tdStyle}">${r.id}</td><td style="${tdStyle}">${r.post_id}</td>
                        <td style="${tdStyle}">${r.consumer_id}</td><td style="${tdStyle} font-weight: bold; color: ${r.status === 'approved' ? '#DA291C' : (r.status === 'rejected' ? '#ff4d4d' : '#fff')}">${r.status.toUpperCase()}</td>
                        <td style="${tdStyle} color: #aaa;">${new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        }
        else if (activeTab === 'reviews') {
            html += `
                <thead style="position: sticky; top: 0; background: #1b181b; z-index: 1;">
                    <tr style="color: #ffcc00; font-size: 0.85rem;">
                        <th style="${thStyle}">id</th><th style="${thStyle}">req_id</th><th style="${thStyle}">cons_id</th>
                        <th style="${thStyle}">cook_id</th><th style="${thStyle}">rating</th><th style="${thStyle}">comment</th><th style="${thStyle}">created_at</th>
                    </tr>
                </thead>
                <tbody>
            `;
            reviews.forEach((r, index) => {
                const bg = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)';
                html += `
                    <tr style="background: ${bg}; transition: background 0.2s;" onmouseenter="this.style.background='rgba(255, 204, 0, 0.15)'" onmouseleave="this.style.background='${bg}'">
                        <td style="${tdStyle}">${r.id}</td><td style="${tdStyle}">${r.request_id}</td>
                        <td style="${tdStyle}">${r.consumer_id}</td><td style="${tdStyle}">${r.cook_id}</td>
                        <td style="${tdStyle} font-weight: bold; color: #ffcc00;">${'⭐'.repeat(r.rating)}</td>
                        <td style="${tdStyle}">${r.comment || '-'}</td>
                        <td style="${tdStyle} color: #aaa;">${new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        }

        html += `</table></div>`;
        container.innerHTML = html;

        container.querySelector('#btn-close').addEventListener('click', onBack);
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeTab = e.target.getAttribute('data-tab');
                render();
            });
        });
    }

    container.innerHTML = `<p style="color: #ccc; text-align: center; margin-top: 50px; font-family: var(--font-mono);">Ανάκτηση δεδομένων από τη βάση...</p>`;
    fetchData();

    return container;
}