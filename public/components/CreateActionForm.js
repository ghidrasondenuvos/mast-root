// Αρχείο: public/components/CreateActionForm.js

export function renderCreateActionForm(currentUser, onBack) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.90); padding: 40px; border-radius: 15px; width: 100%; max-width: 500px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;";

    // 1. Εσωτερικό State
    let formState = {
        title: '',
        description: '',
        max_participants: 10,
        location_name: '',
        action_type_name: ''
    };
    let step = 1;
    let result = { status: '', message: '' };
    
    // Μεταβλητές για τον χάρτη
    let mapInstance = null;
    let mapMarker = null;

    // 2. Η συνάρτηση Render
    function render() {
        let html = '';

        if (step === 1) {
            const labelStyle = "font-size: 0.75rem; color: var(--accent-color); margin-left: 15px; margin-bottom: 3px; font-family: var(--font-mono); display: block; text-align: left;";
            
            html += `
                <h2 style="font-family: var(--font-heading); color: var(--accent-color); font-size: 2rem; margin: 0 0 20px 0;">Δημιουργία Δράσης</h2>
                <form id="action-form" style="display: flex; flex-direction: column; gap: 15px;">
                    
                    <div>
                        <span style="${labelStyle}">ΤΙΤΛΟΣ</span>
                        <input class="releaf-input" id="act-title" placeholder="π.χ. Αναδάσωση στο βουνό" style="width: 100%; box-sizing: border-box; margin: 0;" value="${formState.title}" />
                    </div>
                    
                    <div>
                        <span style="${labelStyle}">ΠΕΡΙΓΡΑΦΗ</span>
                        <textarea class="releaf-input" id="act-desc" placeholder="Γράψε λίγα λόγια για τη δράση..." rows="2" style="resize: none; padding: 12px; width: 100%; box-sizing: border-box; margin: 0;">${formState.description}</textarea>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <span style="${labelStyle}">ΟΡΙΟ ΕΘΕΛΟΝΤΩΝ</span>
                            <input class="releaf-input" type="number" id="act-max" style="width: 100%; box-sizing: border-box; margin: 0;" value="${formState.max_participants}" />
                        </div>
                        <div style="flex: 2;">
                            <span style="${labelStyle}">ΤΥΠΟΣ ΔΡΑΣΗΣ</span>
                            <select class="releaf-input" id="act-type" style="width: 100%; box-sizing: border-box; margin: 0; -webkit-appearance: none; -moz-appearance: none; appearance: none; cursor: pointer;">
                                <option value="" disabled ${!formState.action_type_name ? 'selected' : ''}>Επιλέξτε Κατηγορία...</option>
                                <option value="Δενδροφύτευση" ${formState.action_type_name === 'Δενδροφύτευση' ? 'selected' : ''}> Δενδροφύτευση</option>
                                <option value="Καθαρισμός Παραλίας" ${formState.action_type_name === 'Καθαρισμός Παραλίας' ? 'selected' : ''}>️ Καθαρισμός Παραλίας</option>
                                <option value="Καθαρισμός Δάσους" ${formState.action_type_name === 'Καθαρισμός Δάσους' ? 'selected' : ''}> Καθαρισμός Δάσους</option>
                                <option value="Ανακύκλωση / Κυκλική Οικονομία" ${formState.action_type_name === 'Ανακύκλωση / Κυκλική Οικονομία' ? 'selected' : ''}>️ Ανακύκλωση / Κυκλική Οικονομία</option>
                                <option value="Προστασία Πανίδας" ${formState.action_type_name === 'Προστασία Πανίδας' ? 'selected' : ''}> Προστασία Πανίδας</option>
                                <option value="Πυροπροστασία / Δασοπροστασία" ${formState.action_type_name === 'Πυροπροστασία / Δασοπροστασία' ? 'selected' : ''}> Πυροπροστασία / Δασοπροστασία</option>
                                <option value="Διάσωση & Περίθαλψη Ζώων" ${formState.action_type_name === 'Διάσωση & Περίθαλψη Ζώων' ? 'selected' : ''}> Διάσωση & Περίθαλψη Ζώων</option>
                                <option value="Περιβαλλοντική Εκπαίδευση" ${formState.action_type_name === 'Περιβαλλοντική Εκπαίδευση' ? 'selected' : ''}> Περιβαλλοντική Εκπαίδευση</option>
                                <option value="Φροντίδα Αστικού Πρασίνου" ${formState.action_type_name === 'Φροντίδα Αστικού Πρασίνου' ? 'selected' : ''}>️ Φροντίδα Αστικού Πρασίνου</option>
                                <option value="Αποκατάσταση Τοπίου" ${formState.action_type_name === 'Αποκατάσταση Τοπίου' ? 'selected' : ''}>️ Αποκατάσταση Τοπίου</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <span style="${labelStyle}">ΤΟΠΟΘΕΣΙΑ (Κάνε κλικ στον χάρτη)</span>
                        <input class="releaf-input" id="act-loc" placeholder="Πληκτρολόγησε ή επίλεξε από κάτω" style="width: 100%; box-sizing: border-box; margin: 0;" value="${formState.location_name}" />
                    </div>
                    
                    <div style="height: 220px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); margin-top: -5px;">
                        <div id="map-view" style="height: 100%; width: 100%; z-index: 1;"></div>
                    </div>

                    <div id="error-msg" style="color: #ff4d4d; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 5px; min-height: 20px;"></div>

                    <button class="releaf-button" type="submit" style="margin-top: 10px;">Υποβολή Δράσης</button>
                    <button class="releaf-button" type="button" id="btn-cancel" style="background: transparent; border: 1px solid white;">Ακύρωση</button>
                </form>
            `;
        } 
        else if (step === 2) {
            html += `
                <div style="padding: 20px 0;">
                    <h2 style="font-family: var(--font-heading); color: ${result.status === 'success' ? '#8db600' : '#ff4d4d'}; font-size: 2rem; margin: 0 0 15px 0;">
                        ${result.status === 'success' ? 'Επιτυχία!' : 'Σφάλμα!'}
                    </h2>
                    <p style="font-family: var(--font-mono); color: #fff; line-height: 1.6; margin-bottom: 30px;">
                        ${result.message}
                    </p>
                    <button id="btn-finish" class="releaf-button">
                        ${result.status === 'success' ? 'Επιστροφή στο Dashboard' : 'Δοκιμάστε Ξανά'}
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;

        // 3. Events και ενεργοποίηση Leaflet
        if (step === 1) {
            const titleInput = container.querySelector('#act-title');
            const descInput = container.querySelector('#act-desc');
            const maxInput = container.querySelector('#act-max');
            const typeInput = container.querySelector('#act-type');
            const locInput = container.querySelector('#act-loc');
            const errorDiv = container.querySelector('#error-msg');

            titleInput.addEventListener('input', e => formState.title = e.target.value);
            descInput.addEventListener('input', e => formState.description = e.target.value);
            maxInput.addEventListener('input', e => formState.max_participants = parseInt(e.target.value) || 0);
            typeInput.addEventListener('change', e => formState.action_type_name = e.target.value);
            locInput.addEventListener('input', e => formState.location_name = e.target.value);

            container.querySelector('#btn-cancel').addEventListener('click', onBack);

            container.querySelector('#action-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!formState.title || !formState.description || !formState.location_name || !formState.action_type_name) {
                    errorDiv.textContent = 'Παρακαλώ συμπληρώστε όλα τα πεδία της δράσης.';
                    return;
                }

                try {
                    const res = await fetch('/actions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...formState, creator_user_id: currentUser.id })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        result = { status: 'success', message: data.message };
                    } else {
                        result = { status: 'error', message: data.detail || 'Αποτυχία δημιουργίας δράσης.' };
                    }
                } catch (err) {
                    result = { status: 'error', message: 'Αδυναμία σύνδεσης με τον διακομιστή.' };
                }
                step = 2; render();
            });

            // Ενεργοποίηση Χάρτη με μικρή καθυστέρηση (για να προλάβει να μπει το DOM element)
            setTimeout(() => {
                const mapEl = container.querySelector('#map-view');
                if (mapEl && typeof L !== 'undefined') {
                    // Αν υπάρχει ήδη χάρτης, τον καθαρίζουμε
                    if (mapInstance) { mapInstance.remove(); }
                    
                    mapInstance = L.map(mapEl).setView([38.246242, 21.735084], 6);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(mapInstance);

                    const markerIcon = new L.Icon({
                        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41]
                    });

                    // Event Click στον Χάρτη (Reverse Geocoding)
                    mapInstance.on('click', async (e) => {
                        const lat = e.latlng.lat;
                        const lng = e.latlng.lng;
                        
                        if (mapMarker) mapInstance.removeLayer(mapMarker);
                        mapMarker = L.marker([lat, lng], {icon: markerIcon}).addTo(mapInstance);

                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=el`);
                            const data = await response.json();
                            if (data && data.display_name) {
                                locInput.value = data.display_name;
                                formState.location_name = data.display_name;
                            }
                        } catch (error) {
                            console.error("Σφάλμα κατά την ανάκτηση διεύθυνσης:", error);
                        }
                    });
                }
            }, 100);

        } 
        else if (step === 2) {
            container.querySelector('#btn-finish').addEventListener('click', () => {
                if (result.status === 'success') {
                    onBack();
                } else {
                    step = 1; render();
                }
            });
        }
    }

    render();
    return container;
}