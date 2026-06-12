import { showToast, sanitize } from '../app.js';

export function renderFeed(navigate, state) {
    const container = document.createElement('div');
    container.className = 'fade-in-up';
    container.style.cssText = "width: 100%; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; height: 100%;";

    container.innerHTML = `
        <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: var(--space-xl); margin-bottom: var(--space-lg);">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--space-lg);">
                <h2 class="font-heading" style="color: var(--text-primary); font-size: 2rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;">🍽️ Διαθέσιμες Μερίδες</h2>
            </div>
            
            <div style="margin-bottom: var(--space-lg); position: relative;">
                <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: var(--text-tertiary);">🔍</span>
                <input type="text" id="feed-search" placeholder="Αναζήτηση φαγητού, υλικών, κλπ..." class="releaf-input" style="padding-left: 48px; border-radius: var(--radius-full);" />
            </div>
            
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:var(--space-xl); border-bottom: 1px solid var(--border); padding-bottom: var(--space-lg);" id="feed-filters">
                <button class="filter-btn active" data-filter="all">Όλα</button>
                <button class="filter-btn" data-filter="no-gluten">Χωρίς Γλουτένη</button>
                <button class="filter-btn" data-filter="no-dairy">Χωρίς Γαλακτοκομικά</button>
                <button class="filter-btn" data-filter="vegan">Vegan 🌱</button>
            </div>

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
        </div>
    `;

    let allPosts = [];
    let currentFilter = 'all';
    let searchQuery = '';

    const listContainer = container.querySelector('#feed-list');
    const searchInput = container.querySelector('#feed-search');
    const filterBtns = container.querySelectorAll('.filter-btn');

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

    function renderPosts() {
        listContainer.innerHTML = '';
        
        let filtered = allPosts.filter(p => {
            if (p.cook_id === state.loggedInUser.id) return false; // Don't show own posts in feed
            const titleMatch = p.title.toLowerCase().includes(searchQuery) || (p.notes && p.notes.toLowerCase().includes(searchQuery));
            if (!titleMatch) return false;
            
            const alg = (p.allergens || '').toLowerCase();
            if (currentFilter === 'no-gluten' && (alg.includes('γλουτένη') || alg.includes('σιτάρι'))) return false;
            if (currentFilter === 'no-dairy' && (alg.includes('γάλα') || alg.includes('τυρί') || alg.includes('γαλακτοκομικά'))) return false;
            if (currentFilter === 'vegan' && (alg.includes('κρέας') || alg.includes('κοτόπουλο') || alg.includes('ψάρι') || alg.includes('αυγό') || alg.includes('γάλα') || alg.includes('τυρί'))) return false;
            
            return true;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-3xl) 0; opacity: 0.7; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: var(--space-md); filter: grayscale(1);">🍽️</div>
                    <h3 class="font-heading" style="font-size: 1.5rem; margin-bottom: var(--space-sm);">Δεν βρέθηκαν μερίδες</h3>
                    <p style="color: var(--text-tertiary);">Δοκιμάστε να αλλάξετε τα φίλτρα ή την αναζήτηση σας.</p>
                </div>
            `;
            return;
        }

        filtered.forEach((p, idx) => {
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
            
            // Random food emoji based on title string length to keep it consistent
            const emojis = ['🍝', '🍲', '🥗', '🥘', '🥙', '🍛', '🍱', '🥪', '🍕', '🥣'];
            const emoji = emojis[p.title.length % emojis.length];

            const allergensArr = p.allergens ? p.allergens.split(',').map(a => a.trim()).filter(a => a) : [];

            card.innerHTML = `
                ${isLow ? '<div style="position:absolute; top:0; left:0; width:100%; height:3px; background:var(--danger);"></div>' : ''}
                <div style="display: flex; align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-md);">
                    <div style="flex-shrink: 0; width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(99, 102, 241, 0.2)); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border);">
                        ${emoji}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h3 class="font-heading" style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${sanitize(p.title)}
                        </h3>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-tertiary);">
                            από <strong>${sanitize(p.cook_name || 'Μάγειρα')}</strong>
                        </p>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <div class="font-mono" style="font-size: 1.2rem; font-weight: 700; color: ${isLow ? 'var(--danger)' : 'var(--accent)'};">${p.available_portions}</div>
                        <div style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase;">Μερίδες</div>
                    </div>
                </div>
                
                ${p.notes ? `<p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-md); line-height: 1.5; flex-grow: 1;">${sanitize(p.notes)}</p>` : '<div style="flex-grow:1"></div>'}
                
                ${allergensArr.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--space-md);">
                        ${allergensArr.map(a => `<span style="font-size: 0.7rem; padding: 2px 8px; border-radius: var(--radius-sm); background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);">${sanitize(a)}</span>`).join('')}
                    </div>
                ` : '<div style="height:24px; margin-bottom: var(--space-md);"></div>'}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); font-size: 0.8rem; color: var(--text-secondary); background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: var(--radius-sm);">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>📍</span>
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${sanitize(p.pickup_location)}">${sanitize(p.pickup_location)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>🕒</span>
                        <span>${sanitize(p.pickup_time)}</span>
                    </div>
                </div>

                <button class="releaf-button request-btn" style="width: 100%; justify-content: center; ${isLow ? 'background: var(--danger); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);' : ''}">
                    ${isLow ? 'Πρόλαβε την!' : 'Ζήτησε Μερίδα (1 credit)'}
                </button>
            `;

            card.querySelector('.request-btn').onclick = () => requestPortion(p.id, card.querySelector('.request-btn'));
            listContainer.appendChild(card);
        });
    }

    async function requestPortion(postId, btnEl) {
        if (state.loggedInUser.credits < 1) {
            showToast('Δεν έχεις αρκετά credits. Ανέβασε μια δική σου αγγελία!', 'error');
            return;
        }

        const originalText = btnEl.textContent;
        btnEl.textContent = 'Αποστολή...';
        btnEl.disabled = true;

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
                // Refresh data
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.detail, 'error');
                btnEl.textContent = originalText;
                btnEl.disabled = false;
            }
        } catch (e) {
            showToast('Σφάλμα σύνδεσης', 'error');
            btnEl.textContent = originalText;
            btnEl.disabled = false;
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
    setTimeout(fetchData, 400); // Slight delay to show skeletons

    return container;
}
