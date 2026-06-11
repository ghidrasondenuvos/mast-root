export function renderCreatePost(navigate, state) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.cssText = "width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 30px; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 25px; text-align: center;">Νέα Αγγελία Φαγητού</h2>
        <form id="create-post-form" style="display: flex; flex-direction: column; gap: 15px;">
            <input type="text" id="cp-title" class="releaf-input" placeholder="Τι μαγείρεψες; (π.χ. Παστίτσιο)" required />
            <input type="number" id="cp-portions" class="releaf-input" placeholder="Αριθμός Μερίδων (π.χ. 3)" min="1" required />
            
            <textarea id="cp-notes" class="releaf-input" placeholder="Λίγα λόγια ή σημειώσεις..." style="height: 80px; resize: none;"></textarea>
            <input type="text" id="cp-allergens" class="releaf-input" placeholder="Γνωστά Αλλεργιογόνα (π.χ. Γάλα, Αυγά) ή αφήστε κενό" />
            
            <input type="text" id="cp-location" class="releaf-input" placeholder="Σημείο Παραλαβής (π.χ. Εστία κτίριο Β, δωμάτιο 12)" required />
            <input type="text" id="cp-time" class="releaf-input" placeholder="Ώρες παραλαβής (π.χ. 14:00 - 16:00)" required />
            
            <p style="color: #ccc; font-size: 0.8rem; margin: 0;">Για τον χάρτη (Προαιρετικό):</p>
            <div style="display: flex; gap: 10px;">
                <input type="number" id="cp-lat" class="releaf-input" placeholder="Γεωγραφικό Πλάτος (Latitude)" step="any" style="flex: 1;" />
                <input type="number" id="cp-lng" class="releaf-input" placeholder="Γεωγραφικό Μήκος (Longitude)" step="any" style="flex: 1;" />
            </div>

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button type="submit" class="releaf-button" style="flex: 1;">Δημοσίευση</button>
                <button type="button" id="cp-cancel" class="releaf-button" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.2);">Ακύρωση</button>
            </div>
            <div id="cp-msg" style="color: #ff4d4d; font-size: 0.9rem; text-align: center;"></div>
        </form>
    `;

    container.querySelector('#cp-cancel').onclick = () => navigate('feed');

    container.querySelector('#create-post-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            cook_id: state.loggedInUser.id,
            title: container.querySelector('#cp-title').value,
            total_portions: parseInt(container.querySelector('#cp-portions').value),
            notes: container.querySelector('#cp-notes').value,
            allergens: container.querySelector('#cp-allergens').value,
            pickup_location: container.querySelector('#cp-location').value,
            pickup_time: container.querySelector('#cp-time').value,
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
                alert('Η αγγελία δημιουργήθηκε επιτυχώς!');
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
