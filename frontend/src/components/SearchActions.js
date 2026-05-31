import React, { useState } from 'react';

function SearchActions() {
  const [criteria, setCriteria] = useState({ location: '', action_type: '', keyword: '' });
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setHasSearched(true);
    
    // Μετατροπή των φίλτρων σε URL Parameters
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
        // Εμφάνιση του μηνύματος σφάλματος από το Backend
        setError(data.detail || 'Σφάλμα κατά την αναζήτηση.');
      }
    } catch (err) {
      setResults([]);
      setError('Αδυναμία σύνδεσης με τον διακομιστή. Ελέγξτε αν τρέχει η βάση.');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-color)', margin: '0 0 5px 0', fontSize: '1.4rem' }}>
        🔍 Αναζήτηση Δράσεων
      </h3>
      
      {/* ΦΟΡΜΑ ΚΡΙΤΗΡΙΩΝ */}
      <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <input 
          className="releaf-input" 
          placeholder="Λέξη-κλειδί (π.χ. Δάσος)" 
          style={{ flex: '1 1 30%', margin: 0, padding: '10px', fontSize: '0.85rem' }}
          value={criteria.keyword}
          onChange={e => setCriteria({...criteria, keyword: e.target.value})}
        />
        <input 
          className="releaf-input" 
          placeholder="Περιοχή (π.χ. Πάτρα)" 
          style={{ flex: '1 1 30%', margin: 0, padding: '10px', fontSize: '0.85rem' }}
          value={criteria.location}
          onChange={e => setCriteria({...criteria, location: e.target.value})}
        />
        <input 
          className="releaf-input" 
          placeholder="Τύπος (π.χ. Καθαρισμός)" 
          style={{ flex: '1 1 30%', margin: 0, padding: '10px', fontSize: '0.85rem' }}
          value={criteria.action_type}
          onChange={e => setCriteria({...criteria, action_type: e.target.value})}
        />
        <button className="releaf-button" type="submit" style={{ flex: '1 1 100%', padding: '10px', background: 'var(--accent-color)', color: '#fff' }}>
          Εκτέλεση Αναζήτησης
        </button>
      </form>

      {/* ΟΘΟΝΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ (Λίστα Ανακτούμενων Δράσεων) */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {error ? (
           <p style={{ color: '#ff4d4d', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '20px' }}>{error}</p>
        ) : results.length > 0 ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {results.map(action => (
               <div key={action.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'left', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{action.title}</h4>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', padding: '3px 8px', borderRadius: '20px', color: '#10b981' }}>{action.organisation}</span>
                 </div>
                 <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#ccc', lineHeight: '1.4' }}>{action.description}</p>
                 <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: '#a67c52', fontFamily: 'var(--font-mono)' }}>
                   <span>📍 {action.location}</span>
                   <span>🏷️ {action.action_type}</span>
                   <span>👥 Έως {action.max_participants} άτομα</span>
                 </div>
               </div>
             ))}
           </div>
        ) : hasSearched ? (
           <p style={{ color: '#aaa', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '20px' }}>Δεν βρέθηκαν αποτελέσματα.</p>
        ) : (
           <div style={{ color: '#888', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '30px', fontSize: '0.9rem' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🌿</span>
              Συμπληρώστε τα φίλτρα για να αναζητήσετε <br/>διαθέσιμες περιβαλλοντικές δράσεις.
           </div>
        )}
      </div>
    </div>
  );
}

export default SearchActions;