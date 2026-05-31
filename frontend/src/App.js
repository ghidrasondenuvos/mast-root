import React, { useState } from 'react';
import BackgroundWrapper from './components/BackgroundWrapper';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import DatabaseViewer from './components/DatabaseViewer';

import treeGif from './assets/tree.gif'; 

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  let blurLevel = 15; 
  let tint = 'rgba(27, 24, 27, 0.4)';

  if (currentView === 'register' || currentView === 'login') {
    blurLevel = 3; 
    tint = 'rgba(27, 24, 27, 0.75)';
  } else if (currentView === 'db' || currentView === 'actions' || currentView === 'dashboard') {
    blurLevel = 6;
    tint = 'rgba(27, 24, 27, 0.85)';
  }

  const handleLoginSuccess = (user, notifs) => {
    setLoggedInUser(user);
    setNotifications(notifs);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setNotifications([]);
    setCurrentView('home');
  };

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isSidebarOpen ? 0 : '-300px',
    width: '260px',
    height: '100vh',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(15px)',
    transition: 'left 0.3s ease-in-out',
    zIndex: 1000,
    padding: '30px',
    boxSizing: 'border-box',
    color: '#1b181b',
    boxShadow: isSidebarOpen ? '5px 0 20px rgba(0,0,0,0.5)' : 'none'
  };

  return (
    <BackgroundWrapper blur={blurLevel} tint={tint}>
      
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <button 
          style={{ position: 'absolute', top: '28px', left: '30px', background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#1b181b', padding: 0, lineHeight: 1 }}
          onClick={() => setIsSidebarOpen(false)}
        >
          ✕
        </button>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginTop: '80px', fontSize: '1.5rem', borderBottom: '2px solid var(--accent-color)', paddingBottom: '10px' }}>
          μενού
        </h3>
        <ul style={{ listStyleType: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
          <li style={{ margin: '20px 0', cursor: 'pointer' }}>προφίλ</li>
          <li style={{ margin: '20px 0', cursor: 'pointer' }}>ρυθμίσεις</li>
          <li style={{ margin: '20px 0', cursor: 'pointer' }}>επικοινωνία</li>
        </ul>
      </div>

      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ΑΡΧΙΚΗ ΣΕΛΙΔΑ */}
      {currentView === 'home' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* TOP HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px 30px', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', padding: 0 }}
                onClick={() => setIsSidebarOpen(true)}
              >
                ☰
              </button>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', margin: 0, letterSpacing: '2px', textShadow: '0px 2px 5px rgba(0,0,0,0.8)' }}>
                RELEAF
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="releaf-button" 
                style={{ background: '#8db600', color: '#1b181b', fontWeight: 'bold', margin: 0, padding: '8px 18px', fontSize: '0.85rem' }} 
                onClick={() => setCurrentView('register')}
              >
                εγγραφή
              </button>
              <button 
                className="releaf-button" 
                style={{ margin: 0, padding: '8px 18px', fontSize: '0.85rem' }} 
                onClick={() => setCurrentView('login')}
              >
                σύνδεση
              </button>
            </div>
          </div>

          {/* MAIN CENTER CONTENT (2 Στήλες: Αριστερά και Δεξιά) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10%', padding: '0 50px', marginTop: '-5vh' }}>
            
            {/* ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ: Κείμενο και GIF */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '450px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#ddd', marginBottom: '30px', lineHeight: '1.6', textAlign: 'left' }}>
                ενώνουμε εθελοντές, οργανισμούς και χορηγούς για να δημιουργήσουμε έναν πιο πράσινο κόσμο. 
                ανακάλυψε δράσεις στην περιοχή σου, πρόσφερε τον χρόνο ή τους πόρους σου, και κάνε τη διαφορά. 
                η πλατφόρμα μας απλοποιεί τον συντονισμό και δίνει φωνή σε κάθε τοπική περιβαλλοντική πρωτοβουλία.
              </p>
              
              <img 
                src={treeGif} 
                alt="Φύση" 
                style={{ width: '100%', maxWidth: '350px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }} 
              />
            </div>

            {/* ΔΕΞΙΑ ΣΤΗΛΗ: Μεγάλο Κουμπί και Prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              {/* Ανανεωμένο Κουμπί: Φρέσκο πράσινο, no-wrap, σταθερή αναλογία */}
              <button 
                className="releaf-button" 
                style={{ 
                  fontSize: '1.6rem', 
                  padding: '0 60px', /* Το padding ελέγχεται κυρίως από το aspectRatio */
                  background: '#10b981', /* Ένα υπέροχο, μοντέρνο σμαραγδί/πράσινο (Emerald) */
                  color: '#fff', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', 
                  margin: '40px 0 0 0',
                  whiteSpace: 'nowrap', /* Απαγορεύει στα γράμματα να σπάσουν σε 2η γραμμή */
                  aspectRatio: '4 / 1', /* Κλειδώνει την αναλογία (πλάτος 4, ύψος 1) */
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0
                }}
                onClick={() => setCurrentView('register')}
              >
                ξεκίνα μαζί μας!
              </button>

              {/* Το κείμενο ήρθε πολύ πιο κοντά (marginTop 10px) */}
              <p style={{ 
                fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#000', 
                marginTop: '10px', /* Ήταν 25px */
                fontStyle: 'italic', fontWeight: 'bold', textShadow: '0px 0px 8px rgba(255,255,255,1), 0px 0px 4px rgba(255,255,255,0.8)' 
              }}>
                έλα και εσύ στην παρέα μας,<br/>η φύση σε χρειάζεται! 🌿
              </p>
            </div>
            
          </div>

          <button 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', 
              cursor: 'pointer', position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' 
            }} 
            onClick={() => setCurrentView('db')}
          >
            🛠️ db admin
          </button>
        </div>
      )}

      {/* ΦΟΡΜΕΣ ΚΑΙ ΛΟΙΠΕΣ ΟΘΟΝΕΣ */}
      {currentView === 'register' && (
        <RegistrationForm onBack={() => setCurrentView('home')} onComplete={() => {}} />
      )}

      {currentView === 'login' && (
        <LoginForm onBack={() => setCurrentView('home')} onLoginSuccess={handleLoginSuccess} />
      )}

      {currentView === 'dashboard' && loggedInUser && (
        <div style={{ background: 'rgba(27, 24, 27, 0.9)', padding: '40px', borderRadius: '15px', width: '450px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', marginBottom: '5px' }}>προφίλ χρήστη</h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#8db600', marginBottom: '30px' }}>συνδεδεμένος ως: {loggedInUser.username} ({loggedInUser.account_type})</p>
          <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', borderBottom: '1px solid var(--accent-color)', paddingBottom: '10px' }}>ειδοποιήσεις ({notifications.length})</h3>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ccc' }}>
              {notifications.map(notif => <li key={notif.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>▸ {notif.text}</li>)}
            </ul>
          </div>
          <button className="releaf-button" style={{ marginTop: '30px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d' }} onClick={handleLogout}>αποσύνδεση</button>
        </div>
      )}

      {currentView === 'db' && (
        <DatabaseViewer onBack={() => setCurrentView('home')} />
      )}

    </BackgroundWrapper>
  );
}

export default App;