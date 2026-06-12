import { showToast, sanitize } from '../app.js';

export function renderCreatePost(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column;";

    if (!state.loggedInUser.phone || !state.loggedInUser.address) {
        container.innerHTML = `
            <div class="glass-panel" style="padding: var(--space-2xl); text-align: center;">
                <div style="font-size: 4rem; margin-bottom: var(--space-md);">⚠️</div>
                <h2 class="font-heading" style="color: var(--danger); font-size: 1.8rem; margin-bottom: var(--space-md);">Απαιτούνται Στοιχεία</h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-xl); line-height: 1.6; font-size: 1.05rem;">
                    Για να μπορέσεις να δημιουργήσεις μια νέα αγγελία και να δώσεις φαγητό, είναι απαραίτητο να συμπληρώσεις πρώτα 
                    το <strong>Τηλέφωνο Επικοινωνίας</strong> και τη <strong>Διεύθυνση / Σχολή</strong> στο προφίλ σου.
                </p>
                <button id="go-profile-btn" class="releaf-button" style="padding: 14px 32px;">Ενημέρωση Προφίλ →</button>
            </div>
        `;
        container.querySelector('#go-profile-btn').onclick = () => navigate('profile');
        return container;
    }

    container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-xl);">
            <div style="text-align: center; margin-bottom: var(--space-xl);">
                <div style="font-size: 3rem; margin-bottom: var(--space-xs);">👨‍🍳</div>
                <h2 class="font-heading" style="color: var(--text-primary); font-size: 2rem; font-weight: 800; margin: 0;">Μοιράσου Φαγητό</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 6px;">Συμπλήρωσε τις λεπτομέρειες της μερίδας σου</p>
            </div>

            <form id="create-post-form" style="display: flex; flex-direction: column; gap: var(--space-lg);" novalidate>
                
                <!-- Title -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Τι μαγείρεψες;</label>
                    <input type="text" id="cp-title" class="releaf-input" placeholder="π.χ. Παστίτσιο της μαμάς" required style="font-size: 1.1rem; padding: 14px;" />
                </div>

                <!-- Portions & Time Row -->
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-md);">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Μερίδες</label>
                        <input type="number" id="cp-portions" class="releaf-input" placeholder="Αριθμός" min="1" required />
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Ώρα Παραλαβής (Από - Έως)</label>
                        <div style="display: flex; gap: var(--space-sm); align-items: center;">
                            <input type="time" id="cp-time-from" class="releaf-input" required />
                            <span style="color: var(--text-tertiary);">-</span>
                            <input type="time" id="cp-time-to" class="releaf-input" required />
                        </div>
                    </div>
                </div>
                
                <!-- Details Row -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Περιγραφή & Σημειώσεις (Προαιρετικό)</label>
                    <textarea id="cp-notes" class="releaf-input" placeholder="Μυστικά συνταγής, οδηγίες παραλαβής κλπ..." style="height: 100px; resize: vertical;"></textarea>
                </div>

                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-xs); font-weight: 500;">Αλλεργιογόνα (Προαιρετικό)</label>
                    <input type="text" id="cp-allergens" class="releaf-input" placeholder="π.χ. Γάλα, Αυγά, Ξηροί Καρποί (χωρισμένα με κόμμα)" />
                </div>
                
                <!-- Location Section -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: var(--space-md); border-radius: var(--radius-md);">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-md); font-weight: 600;">Σημείο Παραλαβής</label>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-sm);">
                        <p style="color: var(--text-tertiary); font-size: 0.8rem; margin: 0; flex: 1;">Επιλέξτε σημείο στον χάρτη ή πατήστε:</p>
                        <button type="button" id="cp-geolocate-btn" class="releaf-button indigo" style="padding: 6px 14px; font-size: 0.8rem; margin: 0;">📍 Εντόπισέ με</button>
                    </div>
                    
                    <div id="cp-map" style="height: 200px; border-radius: var(--radius-sm); margin-bottom: var(--space-md); border: 1px solid rgba(255,255,255,0.1); z-index: 1;"></div>
                    
                    <input type="text" id="cp-location" class="releaf-input" placeholder="Ακριβής Διεύθυνση / Σημείο (π.χ. Εστία κτίριο Β)" required />
                    
                    <div style="display: none; gap: 10px; margin-top: 10px;">
                        <input type="number" id="cp-lat" class="releaf-input" placeholder="Lat" step="any" />
                        <input type="number" id="cp-lng" class="releaf-input" placeholder="Lng" step="any" />
                    </div>
                </div>

                <!-- Submit Area -->
                <div style="display: flex; gap: var(--space-md); margin-top: var(--space-sm);">
                    <button type="button" id="cp-cancel" class="releaf-button secondary" style="flex: 1; justify-content: center; padding: 14px;">Ακύρωση</button>
                    <button type="submit" id="cp-submit-btn" class="releaf-button" style="flex: 2; justify-content: center; padding: 14px; font-size: 1rem;">Δημοσίευση Αγγελίας</button>
                </div>
                <div id="cp-msg" style="color: var(--danger); font-size: 0.9rem; text-align: center; min-height: 20px;"></div>
            </form>
        </div>
    `;

    // Map Initialization
    setTimeout(() => {
        const mapEl = container.querySelector('#cp-map');
        if (mapEl) {
            const map = L.map(mapEl).setView([38.287, 21.788], 14); // UPATRAS Coordinates
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
                attribution: '© OpenStreetMap' 
            }).addTo(map);
            
            let marker = null;
            
            // Fix map rendering issue in hidden containers
            setTimeout(() => map.invalidateSize(), 100);

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

            // Geolocation button handler
            const geoBtn = container.querySelector('#cp-geolocate-btn');
            if (geoBtn) {
                geoBtn.onclick = () => {
                    if (!navigator.geolocation) {
                        showToast('Ο browser σας δεν υποστηρίζει geolocation.', 'error');
                        return;
                    }
                    const originalText = geoBtn.textContent;
                    geoBtn.textContent = '⏳ ...';
                    geoBtn.disabled = true;
                    
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            
                            container.querySelector('#cp-lat').value = lat.toFixed(6);
                            container.querySelector('#cp-lng').value = lng.toFixed(6);

                            map.setView([lat, lng], 16);
                            if (marker) map.removeLayer(marker);
                            marker = L.marker([lat, lng]).addTo(map);

                            try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                                const data = await res.json();
                                if (data && data.display_name) {
                                    container.querySelector('#cp-location').value = data.display_name.split(',').slice(0, 2).join(',');
                                }
                            } catch(err) { /* ignore */ }

                            geoBtn.textContent = '✅ Εντοπίστηκε';
                            setTimeout(() => { geoBtn.textContent = originalText; geoBtn.disabled = false; }, 3000);
                        },
                        (err) => {
                            geoBtn.textContent = originalText;
                            geoBtn.disabled = false;
                            showToast('Δεν ήταν δυνατός ο εντοπισμός τοποθεσίας.', 'error');
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                };
            }
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
        const submitBtn = container.querySelector('#cp-submit-btn');

        if (!title || !portions || !timeFrom || !timeTo || !loc) {
            msgDiv.textContent = 'Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.';
            return;
        }

        const payload = {
            cook_id: state.loggedInUser.id,
            title: title,
            notes: container.querySelector('#cp-notes').value.trim(),
            allergens: container.querySelector('#cp-allergens').value.trim(),
            pickup_location: loc,
            latitude: container.querySelector('#cp-lat').value || null,
            longitude: container.querySelector('#cp-lng').value || null,
            pickup_time: `${timeFrom} - ${timeTo}`,
            total_portions: parseInt(portions)
        };

        submitBtn.textContent = 'Δημοσίευση...';
        submitBtn.disabled = true;
        msgDiv.textContent = '';

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast('Η αγγελία δημοσιεύτηκε επιτυχώς!', 'success');
                navigate('dashboard');
            } else {
                const data = await res.json();
                msgDiv.textContent = sanitize(data.detail || 'Σφάλμα');
                submitBtn.textContent = 'Δημοσίευση Αγγελίας';
                submitBtn.disabled = false;
            }
        } catch (e) {
            msgDiv.textContent = 'Σφάλμα σύνδεσης';
            submitBtn.textContent = 'Δημοσίευση Αγγελίας';
            submitBtn.disabled = false;
        }
    };

    return container;
}
