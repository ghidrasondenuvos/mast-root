import React, { useState } from 'react';
import BackgroundWrapper from './components/BackgroundWrapper';
import RegistrationForm from './components/RegistrationForm';
import DatabaseViewer from './components/DatabaseViewer';

function App() {
  const [currentView, setCurrentView] = useState('home');

  // Απόλυτος έλεγχος του θολώματος και του χρώματος (tint) ανάλογα με την οθόνη
  let blurLevel = 15; // Το αρχικό μενού είναι αρκετά θολό για να κάνει αντίθεση
  let tint = 'rgba(27, 24, 27, 0.4)';

  if (currentView === 'register') {
    blurLevel = 3; // Ξεθολώνει όταν συμπληρώνεις στοιχεία
    tint = 'rgba(27, 24, 27, 0.75)';
  } else if (currentView === 'db' || currentView === 'actions') {
    blurLevel = 5;
    tint = 'rgba(27, 24, 27, 0.85)';
  }

  return (
    <BackgroundWrapper blur={blurLevel} tint={tint}>
      
      {currentView === 'home' && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '6rem', margin: '0 0 20px 0', letterSpacing: '4px', textShadow: '0px 4px 10px rgba(0,0,0,0.8)' }}>
            RELEAF
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', marginBottom: '40px', color: '#ccc' }}>Σύστημα Διαχείρισης Περιβαλλοντικών Δράσεων</p>
          
          <button className="releaf-button" onClick={() => setCurrentView('register')}>εγγραφή</button>
          <button className="releaf-button" onClick={() => setCurrentView('actions')}>δράσεις</button>
          <br /><br />
          <button className="releaf-button" style={{ background: 'transparent', border: '1px solid var(--accent-color)', fontSize: '0.8rem' }} onClick={() => setCurrentView('db')}>
            🛠️ προβολή βάσης (admin)
          </button>
        </div>
      )}

      {currentView === 'register' && (
        <RegistrationForm 
          onBack={() => setCurrentView('home')} 
          onComplete={() => {}} /* Αφήνουμε κενή λειτουργία για να μην κρασάρει η φόρμα */
        />
      )}

      {currentView === 'db' && (
        <DatabaseViewer onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'actions' && (
        <div style={{ background: 'rgba(0,0,0,0.7)', padding: '40px', borderRadius: '15px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)' }}>διαθέσιμες δράσεις</h2>
          <p style={{ fontFamily: 'var(--font-mono)', marginBottom: '30px' }}>οι δράσεις θα φορτώσουν εδώ...</p>
          <button className="releaf-button" onClick={() => setCurrentView('home')}>επιστροφή</button>
        </div>
      )}

    </BackgroundWrapper>
  );
}

export default App;