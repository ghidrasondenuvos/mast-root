export function renderFeed(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; gap: 20px; height: 80vh; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; background: rgba(27,24,27,0.85); border-radius: 15px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 15px;">Διαθέσιμες Μερίδες</h2>
            <div id="feed-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;">
                <p style="color: #aaa; text-align: center; margin-top: 50px;">Φόρτωση...</p>
            </div>
        </div>
        
        <div style="flex: 1.5; border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); position: relative;">
            <div id="map" style="width: 100%; height: 100%;"></div>
        </div>
    `;

    // Fetch posts
    setTimeout(async () => {
        try {
            const res = await fetch('/api/posts?feed=true');
            const posts = await res.json();
            const listContainer = container.querySelector('#feed-list');
            listContainer.innerHTML = '';

            if (posts.length === 0) {
                listContainer.innerHTML = '<p style="color: #aaa; text-align: center;">Δεν υπάρχουν διαθέσιμες μερίδες αυτή τη στιγμή.</p>';
            }

            // Initialize Map
            const mapEl = container.querySelector('#map');
            const map = L.map(mapEl).setView([38.287, 21.788], 13); // Default to Patras / Uni

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            posts.forEach(post => {
                // Card in list
                const isInactive = post.available_portions <= 0;
                const card = document.createElement('div');
                card.style.cssText = `
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 15px;
                    opacity: ${isInactive ? '0.5' : '1'}; transition: transform 0.2s; cursor: pointer;
                `;
                card.innerHTML = `
                    <h3 style="margin: 0 0 5px 0; color: #10b981; font-family: var(--font-heading);">${post.title}</h3>
                    <p style="margin: 0 0 5px 0; color: #ccc; font-size: 0.9rem;">Μάγειρας: ${post.cook_name}</p>
                    <p style="margin: 0 0 5px 0; color: #ccc; font-size: 0.9rem;">Παραλαβή: ${post.pickup_location} | ⏰ ${post.pickup_time}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span style="font-weight: bold; color: ${isInactive ? '#ff4d4d' : '#10b981'};">
                            ${post.available_portions} / ${post.total_portions} διαθέσιμες
                        </span>
                        ${!isInactive && post.cook_id !== state.loggedInUser.id ? `<button class="request-btn releaf-button" style="padding: 5px 15px; font-size: 0.8rem; margin: 0;">Δέσμευση</button>` : ''}
                    </div>
                `;

                // Request logic
                const reqBtn = card.querySelector('.request-btn');
                if (reqBtn) {
                    reqBtn.onclick = async (e) => {
                        e.stopPropagation();
                        if (confirm(`Θέλετε να δεσμεύσετε 1 μερίδα από: ${post.title};\nΑυτό θα κοστίσει 1 credit.`)) {
                            try {
                                const r = await fetch('/api/requests', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ consumer_id: state.loggedInUser.id, post_id: post.id })
                                });
                                const rData = await r.json();
                                alert(rData.message || rData.detail);
                                if (r.ok) {
                                    state.loggedInUser.credits -= 1; // Update local state immediately
                                    navigate('dashboard'); // go to dashboard to see the order
                                }
                            } catch (err) {
                                alert('Σφάλμα.');
                            }
                        }
                    };
                }

                // Add to list
                listContainer.appendChild(card);

                // Add Marker to map
                if (post.latitude && post.longitude) {
                    const marker = L.marker([post.latitude, post.longitude]).addTo(map);
                    marker.bindPopup(`<b>${post.title}</b><br>Μερίδες: ${post.available_portions}`);
                    
                    // Click card -> focus on map
                    card.onclick = () => {
                        map.setView([post.latitude, post.longitude], 16);
                        marker.openPopup();
                    };
                }
            });

        } catch (error) {
            container.querySelector('#feed-list').innerHTML = '<p style="color: #ff4d4d;">Σφάλμα φόρτωσης.</p>';
        }
    }, 100);

    return container;
}
