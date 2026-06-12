import { showToast } from '../app.js';

export function renderCreatePost(navigate, state) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.cssText = "width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 30px; animation: fadeInUp 0.5s ease-out;";

    if (!state.loggedInUser.phone || !state.loggedInUser.address) {
        container.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 15px;">️</div>
                <h2 style="font-family: var(--font-heading); color: #ff4d4d; margin-bottom: 15px;">Απαιτούνται Στοιχεία</h2>
                <p style="color: #ccc; margin-bottom: 25px; line-height: 1.6;">
                    Για να μπορέσεις να δημιουργήσεις μια νέα αγγελία και να δώσεις φαγητό, είναι απαραίτητο να συμπληρώσεις πρώτα 
                    το <strong>Τηλέφωνο Επικοινωνίας</strong> και τη <strong>Διεύθυνση / Σχολή</strong> στο προφίλ σου.
                </p>
                <button id="go-profile-btn" class="releaf-button">Ενημέρωση Προφίλ</button>
            </div>
        `;
        container.querySelector('#go-profile-btn').onclick = () => navigate('profile');
        return container;
    }

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 25px; text-align: center;">Νέα Αγγελία Φαγητού</h2>
        <form id="create-post-form" style="display: flex; flex-direction: column; gap: 15px;" novalidate>
            <input type="text" id="cp-title" class="releaf-input" placeholder="Τι μαγείρεψες; (π.χ. Παστίτσιο)" />
            <div style="display: flex; gap: 10px;">
                <input type="number" id="cp-portions" class="releaf-input" placeholder="Μερίδες" min="1" style="flex: 1;" />
                <div style="flex: 2; display: flex; gap: 5px; align-items: center;">
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">Από:</span>
                    <input type="time" id="cp-time-from" class="releaf-input" style="padding: 5px;" />
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">Έως:</span>
                    <input type="time" id="cp-time-to" class="releaf-input" style="padding: 5px;" />
                </div>
            </div>
            
            <textarea id="cp-notes" class="releaf-input" placeholder="Λίγα λόγια ή σημειώσεις..." style="height: 80px; resize: none;"></textarea>
            <input type="text" id="cp-allergens" class="releaf-input" placeholder="Αλλεργιογόνα (π.χ. Γάλα, Αυγά) ή αφήστε κενό" />
            
            <input type="text" id="cp-location" class="releaf-input" placeholder="Σημείο Παραλαβής (π.χ. Εστία κτίριο Β, δωμάτιο 12)" />
            
            <div style="display: flex; align-items: center; gap: 10px;">
                <p style="color: #ccc; font-size: 0.8rem; margin: 0; flex: 1;">Επιλέξτε σημείο στον χάρτη ή πατήστε:</p>
                <button type="button" id="cp-geolocate-btn" class="releaf-button" style="padding: 5px 15px; font-size: 0.8rem; margin: 0; background: #4f46e5;">📍 Εντόπισέ με</button>
            </div>
            <div id="cp-map" style="height:180px; border-radius:12px; margin-top:-5px; border:1px solid rgba(255,255,255,0.15);"></div>
            
            <div style="display: flex; gap: 10px; display: none;">
                <input type="number" id="cp-lat" class="releaf-input" placeholder="Lat" step="any" />
                <input type="number" id="cp-lng" class="releaf-input" placeholder="Lng" step="any" />
            </div>

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button type="submit" class="releaf-button" style="flex: 1;">Δημοσίευση</button>
                <button type="button" id="cp-cancel" class="releaf-button secondary" style="flex: 1;">Ακύρωση</button>
            </div>
            <div id="cp-msg" style="color: #ff4d4d; font-size: 0.9rem; text-align: center;"></div>
        </form>
    `;

    setTimeout(() => {
        const mapEl = container.querySelector('#cp-map');
        if (mapEl) {
            const map = L.map(mapEl).setView([38.287, 21.788], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
            let marker = null;
            map.on('click', async (e) => {
                const { lat, lng } = e.latlng;
                container.querySelector('#cp-lat').value = lat.toFixed(6);
                container.querySelector('#cp-lng').value = lng.toFixed(6);
                if (marker) map.removeLayer(marker);
                marker = L.marker([lat, lng]).addTo(map);

                // Reverse Geocoding
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        const shortAddress = data.display_name.split(',').slice(0, 2).join(',');
                        container.querySelector('#cp-location').value = shortAddress;
                    }
                } catch(err) {
                    console.error('Reverse geocoding failed', err);
                }
            });
        }

        // Geolocation button handler
        const geoBtn = container.querySelector('#cp-geolocate-btn');
        if (geoBtn && mapEl) {
            geoBtn.onclick = () => {
                if (!navigator.geolocation) {
                    showToast('Ο browser σας δεν υποστηρίζει geolocation.', 'error');
                    return;
                }
                geoBtn.textContent = '⏳ Εντοπισμός...';
                geoBtn.disabled = true;
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        container.querySelector('#cp-lat').value = lat.toFixed(6);
                        container.querySelector('#cp-lng').value = lng.toFixed(6);

                        // Center map and add marker
                        const map = mapEl._leaflet_map || mapEl;
                        // Find map instance from Leaflet internals
                        const mapInstance = Object.values(mapEl).find(v => v && v._zoom !== undefined);

                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                            const data = await res.json();
                            if (data && data.display_name) {
                                container.querySelector('#cp-location').value = data.display_name.split(',').slice(0, 2).join(',');
                            }
                        } catch(err) { /* ignore */ }

                        geoBtn.textContent = '✅ Εντοπίστηκε!';
                        showToast('Η τοποθεσία σας εντοπίστηκε!', 'success');
                    },
                    (err) => {
                        geoBtn.textContent = '📍 Εντόπισέ με';
                        geoBtn.disabled = false;
                        showToast('Δεν ήταν δυνατός ο εντοπισμός τοποθεσίας.', 'error');
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            };
        }
    }, 100);

    container.querySelector('#cp-cancel').onclick = () => navigate('dashboard');

    container.querySelector('#create-post-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const title = container.querySelector('#cp-title').value.trim();
        const portions = container.querySelector('#cp-portions').value;
        const timeFrom = container.querySelector('#cp-time-from').value;
        const timeTo = container.querySelector('#cp-time-to').value;
        const loc = container.querySelector('#cp-location').value.trim();
        const msgDiv = container.querySelector('#cp-msg');
        
        if (!title || !portions || !timeFrom || !timeTo || !loc) {
            msgDiv.textContent = 'Παρακαλώ συμπληρώστε τα βασικά πεδία (Τίτλος, Μερίδες, Ώρα, Σημείο).';
            return;
        }
        
        if (timeFrom >= timeTo) {
            msgDiv.textContent = 'Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.';
            return;
        }

        const time = `${timeFrom} - ${timeTo}`;
        const payload = {
            cook_id: state.loggedInUser.id,
            title: title,
            total_portions: parseInt(portions),
            notes: container.querySelector('#cp-notes').value,
            allergens: container.querySelector('#cp-allergens').value,
            pickup_location: loc,
            pickup_time: time,
            latitude: container.querySelector('#cp-lat').value ? parseFloat(container.querySelector('#cp-lat').value) : null,
            longitude: container.querySelector('#cp-lng').value ? parseFloat(container.querySelector('#cp-lng').value) : null,
            photo_url: null
        };

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Η αγγελία δημιουργήθηκε επιτυχώς!', 'success');
                navigate('dashboard');
            } else {
                container.querySelector('#cp-msg').textContent = data.detail;
            }
        } catch (error) {
            container.querySelector('#cp-msg').textContent = 'Σφάλμα επικοινωνίας.';
        }
    };

    return container;
}
