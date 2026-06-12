import { showToast } from '../app.js';

export function renderFeed(navigate, state) {
    const container = document.createElement('div');
    container.style.cssText = "width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px; display: flex; flex-direction: column; height: 85vh; animation: fadeInUp 0.5s ease-out;";

    container.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 35px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.15);">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px;">
                <h2 style="color: #111; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;">✨ Διαθέσιμες Μερίδες</h2>
            </div>
            
            <div style="margin-top: 10px; margin-bottom: 25px; position: relative;">
                <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: #888;">🔍</span>
                <input type="text" id="feed-search" placeholder="Αναζήτηση φαγητού..." style="width: 100%; padding: 14px 14px 14px 45px; border-radius: 12px; border: 2px solid #e9e9e7; background: #fff; color: #333; font-family: var(--font-main); font-size: 1.05rem; outline: none; box-sizing: border-box; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.02);" onfocus="this.style.borderColor='#2eaadc'; this.style.boxShadow='0 8px 20px rgba(46,170,220,0.15)';" onblur="this.style.borderColor='#e9e9e7'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.02)';" />
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px;" id="feed-filters">
                <button class="notion-filter" data-filter="all" style="background: linear-gradient(135deg, #2eaadc, #1ca0d3); color: #fff; border: none; border-radius: 20px; padding: 6px 16px; font-size: 0.9rem; font-family: var(--font-main); font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(46,170,220,0.3);">Όλα</button>
                <button class="notion-filter" data-filter="no-gluten" style="background: #f5f5f5; color: #666; border: none; border-radius: 20px; padding: 6px 16px; font-size: 0.9rem; font-family: var(--font-main); font-weight: 500; cursor: pointer; transition: all 0.2s;">Χωρίς Γλουτένη</button>
                <button class="notion-filter" data-filter="no-dairy" style="background: #f5f5f5; color: #666; border: none; border-radius: 20px; padding: 6px 16px; font-size: 0.9rem; font-family: var(--font-main); font-weight: 500; cursor: pointer; transition: all 0.2s;">Χωρίς Γαλακτοκομικά</button>
                <button class="notion-filter" data-filter="vegan" style="background: #f5f5f5; color: #666; border: none; border-radius: 20px; padding: 6px 16px; font-size: 0.9rem; font-family: var(--font-main); font-weight: 500; cursor: pointer; transition: all 0.2s;">Vegan 🌱</button>
            </div>

            <div id="feed-list" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; padding: 10px 5px 30px 5px; align-content: start;">
                <div style="grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; min-height: 200px;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2eaadc; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
        </div>
    `;

    let allPosts = [];
    let currentFilter = 'all';
    let searchQuery = '';

    const listContainer = container.querySelector('#feed-list');
    const searchInput = container.querySelector('#feed-search');
    const filterBtns = container.querySelectorAll('.notion-filter');

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderPosts();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => {
                b.style.background = '#f5f5f5';
                b.style.color = '#666';
                b.style.boxShadow = 'none';
            });
            e.target.style.background = 'linear-gradient(135deg, #2eaadc, #1ca0d3)';
            e.target.style.color = '#fff';
            e.target.style.boxShadow = '0 4px 10px rgba(46,170,220,0.3)';
            currentFilter = e.target.getAttribute('data-filter');
            renderPosts();
        });
    });

    function renderPosts() {
        listContainer.innerHTML = '';

        const filtered = allPosts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchQuery) || 
                                  post.cook_name.toLowerCase().includes(searchQuery);
            if (!matchesSearch) return false;

            const allergens = (post.allergens || '').toLowerCase();
            if (currentFilter === 'no-gluten' && (allergens.includes('γλουτένη') || allergens.includes('gluten'))) return false;
            if (currentFilter === 'no-dairy' && (allergens.includes('γάλα') || allergens.includes('τυρί') || allergens.includes('dairy') || allergens.includes('γαλακτοκομικά'))) return false;
            if (currentFilter === 'vegan' && (!allergens.includes('vegan'))) { }

            return true;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="grid-column: 1 / -1; color: #888; font-family: var(--font-main); text-align: center; margin-top: 40px; font-size: 1.1rem;">Δεν βρέθηκαν αποτελέσματα. 🍽️</p>';
            return;
        }

        filtered.forEach(post => {
            const isInactive = post.available_portions <= 0;
            const card = document.createElement('div');
            
            card.style.cssText = `background: #ffffff; padding: 24px; border: 1px solid #f0f0f0; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1); opacity: ${isInactive ? '0.6' : '1'}; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); position: relative; overflow: hidden; min-height: 240px;`;
            card.onmouseenter = () => { if(!isInactive) { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)'; card.style.borderColor = '#e0e0e0'; }};
            card.onmouseleave = () => { if(!isInactive) { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; card.style.borderColor = '#f0f0f0'; }};
            
            const topHighlight = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: ${isInactive ? '#ff4d4d' : 'linear-gradient(90deg, #2eaadc, #FFC72C)'};"></div>`;

            card.innerHTML = `
                ${topHighlight}
                <div>
                    <h3 style="margin: 0 0 14px 0; color: #222; font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${post.title}</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 0.95rem; font-family: var(--font-main);">
                            <span style="background: #f5f5f5; padding: 4px; border-radius: 6px; font-size: 0.85rem;">👨‍🍳</span> 
                            <span style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${post.cook_name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 0.95rem; font-family: var(--font-main);">
                            <span style="background: #f5f5f5; padding: 4px; border-radius: 6px; font-size: 0.85rem;">📍</span> 
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${post.pickup_location}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 0.95rem; font-family: var(--font-main);">
                            <span style="background: #f5f5f5; padding: 4px; border-radius: 6px; font-size: 0.85rem;">⏰</span> 
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${post.pickup_time}</span>
                        </div>
                    </div>
                    
                    ${post.allergens ? `<div style="margin-bottom: 15px;"><span style="background: rgba(218, 41, 28, 0.08); color: #DA291C; padding: 5px 12px; border-radius: 8px; font-size: 0.8rem; font-family: var(--font-main); font-weight: 600; display: inline-block;">⚠️ ${post.allergens}</span></div>` : ''}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px solid #f5f5f5;">
                    <div style="flex: 1;">
                        <span style="display: block; font-family: var(--font-main); font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Διαθέσιμες</span>
                        <span style="display: block; font-family: var(--font-heading); font-weight: 800; font-size: 1.25rem; color: ${isInactive ? '#ff4d4d' : '#2eaadc'};">
                            ${post.available_portions} <span style="font-size: 0.9rem; color: #aaa; font-weight: 500;">/ ${post.total_portions}</span>
                        </span>
                    </div>
                    ${!isInactive && post.cook_id !== state.loggedInUser.id ? `<button class="request-btn" style="background: linear-gradient(135deg, #2eaadc, #1ca0d3); color: #ffffff; border: none; border-radius: 10px; padding: 10px 16px; font-size: 0.9rem; font-family: var(--font-main); font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(46,170,220,0.3); flex-shrink: 0; white-space: nowrap;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(46,170,220,0.4)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(46,170,220,0.3)';">Δέσμευση</button>` : ''}
                </div>
            `;

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
                            if (r.ok) {
                                showToast(rData.message, 'success');
                                state.loggedInUser.credits -= 1;
                                setTimeout(() => navigate('dashboard'), 1500); 
                            } else {
                                showToast(rData.detail, 'error');
                            }
                        } catch (err) {
                            showToast('Σφάλμα σύνδεσης.', 'error');
                        }
                    }
                };
            }
            listContainer.appendChild(card);
        });
    }

    fetch('/api/posts?feed=true')
        .then(res => res.json())
        .then(posts => {
            allPosts = posts;
            renderPosts();
        })
        .catch(err => {
            listContainer.innerHTML = '<p style="grid-column: 1 / -1; color: #DA291C; text-align: center; font-family: var(--font-main);">Σφάλμα φόρτωσης.</p>';
        });

    return container;
}
