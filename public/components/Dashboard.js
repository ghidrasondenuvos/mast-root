export function renderDashboard(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "background: rgba(27, 24, 27, 0.85); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); width: 100%; max-width: 800px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";

    const user = state.loggedInUser;

    let roleText = "Εθελοντής";
    if (user.account_type === 'organisation') roleText = "Οργανισμός";
    if (user.account_type === 'sponsor') roleText = "Χορηγός";

    container.innerHTML = `
        <h2 style="font-family: var(--font-heading); color: var(--accent-color); font-size: 2.2rem; margin-bottom: 5px;">
            Γεια σου, ${user.username}!
        </h2>
        <p style="font-family: var(--font-mono); color: #10b981; margin-top: 0; margin-bottom: 30px;">
            Λογαριασμός: ${roleText}
        </p>

        <div id="action-buttons" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            </div>
    `;

    const btnContainer = container.querySelector('#action-buttons');

    // Helper για δημιουργία κουμπιών
    function createBtn(text, icon, onClick, color = 'var(--accent-color)') {
        const btn = document.createElement('button');
        btn.className = 'releaf-button';
        btn.style.cssText = `display: flex; flex-direction: column; align-items: center; justify-content: center; height: 120px; font-size: 1.1rem; background: rgba(0,0,0,0.3); border: 1px solid ${color}; color: white;`;
        btn.innerHTML = `<span style="font-size: 2rem; margin-bottom: 10px;">${icon}</span> ${text}`;
        btn.onmouseover = () => btn.style.background = color;
        btn.onmouseout = () => btn.style.background = 'rgba(0,0,0,0.3)';
        btn.onclick = onClick;
        return btn;
    }

    // Κουμπιά ανάλογα με τον ρόλο
    if (user.account_type === 'organisation') {
        btnContainer.appendChild(createBtn('Δημιουργία Δράσης', '🌱', () => navigate('create_action'), '#10b981'));
        btnContainer.appendChild(createBtn('Αιτήσεις Εθελοντών', '👥', () => navigate('manage_requests'), '#4f46e5'));
        btnContainer.appendChild(createBtn('Δημιουργία Καμπάνιας', '💰', () => navigate('create_campaign'), '#a67c52'));
        btnContainer.appendChild(createBtn('Ανάλυση Αναγκών', '🌍', () => alert('Σε κατασκευή...'), '#8db600'));
    }
    else if (user.account_type === 'volunteer') {
        btnContainer.appendChild(createBtn('Αναζήτηση Δράσεων', '🔍', () => navigate('search'), '#10b981'));
        btnContainer.appendChild(createBtn('Τα Πιστοποιητικά μου', '🏆', () => alert('Σε κατασκευή...'), '#f59e0b'));
    }
    else if (user.account_type === 'sponsor') {
        btnContainer.appendChild(createBtn('Αναζήτηση Καμπανιών', '🤝', () => navigate('campaigns'), '#4f46e5'));
    }

    // Κοινά κουμπιά
    btnContainer.appendChild(createBtn('Επεξεργασία Προφίλ', '⚙️', () => alert('Σε κατασκευή...'), '#64748b'));

    return container;
}