import React, { useState } from 'react'; 
import BackgroundWrapper from './components/BackgroundWrapper';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import ProfileEditForm from './components/ProfileEditForm';
import DatabaseViewer from './components/DatabaseViewer';
import CreateActionForm from './components/CreateActionForm';
import SearchActions from './components/SearchActions'; 
import ManageRequests from './components/ManageRequests';
import CreateCampaignForm from './components/CreateCampaignForm'; // USE CASE 8

import treeGif from './assets/tree.gif'; 
import bellIcon from './assets/bell.png';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  let blurLevel = 15; 
  let tint = 'rgba(27, 24, 27, 0.4)';

  if (currentView === 'register' || currentView === 'login' || currentView === 'profile_edit' || currentView === 'create_action' || currentView === 'manage_requests' || currentView === 'create_campaign') {
    blurLevel = 3; 
    tint = 'rgba(27, 24, 27, 0.75)';
  } else if (currentView === 'db' || currentView === 'actions' || currentView === 'search') {
    blurLevel = 6;
    tint = 'rgba(27, 24, 27, 0.85)';
  } else if (currentView === 'dashboard') {
    blurLevel = 6;
    tint = 'rgba(27, 24, 27, 0.85)';
  }

  const fetchDashboardData = async (user) => {
    if (!user) return;
    
    try {
      const notifRes = await fetch(`http://127.0.0.1:8000/api/notifications/${user.id}`);
      const notifData = await notifRes.json();
      setNotifications(notifData);
    } catch (e) { console.error(e); }

    try {
      const reqRes = await fetch(`http://127.0.0.1:8000/api/org-requests/${user.id}`);
      const reqData = await reqRes.json();
      setPendingRequestsCount(reqData.length || 0);
    } catch (e) { console.error(e); }
  };

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    setCurrentView('dashboard'); 
    fetchDashboardData(user); 
  };

  const toggleNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && notifications.length > 0) {
      try {
        await fetch(`http://127.0.0.1:8000/api/notifications/${loggedInUser.id}`, { method: 'DELETE' });
        setTimeout(() => setNotifications([]), 5000); 
      } catch (e) { console.error(e); }
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setLoggedInUser(updatedUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setNotifications([]);
    setPendingRequestsCount(0);
    setIsNotifOpen(false); 
    setCurrentView('home');
  };

  const sidebarStyle = {
    position: 'fixed', top: 0, left: isSidebarOpen ? 0 : '-300px', width: '260px', height: '100vh',
    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', transition: 'left 0.3s ease-in-out',
    zIndex: 1000, padding: '30px', boxSizing: 'border-box', color: '#1b181b',
    boxShadow: isSidebarOpen ? '5px 0 20px rgba(0,0,0,0.5)' : 'none'
  };

  return (
    <BackgroundWrapper blur={blurLevel} tint={tint}>
      
      {(currentView === 'home' || currentView === 'dashboard') && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', boxSizing: 'border-box', position: 'relative', zIndex: 10}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', padding: 0 }} onClick={() => setIsSidebarOpen(true)}>☰</button>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', margin: 0, letterSpacing: '2px', textShadow: '0px 2px 5px rgba(0,0,0,0.8)', cursor: 'pointer' }} onClick={() => { setCurrentView(loggedInUser ? 'dashboard' : 'home'); fetchDashboardData(loggedInUser); }}>RELEAF</h1>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {!loggedInUser ? (
                <>
                  <button className="releaf-button" style={{ background: '#10b981', color: '#fff', fontWeight: 'bold', margin: 0, padding: '8px 18px', fontSize: '0.85rem' }} onClick={() => setCurrentView('register')}>εγγραφή</button>
                  <button className="releaf-button" style={{ margin: 0, padding: '8px 18px', fontSize: '0.85rem' }} onClick={() => setCurrentView('login')}>σύνδεση</button>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, position: 'relative', display: 'flex' }} onClick={toggleNotifications}>
                      <img src={bellIcon} alt="Ειδοποιήσεις" style={{ width: '32px', height: '32px' }} />
                      {notifications.length > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff4d4d', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {notifications.length}
                        </span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div style={{ position: 'absolute', top: '50px', right: '-10px', width: '280px', background: 'rgba(27,24,27,0.95)', border: '1px solid var(--accent-color)', borderRadius: '12px', padding: '15px', zIndex: 100, textAlign: 'left', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'white', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>ειδοποιήσεις</h4>
                        {notifications.length === 0 ? (
                          <p style={{ color: '#888', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', margin: 0 }}>δεν έχετε νέες ειδοποιήσεις.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {notifications.map(n => <li key={n.id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ccc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>▸ {n.text}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div onClick={() => setCurrentView('profile_edit')} style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', color: 'white', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)', transition: 'transform 0.2s ease' }}>
                    {loggedInUser.username.charAt(0).toUpperCase()}
                  </div>
                </>
              )}
            </div>
          </div>

          {currentView === 'home' && !loggedInUser && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10%', padding: '0 50px', marginTop: '-5vh' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '450px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#ddd', marginBottom: '30px', lineHeight: '1.6', textAlign: 'left' }}>
                  ενώνουμε εθελοντές, οργανισμούς και χορηγούς για να δημιουργήσουμε έναν πιο πράσινο κόσμο. 
                  ανακάλυψε δράσεις στην περιοχή σου, πρόσφερε τον χρόνο ή τους πόρους σου, και κάνε τη διαφορά. 
                  η πλατφόρμα μας απλοποιεί τον συντονισμό και δίνει φωνή σε κάθε τοπική περιβαλλοντική πρωτοβουλία.
                </p>
                <img src={treeGif} alt="Φύση" style={{ width: '100%', maxWidth: '350px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <button 
                  className="releaf-button" 
                  style={{ fontSize: '1.6rem', padding: '0 60px', background: '#10b981', color: '#fff', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', margin: '40px 0 0 0', whiteSpace: 'nowrap', aspectRatio: '4 / 1', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                  onClick={() => setCurrentView('register')}
                >
                  ξεκίνα μαζί μας!
                </button>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#000', marginTop: '10px', fontStyle: 'italic', fontWeight: 'bold', textShadow: '0px 0px 8px rgba(255,255,255,1), 0px 0px 4px rgba(255,255,255,0.8)' }}>
                  έλα και εσύ στην παρέα μας,<br/>η φύση σε χρειάζεται! 🌿
                </p>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && loggedInUser && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 30px', boxSizing: 'border-box', marginTop: '-2vh' }}>
              
              <h2 style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontSize: '1.6rem', marginBottom: '5px', textShadow: '0px 2px 5px rgba(0,0,0,0.8)' }}>
                καλώς ήρθες, <span style={{ color: '#10b981' }}>{loggedInUser.username}</span>!
              </h2>
              <p style={{ fontFamily: 'var(--font-mono)', color: '#ddd', fontSize: '1rem', marginBottom: '25px' }}>εδώ θα μπορείς να ελέγχεις την πρόοδό σου και να βρίσκεις δράσεις.</p>
              
              <div style={{ display: 'flex', gap: '30px', height: '65vh', width: '100%' }}>
                
                {/* ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button className="releaf-button" style={{ background: '#10b981', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', flex: 1 }} onClick={() => setCurrentView('create_action')}>
                      + δημιουργία δράσης
                    </button>

                    <button className="releaf-button" style={{ background: '#4f46e5', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(79,70,229,0.3)', flex: 1 }} onClick={() => setCurrentView('create_campaign')}>
                      + δημιουργία καμπάνιας
                    </button>

                    <button className="releaf-button" style={{ position: 'relative', background: 'var(--accent-color)', color: 'white', flex: 1 }} onClick={() => setCurrentView('manage_requests')}>
                      διαχείριση αιτήσεων
                      {pendingRequestsCount > 0 && (
                        <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ff4d4d', color: 'white', borderRadius: '50%', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {pendingRequestsCount}
                        </span>
                      )}
                    </button>
                    
                    <button className="releaf-button" style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }} onClick={() => setCurrentView('db')}>
                      🛠️ db admin
                    </button>
                  </div>
                  
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#888', fontSize: '1.2rem', textAlign: 'center', lineHeight: '1.6' }}>
                      [ dashboard stats ] <br/> 
                      <span style={{ fontSize: '0.9rem' }}>εδώ θα μπουν γραφήματα <br/>και η προσωπική σου πρόοδος.</span>
                    </span>
                  </div>
                </div>

                {/* ΔΕΞΙΑ ΣΤΗΛΗ */}
                <div style={{ flex: '1.2', background: 'rgba(27, 24, 27, 0.85)', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                  <SearchActions currentUser={loggedInUser} />
                </div>
              </div>
            </div>
          )}

          {!loggedInUser && (
            <button style={{ fontFamily: 'var(--font-mono)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', cursor: 'pointer', position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} onClick={() => setCurrentView('db')}>🛠️ db admin</button>
          )}

        </div>
      )}

      {/* OVERLAYS & FORMS */}
      {currentView === 'register' && <RegistrationForm onBack={() => setCurrentView('home')} onComplete={() => {}} />}
      {currentView === 'login' && <LoginForm onBack={() => setCurrentView('home')} onLoginSuccess={handleLoginSuccess} />}
      {currentView === 'profile_edit' && loggedInUser && <ProfileEditForm currentUser={loggedInUser} onBack={() => setCurrentView('dashboard')} onUpdateSuccess={handleProfileUpdate} onLogout={handleLogout} />}
      {currentView === 'create_action' && loggedInUser && <CreateActionForm currentUser={loggedInUser} onBack={() => setCurrentView('dashboard')} />}
      
      {currentView === 'create_campaign' && loggedInUser && (
        <CreateCampaignForm currentUser={loggedInUser} onBack={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'manage_requests' && loggedInUser && (
        <ManageRequests 
          currentUser={loggedInUser} 
          onBack={() => setCurrentView('dashboard')} 
          onRequestHandled={() => fetchDashboardData(loggedInUser)} 
        />
      )}

      {currentView === 'search' && loggedInUser && (
        <div style={{ background: 'rgba(27, 24, 27, 0.95)', padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '800px', height: '70vh', display: 'flex', flexDirection: 'column' }}>
          <SearchActions currentUser={loggedInUser} />
          <button className="releaf-button" style={{ marginTop: '20px', alignSelf: 'center', background: 'transparent', border: '1px solid white' }} onClick={() => setCurrentView('dashboard')}>Επιστροφή</button>
        </div>
      )}

      {currentView === 'db' && <DatabaseViewer onBack={() => setCurrentView(loggedInUser ? 'dashboard' : 'home')} />}

      {/* SIDEBAR */}
      {isSidebarOpen && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 998 }} onClick={() => setIsSidebarOpen(false)} />}
      <div style={sidebarStyle}>
        <button style={{ position: 'absolute', top: '28px', left: '30px', background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#1b181b', padding: 0, lineHeight: 1 }} onClick={() => setIsSidebarOpen(false)}>✕</button>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginTop: '80px', fontSize: '1.5rem', borderBottom: '2px solid var(--accent-color)', paddingBottom: '10px' }}>μενού</h3>
        <ul style={{ listStyleType: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
          {!loggedInUser ? (
            <>
              <li style={{ margin: '20px 0', cursor: 'pointer' }} onClick={() => { setCurrentView('home'); setIsSidebarOpen(false); }}>αρχική</li>
              <li style={{ margin: '20px 0', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>σχετικά με εμάς</li>
              <li style={{ margin: '20px 0', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>επικοινωνία</li>
            </>
          ) : (
            <>
              <li style={{ margin: '20px 0', cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 'bold' }} onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}>▸ dashboard</li>
              <li style={{ margin: '20px 0', cursor: 'pointer' }} onClick={() => { setCurrentView('profile_edit'); setIsSidebarOpen(false); }}>το προφίλ μου</li>
              
              <li style={{ margin: '20px 0', cursor: 'pointer', color: 'var(--accent-color)' }} onClick={() => { setCurrentView('create_action'); setIsSidebarOpen(false); }}>+ δημιουργία δράσης</li>
              <li style={{ margin: '20px 0', cursor: 'pointer', color: '#4f46e5' }} onClick={() => { setCurrentView('create_campaign'); setIsSidebarOpen(false); }}>+ δημιουργία καμπάνιας</li>
              
              <li style={{ margin: '20px 0', cursor: 'pointer', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => { setCurrentView('manage_requests'); setIsSidebarOpen(false); }}>
                διαχείριση αιτήσεων
                {pendingRequestsCount > 0 && (
                  <span style={{ background: '#ff4d4d', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 'bold' }}>{pendingRequestsCount}</span>
                )}
              </li>

              <li style={{ margin: '20px 0', cursor: 'pointer', color: '#10b981', fontWeight: 'bold' }} onClick={() => { setCurrentView('search'); setIsSidebarOpen(false); }}>🔍 αναζήτηση δράσεων</li>
              <li style={{ margin: '20px 0', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>μηνύματα</li>
              <li style={{ margin: '20px 0', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>ρυθμίσεις</li>
              <li style={{ margin: '20px 0', marginTop: '40px', cursor: 'pointer', color: '#ff4d4d', fontWeight: 'bold' }} onClick={() => { handleLogout(); setIsSidebarOpen(false); }}>αποσύνδεση</li>
            </>
          )}
        </ul>
      </div>

    </BackgroundWrapper>
  );
}

export default App;