export function renderCreateActionForm(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 40px; border-radius: 15px; width: 100%; max-width: 500px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;";

    let formState = { title: '', description: '', max_participants: 10, location_name: '', action_type_name: '' };
    let mapMarker = null;

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: var(--accent-color); font-size: 2rem; margin: 0 0 20px 0;">Δημιουργία Δράσης</h2>
        <form id="action-form" style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
            <div>
                <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΤΙΤΛΟΣ</span>
                <input class="releaf-input" id="act-title" placeholder="π.χ. Αναδάσωση στο βουνό" required />
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΠΕΡΙΓΡΑΦΗ</span>
                <textarea class="releaf-input" id="act-desc" rows="2" placeholder="Γράψε λίγα λόγια..." required></textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΟΡΙΟ ΕΘΕΛΟΝΤΩΝ</span>
                    <input type="number" class="releaf-input" id="act-max" value="10" required />
                </div>
                <div style="flex: 2;">
                    <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΤΥΠΟΣ ΔΡΑΣΗΣ</span>
                    <select class="releaf-input" id="act-type" required>
                        <option value="" disabled selected>Επιλέξτε Κατηγορία...</option>
                        <option value="Δενδροφύτευση">🌳 Δενδροφύτευση</option>
                        <option value="Καθαρισμός Παραλίας">🏖️ Καθαρισμός Παραλίας</option>
                        <option value="Ανακύκλωση / Κυκλική Οικονομία">♻️ Ανακύκλωση / Κυκλική Οικονομία</option>
                        <option value="Προστασία Πανίδας">🦊 Προστασία Πανίδας</option>
                    </select>
                </div>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--accent-color); font-family: var(--font-mono);">ΤΟΠΟΘΕΣΙΑ (Κάνε κλικ στον χάρτη)</span>
                <input class="releaf-input" id="act-loc" placeholder="Επίλεξε από τον χάρτη" required readonly />
            </div>
            
            <div id="map-view" style="height: 220px; width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);"></div>

            <button class="releaf-button" type="submit" style="margin-top: 10px;">Υποβολή Δράσης</button>
            <button class="releaf-button" type="button" id="btn-cancel" style="background: transparent; border: 1px solid white;">Ακύρωση</button>
        </form>
    `;

    container.querySelector('#btn-cancel').addEventListener('click', onBack);

    // Αρχικοποίηση Leaflet Χάρτη (με μικρή καθυστέρηση για να προλάβει να μπει στο DOM)
    setTimeout(() => {
        const map = L.map(container.querySelector('#map-view')).setView([38.246242, 21.735084], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        map.on('click', async (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            if (mapMarker) map.removeLayer(mapMarker);
            mapMarker = L.marker([lat, lng]).addTo(map);

            // Reverse Geocoding
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=el`);
                const data = await response.json();
                if (data && data.display_name) {
                    container.querySelector('#act-loc').value = data.display_name;
                }
            } catch (error) {
                console.error("Σφάλμα:", error);
            }
        });
    }, 100);

    // Υποβολή Form
    container.querySelector('#action-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        formState = {
            title: container.querySelector('#act-title').value,
            description: container.querySelector('#act-desc').value,
            max_participants: parseInt(container.querySelector('#act-max').value),
            action_type_name: container.querySelector('#act-type').value,
            location_name: container.querySelector('#act-loc').value,
            creator_user_id: currentUser.id
        };

        try {
            const res = await fetch('/actions', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState)
            });
            const data = await res.json();
            
            if (res.ok) {
                alert("Επιτυχία: " + data.message);
                onBack();
            } else {
                alert("Σφάλμα: " + (data.detail || 'Αποτυχία'));
            }
        } catch (err) {
            alert('Αδυναμία σύνδεσης με τον διακομιστή.');
        }
    });

    return container;
}