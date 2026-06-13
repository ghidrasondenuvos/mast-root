import { showToast, sanitize } from '../app.js';

export function renderFeed(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; height: 100%;";

    container.innerHTML = `
        <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: var(--space-xl); margin-bottom: var(--space-lg);">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--space-lg); flex-wrap: wrap; gap: var(--space-md);">
                <h2 class="font-heading" style="color: var(--text-primary); font-size: 2rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;">🍽️ Διαθέσιμες Μερίδες</h2>
                
                <div style="display: flex; gap: var(--space-md); align-items: center;">
                    <!-- Map Toggle -->
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: var(--radius-full); display: flex; overflow: hidden; padding: 2px;">
                        <button id="view-list-btn" style="padding: 6px 16px; border: none; background: var(--accent); color: white; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Λίστα</button>
                        <button id="view-map-btn" style="padding: 6px 16px; border: none; background: transparent; color: var(--text-secondary); border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Χάρτης</button>
                    </div>

                    <!-- Sort -->
                    <select id="feed-sort" class="releaf-input" style="padding: 8px 16px; border-radius: var(--radius-full); font-size: 0.85rem; width: auto; background-color: var(--surface-elevated);">
                        <option value="newest">Νεότερα</option>
                        <option value="portions">Περισσότερες Μερίδες</option>
                        <option value="distance">Πιο Κοντά Μου</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-bottom: var(--space-lg); position: relative;">
                <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: var(--text-tertiary);">🔍</span>
                <input type="text" id="feed-search" placeholder="Αναζήτηση φαγητού, υλικών, κλπ..." class="releaf-input" style="padding-left: 48px; border-radius: var(--radius-full);" />
            </div>
            
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:var(--space-md); border-bottom: 1px solid var(--border); padding-bottom: var(--space-lg);" id="feed-filters">
                <button class="filter-btn active" data-filter="all">Όλα</button>
                <button class="filter-btn" data-filter="no-gluten">Χωρίς Γλουτένη</button>
                <button class="filter-btn" data-filter="no-dairy">Χωρίς Γαλακτοκομικά</button>
                <button class="filter-btn" data-filter="vegan">Vegan 🌱</button>
            </div>

            <!-- Content Area (List vs Map) -->
            <div style="flex: 1; position: relative; display: flex; flex-direction: column; overflow: hidden;">
                <!-- List View -->
                <div id="feed-list" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-lg); padding-right: var(--space-sm); align-content: start;">
                    <!-- Loading Skeletons -->
                    ${Array(6).fill().map(() => `
                        <div class="glass-card" style="padding: var(--space-md); height: 200px; display: flex; flex-direction: column; gap: var(--space-sm);">
                            <div class="skeleton" style="height: 24px; width: 70%;"></div>
                            <div class="skeleton" style="height: 16px; width: 40%;"></div>
                            <div class="skeleton" style="height: 60px; width: 100%; margin-top: auto;"></div>
                        </div>
                    `).join('')}
                </div>

                <!-- Map View -->
                <div id="feed-map-container" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border);">
                    <div id="feed-map" style="width: 100%; height: 100%; z-index: 1;"></div>
                </div>
            </div>
        </div>
    `;

    let allPosts = [];
    let currentFilter = 'all';
    let searchQuery = '';
    let currentSort = 'newest';
    let currentMode = 'list'; // 'list' or 'map'
    let map = null;
    let mapMarkers = [];
    let userLocation = null;

    const listContainer = container.querySelector('#feed-list');
    const mapContainer = container.querySelector('#feed-map-container');
    const searchInput = container.querySelector('#feed-search');
    const filterBtns = container.querySelectorAll('.filter-btn');
    const viewListBtn = container.querySelector('#view-list-btn');
    const viewMapBtn = container.querySelector('#view-map-btn');
    const sortSelect = container.querySelector('#feed-sort');

    // --- Mode Toggle ---
    viewListBtn.onclick = () => {
        currentMode = 'list';
        viewListBtn.style.background = 'var(--accent)'; viewListBtn.style.color = 'white';
        viewMapBtn.style.background = 'transparent'; viewMapBtn.style.color = 'var(--text-secondary)';
        listContainer.style.display = 'grid';
        mapContainer.style.display = 'none';
    };

    viewMapBtn.onclick = () => {
        currentMode = 'map';
        viewMapBtn.style.background = 'var(--accent)'; viewMapBtn.style.color = 'white';
        viewListBtn.style.background = 'transparent'; viewListBtn.style.color = 'var(--text-secondary)';
        listContainer.style.display = 'none';
        mapContainer.style.display = 'block';
        
        if (!map) {
            initMap();
        } else {
            map.invalidateSize();
        }
        renderPosts();
    };

    // --- Filters & Sort ---
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderPosts();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderPosts();
        });
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (currentSort === 'distance') {
            if (!navigator.geolocation) {
                showToast('Η τοποθεσία δεν υποστηρίζεται.', 'error');
                sortSelect.value = 'newest';
                currentSort = 'newest';
                return;
            }
            showToast('Εντοπισμός τοποθεσίας...', 'info');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    renderPosts();
                },
                (err) => {
                    showToast('Αποτυχία εντοπισμού.', 'error');
                    sortSelect.value = 'newest';
                    currentSort = 'newest';
                    renderPosts();
                }
            );
        } else {
            renderPosts();
        }
    });

    // --- Distance Helper (Haversine) ---
    function getDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // --- Map Init ---
    function initMap() {
        setTimeout(() => {
            map = L.map(container.querySelector('#feed-map')).setView([38.287, 21.788], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OS' }).addTo(map);
            renderPosts(); // Draw markers
        }, 100);
    }

    // --- Render Logic ---
    function renderPosts() {
        listContainer.innerHTML = '';
        
        // Clear old map markers
        mapMarkers.forEach(m => {
            if (map) map.removeLayer(m);
        });
        mapMarkers = [];

        if (allPosts.length === 0) {
            listContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Δεν βρέθηκαν διαθέσιμες μερίδες.</div>';
            return;
        }

        let filtered = allPosts.filter(p => {
            if (p.cook_id === state.loggedInUser.id) return false;
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery) && !(p.allergens && p.allergens.toLowerCase().includes(searchQuery))) return false;
            
            const algText = (p.allergens || '').toLowerCase();
            if (currentFilter === 'no-gluten' && algText.includes('γλουτένη')) return false;
            if (currentFilter === 'no-dairy' && (algText.includes('γάλα') || algText.includes('τυρί') || algText.includes('λακτόζη'))) return false;
            if (currentFilter === 'vegan' && (algText.includes('κρέας') || algText.includes('κοτόπουλο') || algText.includes('ψάρι') || algText.includes('τυρί') || algText.includes('γάλα') || algText.includes('αυγό'))) return false;

            return true;
        });

        // Sorting
        if (currentSort === 'portions') {
            filtered.sort((a, b) => b.available_portions - a.available_portions);
        } else if (currentSort === 'distance' && userLocation) {
            filtered.forEach(p => {
                p._dist = getDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
            });
            filtered.sort((a, b) => a._dist - b._dist);
        } else {
            // newest
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Κανένα αποτέλεσμα για αυτά τα φίλτρα.</div>';
            return;
        }

        const bounds = []; // For map

        filtered.forEach((p, idx) => {
            // --- List Card ---
            const card = document.createElement('div');
            card.className = 'glass-card stagger';
            card.style.animationDelay = `${idx * 0.05}s`;
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.padding = 'var(--space-md)';
            card.style.position = 'relative';
            card.style.overflow = 'hidden';

            const remainingRatio = p.available_portions / p.total_portions;
            const isLow = remainingRatio <= 0.33 && p.available_portions > 0;
            
            // Photo or emoji avatar
            const emojis = ['🍝', '🍲', '🥗', '🥘', '🥙', '🍛', '🍱', '🥪', '🍕', '🥣'];
            const emoji = emojis[p.title.length % emojis.length];
            const hasPhoto = p.photo_url && p.photo_url.startsWith('/uploads/');

            const allergensArr = p.allergens ? p.allergens.split(',').map(a => a.trim()).filter(a => a) : [];
            const distText = p._dist !== undefined && p._dist !== Infinity ? `(${p._dist.toFixed(1)} km)` : '';

            card.innerHTML = `
                ${isLow ? '<div style="position:absolute; top:0; left:0; width:100%; height:3px; background:var(--danger);"></div>' : ''}
                ${hasPhoto ? `<div style="margin: calc(-1 * var(--space-md)); margin-bottom: var(--space-md); height: 180px; overflow: hidden; border-radius: var(--radius-md) var(--radius-md) 0 0;"><img src="${p.photo_url}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
                <div style="display: flex; align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-md);">
                    ${!hasPhoto ? `<div style="flex-shrink: 0; width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(99, 102, 241, 0.2)); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border);">
                        ${emoji}
                    </div>` : ''}
                    <div style="flex: 1; min-width: 0;">
                        <h3 class="font-heading" style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${sanitize(p.title)}
                        </h3>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-tertiary);">
                            από <strong>${sanitize(p.cook_name || 'Μάγειρα')}</strong>
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 4px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-weight: 700; color: var(--accent); font-size: 0.85rem;">
                            ${p.available_portions} μερ.
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: var(--space-md); flex: 1;">
                    <div style="display: flex; gap: 8px; align-items: center; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px;">
                        <span>📍</span> ${sanitize(p.pickup_location)} ${distText}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;">
                        <span>🕒</span> ${sanitize(p.pickup_time)}
                    </div>
                    
                    ${allergensArr.length > 0 ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                            ${allergensArr.map(a => `<span style="font-size: 0.7rem; padding: 2px 8px; border-radius: var(--radius-sm); background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);">${sanitize(a)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <button class="releaf-button request-btn" style="width: 100%; justify-content: center; padding: 10px; font-size: 0.9rem;" ${p.available_portions <= 0 ? 'disabled' : ''}>
                    ${p.available_portions > 0 ? 'Ζήτησε Μερίδα' : 'Εξαντλήθηκε'}
                </button>
            `;

            card.querySelector('.request-btn').onclick = () => requestPortion(p.id, card.querySelector('.request-btn'));
            listContainer.appendChild(card);

            // --- Map Marker ---
            if (map && p.latitude && p.longitude) {
                const marker = L.marker([p.latitude, p.longitude]).addTo(map);
                marker.bindPopup(`
                    <div style="font-family: var(--font-sans);">
                        <strong style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--accent);">${sanitize(p.title)}</strong><br>
                        από ${sanitize(p.cook_name)}<br>
                        Μερίδες: ${p.available_portions}<br>
                        Ώρα: ${sanitize(p.pickup_time)}<br>
                        <button class="releaf-button" style="margin-top: 8px; padding: 4px 8px; font-size: 0.8rem; width: 100%;" onclick="document.dispatchEvent(new CustomEvent('map-request', {detail: ${p.id}}))">Ζήτησε Μερίδα</button>
                    </div>
                `);
                mapMarkers.push(marker);
                bounds.push([p.latitude, p.longitude]);
            }
        });

        // Fit map bounds if there are points and we are in map mode
        if (map && bounds.length > 0 && currentMode === 'map') {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
    }

    // Handle button clicks from inside Leaflet popups
    document.addEventListener('map-request', (e) => {
        // We can't easily pass the specific button element from the string HTML, so we pass null or query it
        requestPortion(e.detail, null);
    });

    async function requestPortion(postId, btnEl) {
        if (state.loggedInUser.credits < 1) {
            showToast('Δεν έχεις αρκετά credits. Ανέβασε μια δική σου αγγελία!', 'error');
            return;
        }

        if (btnEl) {
            btnEl.textContent = 'Αποστολή...';
            btnEl.disabled = true;
        }

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, consumer_id: state.loggedInUser.id })
            });

            if (res.ok) {
                showToast('Το αίτημά σου στάλθηκε! Περίμενε έγκριση.', 'success');
                // Decrement credit locally for UI speed
                state.loggedInUser.credits -= 1;
                // Update topbar credits immediately
                renderFeed(navigate, state); // naive refresh
            } else {
                const data = await res.json();
                showToast(data.detail, 'error');
                if (btnEl) {
                    btnEl.textContent = 'Ζήτησε Μερίδα';
                    btnEl.disabled = false;
                }
            }
        } catch (e) {
            showToast('Σφάλμα σύνδεσης', 'error');
            if (btnEl) {
                btnEl.textContent = 'Ζήτησε Μερίδα';
                btnEl.disabled = false;
            }
        }
    }

    function fetchData() {
        fetch('/api/posts')
            .then(res => res.json())
            .then(data => {
                allPosts = data.filter(p => p.status === 'active' && p.available_portions > 0);
                renderPosts();
            })
            .catch(e => {
                console.error(e);
                listContainer.innerHTML = '<p class="text-danger">Σφάλμα φόρτωσης δεδομένων.</p>';
            });
    }

    // Initial fetch
    setTimeout(fetchData, 400);

    return container;
}
