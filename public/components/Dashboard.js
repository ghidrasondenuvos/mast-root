export function renderDashboard(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 1000px; margin: 0 auto; padding: 20px;";

    const user = state.loggedInUser;
    
    let roleText = "Εθελοντής";
    let roleIcon = "🌱";
    if (user.account_type === 'organization') {
        roleText = "Οργανισμός";
        roleIcon = "🏛️";
    } else if (user.account_type === 'sponsor') {
        roleText = "Χορηγός";
        roleIcon = "🤝";
    }

    // Header section
    let html = `
        <div class="glass-panel" style="padding: 30px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
            <div>
                <h1 style="font-family: var(--font-heading); color: var(--accent-color); font-size: 2.2rem; margin: 0 0 10px 0;">
                    Καλώς ήρθες, ${user.full_name || user.username}!
                </h1>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">${roleIcon}</span>
                    <span style="color: var(--text-secondary); font-family: var(--font-mono); font-size: 1rem;">${roleText}</span>
                </div>
            </div>
            <button id="btn-edit-profile" class="releaf-button secondary" style="padding: 10px 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                <span>⚙️</span> Προφίλ
            </button>
        </div>
        
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">Γρήγορες Ενέργειες</h2>
        <div id="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; margin-bottom: 40px;">
        </div>
    `;

    container.innerHTML = html;
    const grid = container.querySelector('#dashboard-grid');

    // Helper για δημιουργία Widget Καρτών
    function createWidget(title, description, icon, actionText, onClick) {
        const widget = document.createElement('div');
        widget.className = 'glass-card';
        widget.style.cssText = "padding: 30px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;";
        widget.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;">${icon}</div>
            <h3 style="font-family: var(--font-heading); color: var(--text-primary); margin: 0 0 10px 0; font-size: 1.4rem;">${title}</h3>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; flex-grow: 1; margin: 0 0 25px 0;">${description}</p>
            <button class="releaf-button" style="width: 100%; padding: 12px; font-size: 0.95rem;">${actionText}</button>
        `;
        widget.querySelector('button').addEventListener('click', onClick);
        return widget;
    }

    // Κουμπιά (Widgets) ανάλογα με τον ρόλο
    if (user.account_type === 'volunteer') {
        grid.appendChild(createWidget('Αναζήτηση Δράσεων', 'Βρες δενδροφυτεύσεις και δράσεις καθαρισμού στην περιοχή σου και δήλωσε συμμετοχή.', '🔍', 'Εύρεση Δράσεων', () => navigate('search')));
        grid.appendChild(createWidget('Τα Πιστοποιητικά μου', 'Προβολή και λήψη των PDF πιστοποιητικών σου από παλαιότερες δράσεις.', '🏆', 'Προβολή', () => navigate('certificates')));
        grid.appendChild(createWidget('Οι Δεξιότητές μου', 'Ενημέρωσε το προφίλ σου με τον εξοπλισμό και τις γνώσεις σου.', '🛠️', 'Ενημέρωση', () => alert('Σε κατασκευή!')));
    } 
    else if (user.account_type === 'organization') {
        grid.appendChild(createWidget('Δημιουργία Δράσης', 'Διοργάνωσε μια νέα περιβαλλοντική δράση και κάλεσε εθελοντές να βοηθήσουν.', '🌱', 'Νέα Δράση', () => navigate('create_action')));
        grid.appendChild(createWidget('Αιτήσεις Εθελοντών', 'Διαχειρίσου τις αιτήσεις συμμετοχής και οργάνωσε την ομάδα σου.', '👥', 'Διαχείριση', () => navigate('manage_requests')));
        grid.appendChild(createWidget('Ανάλυση Αναγκών', 'Δες προτάσεις για περιοχές που έχουν άμεση ανάγκη αναδάσωσης (Χάρτης).', '🌍', 'Προβολή Χάρτη', () => alert('Σε κατασκευή!')));
        grid.appendChild(createWidget('Νέα Καμπάνια', 'Δημιούργησε μια καμπάνια και ζήτα πόρους ή εξοπλισμό από χορηγούς.', '💰', 'Δημιουργία', () => navigate('create_campaign')));
    }
    else if (user.account_type === 'sponsor') {
        grid.appendChild(createWidget('Αναζήτηση Καμπανιών', 'Βρες περιβαλλοντικούς οργανισμούς που χρειάζονται χορηγία ή εξοπλισμό.', '🤝', 'Προβολή', () => navigate('campaigns')));
        grid.appendChild(createWidget('Ιστορικό Δωρεών', 'Δες τις καμπάνιες που έχεις υποστηρίξει.', '📊', 'Ιστορικό', () => alert('Σε κατασκευή!')));
    }

    container.querySelector('#btn-edit-profile').addEventListener('click', () => {
        alert('Επεξεργασία προφίλ σε κατασκευή!');
    });

    return container;
}