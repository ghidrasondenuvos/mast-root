import React, { useState, useEffect } from 'react';

function EnvironmentalNeedsDashboard({ currentUser }) {
  const [proposals, setProposals] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [resultMsg, setResultMsg] = useState({ status: '', text: '' });

  const fetchProposals = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/action-proposals');
      const data = await res.json();
      setProposals(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    setResultMsg({ status: '', text: '' });

    try {
      const res = await fetch('http://127.0.0.1:8000/api/analyze-needs', { method: 'POST' });
      const data = await res.json();
      
      setTimeout(() => {
        setAnalyzing(false);
        setResultMsg({ status: data.status, text: data.message });
        if (data.status === 'success') fetchProposals(); 
      }, 1500);

    } catch (e) {
      setAnalyzing(false);
      setResultMsg({ status: 'error', text: 'Σφάλμα σύνδεσης με τον σέρβερ Ανάλυσης.' });
    }
  };

  const convertToAction = async (proposalId) => {
    if (!currentUser) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/action-proposals/${proposalId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      const data = await res.json();
      
      if (res.ok) {
        setResultMsg({ status: 'success', text: data.message });
        fetchProposals(); 
      } else {
        setResultMsg({ status: 'error', text: data.detail || 'Αποτυχία μετατροπής.' });
      }
    } catch (e) {
      setResultMsg({ status: 'error', text: 'Σφάλμα δικτύου.' });
    }
  };

  return (
    <div style={{ flex: 1, background: 'rgba(27, 24, 27, 0.85)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      
      <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: '#8db600', fontSize: '1.2rem' }}>
          🌍 Ανάλυση Περιβαλλοντικών Αναγκών
        </h3>
        <button className="releaf-button" style={{ margin: 0, padding: '5px 15px', fontSize: '0.8rem', background: '#8db600' }} onClick={triggerAnalysis} disabled={analyzing}>
          {analyzing ? 'Ανάλυση...' : 'Εκτέλεση Σάρωσης'}
        </button>
      </div>

      {resultMsg.text && (
        <div style={{ padding: '10px 20px', background: resultMsg.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(255,193,7,0.2)', color: resultMsg.status === 'success' ? '#10b981' : '#fbbf24', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
          {resultMsg.text}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {analyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #8db600', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginTop: '10px', color: '#888', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Επεξεργασία δεδομένων περιοχής...</span>
          </div>
        ) : proposals.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontFamily: 'var(--font-mono)', marginTop: '20px', fontSize: '0.9rem' }}>
            Δεν υπάρχουν εκκρεμείς προτάσεις.<br/>Πατήστε "Εκτέλεση Σάρωσης" για ανάλυση.
          </div>
        ) : (
          proposals.map(p => (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', borderLeft: '3px solid #8db600', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ margin: '0 0 5px 0', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{p.title}</h4>
                <span style={{ fontSize: '0.7rem', background: '#a67c52', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{p.action_type}</span>
              </div>
              <p style={{ margin: '5px 0 10px 0', color: '#ccc', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.4' }}>{p.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#8db600', fontFamily: 'var(--font-mono)' }}>📍 {p.location}</div>
                
                <button 
                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}
                  onClick={() => convertToAction(p.id)}
                >
                  🚀 Ανάληψη Δράσης
                </button>
              </div>
            </div>
          ))
        )}
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export default EnvironmentalNeedsDashboard;