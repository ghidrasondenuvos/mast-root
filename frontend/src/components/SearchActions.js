import React, { useState } from 'react';

function SearchActions({ currentUser }) {
  const [criteria, setCriteria] = useState({ location: '', action_type: '', keyword: '' });
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // State για την Οθόνη Λεπτομερειών Δράσης
  const [selectedAction, setSelectedAction] = useState(null);
  const [participationResult, setParticipationResult] = useState({ status: '', message: '' });

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setHasSearched(true);
    setSelectedAction(null); // Κλείνει τυχόν ανοιχτή δράση σε νέα αναζήτηση
    
    const params = new URLSearchParams();
    if (criteria.location) params.append('location', criteria.location);
    if (criteria.action_type) params.append('action_type', criteria.action_type);
    if (criteria.keyword) params.append('keyword', criteria.keyword);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/search-actions?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setResults([]);
        setError(data.detail || 'Σφάλμα κατά την αναζήτηση.');
      }
    } catch (err) {
      setResults([]);
      setError('Αδυναμία σύνδεσης με τον διακομιστή.');
    }
  };

  const handleParticipate = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/actions/${selectedAction.id}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      const data = await response.json();
      
      if (response.ok) {
        setParticipationResult({ status: 'success', message: data.message });
      } else {
        setParticipationResult({ status: 'error', message: data.detail });
      }
    } catch (err) {
      setParticipationResult({ status: 'error', message: 'Σφάλμα σύνδεσης με το σύστημα.' });
    }
  };

  // --- ΟΘΟΝΗ ΛΕΠΤΟΜΕΡΕΙΩΝ ΔΡΑΣΗΣ ---
  if (selectedAction) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button 
          onClick={() => { setSelectedAction(null); setParticipationResult({ status: '', message: '' }); }} 
          style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
        >
          ← Πίσω στα αποτελέσματα
        </button>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '10px' }}>
          <h2 style={{ color: '#10b981', fontFamily: 'var(--font-heading)', margin: '0 0 10px 0' }}>{selectedAction.title}</h2>
          <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.2)', padding: '5px 10px', borderRadius: '20px', color: '#10b981' }}>Διοργάνωση: {selectedAction.organisation}</span>
          
          <p style={{ fontFamily: 'var(--font-mono)', color: '#ddd', marginTop: '20px', lineHeight: '1.6' }}>{selectedAction.description}</p>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', color: '#a67c52', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            <span>📍 {selectedAction.location}</span>
            <span>🏷️ {selectedAction.action_type}</span>
            <span>👥 Όριο: {selectedAction.max_participants} θέσεις</span>
          </div>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            {currentUser?.account_type === 'volunteer' ? (
              <>
                {participationResult.message ? (
                  <p style={{ color: participationResult.status === 'success' ? '#10b981' : '#ff4d4d', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {participationResult.message}
                  </p>
                ) : (
                  <button className="releaf-button" style={{ background: '#10b981', color: 'white', fontWeight: 'bold' }} onClick={handleParticipate}>
                    Δήλωση Συμμετοχής
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: '#ff4d4d', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                Μόνο λογαριασμοί εθελοντών μπορούν να δηλώσουν συμμετοχή.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ΟΘΟΝΗ ΑΝΑΖΗΤΗΣΗΣ ---
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-color)', margin: '0 0 5px 0', fontSize: '1.4rem' }}>
        🔍 Αναζήτηση Δράσεων
      </h3>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <input className="releaf-input" placeholder="Λέξη-κλειδί (π.χ. Δάσος)" style={{ flex: '1 1 30%', margin: 0, padding: '10px', fontSize: '0.85rem' }} value={criteria.keyword} onChange={e => setCriteria({...criteria, keyword: e.target.value})} />
        <input className="releaf-input" placeholder="Περιοχή (π.χ. Πάτρα)" style={{ flex: '1 1 30%', margin: 0, padding: '10px', fontSize: '0.85rem' }} value={criteria.location} onChange={e => setCriteria({...criteria, location: e.target.value})} />
        <input className="releaf-input" placeholder="Τύπος (π.χ. Καθαρισμός)" style={{ flex: '1 1 30%', margin: 0, padding: '10px', fontSize: '0.85rem' }} value={criteria.action_type} onChange={e => setCriteria({...criteria, action_type: e.target.value})} />
        <button className="releaf-button" type="submit" style={{ flex: '1 1 100%', padding: '10px', background: 'var(--accent-color)', color: '#fff' }}>Εκτέλεση Αναζήτησης</button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {error ? (
           <p style={{ color: '#ff4d4d', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '20px' }}>{error}</p>
        ) : results.length > 0 ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {results.map(action => (
               <div 
                 key={action.id} 
                 onClick={() => setSelectedAction(action)} // Το κλικ πάει στην Οθόνη Λεπτομερειών!
                 style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }} 
                 onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} 
                 onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
               >
                 <h4 style={{ margin: '0 0 5px 0', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{action.title}</h4>
                 <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{action.description}</p>
                 <span style={{ fontSize: '0.75rem', color: '#a67c52', fontFamily: 'var(--font-mono)' }}>📍 {action.location} (Πατήστε για λεπτομέρειες)</span>
               </div>
             ))}
           </div>
        ) : hasSearched ? (
           <p style={{ color: '#aaa', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '20px' }}>Δεν βρέθηκαν αποτελέσματα.</p>
        ) : (
           <div style={{ color: '#888', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '30px', fontSize: '0.9rem' }}>Συμπληρώστε τα φίλτρα για αναζήτηση.</div>
        )}
      </div>
    </div>
  );
}

export default SearchActions;