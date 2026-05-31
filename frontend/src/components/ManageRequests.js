import React, { useState, useEffect, useCallback } from 'react';

function ManageRequests({ currentUser, onBack, onRequestHandled }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [result, setResult] = useState({ status: '', message: '' });
  const [step, setStep] = useState(1); // 1: Λίστα, 2: Λεπτομέρειες, 3: Αποτέλεσμα

  // ΔΙΟΡΘΩΣΗ: Χρήση του useCallback για να λυθεί το warning του ESLint
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/org-requests/${currentUser.id}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Σφάλμα ανάκτησης αιτήσεων", err);
    }
  }, [currentUser.id]); // Εξαρτάται από το currentUser.id

  // ΔΙΟΡΘΩΣΗ: Προσθήκη του fetchRequests στο dependency array
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Υποβολή Απόφασης (Approve / Reject)
  const submitDecision = async (decision) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/requests/${selectedRequest.request_id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_user_id: currentUser.id, status: decision })
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult({ status: 'success', message: `Η αίτηση του/της ${selectedRequest.volunteer_name} ${decision === 'approved' ? 'εγκρίθηκε' : 'απορρίφθηκε'} επιτυχώς!` });
        // Ενημερώνουμε το App.js ότι φύγαμε από μια αίτηση ώστε να πέσει το counter
        if(onRequestHandled) onRequestHandled(); 
      } else {
        setResult({ status: 'error', message: data.detail || 'Σφάλμα κατά την επεξεργασία.' });
      }
    } catch (err) {
      setResult({ status: 'error', message: 'Αδυναμία σύνδεσης με τον διακομιστή.' });
    }
    setStep(3); // Πάμε στην οθόνη αποτελέσματος
  };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.95)', padding: '30px', borderRadius: '15px', width: '100%', maxWidth: '600px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
      
      {step === 1 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-color)', margin: 0, fontSize: '1.8rem' }}>Διαχείριση Αιτήσεων</h2>
             <button style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }} onClick={onBack}>X</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {requests.length === 0 ? (
              <p style={{ color: '#888', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '50px' }}>Δεν υπάρχουν εκκρεμείς αιτήσεις.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {requests.map(req => (
                  <div 
                    key={req.request_id} 
                    onClick={() => { setSelectedRequest(req); setStep(2); }}
                    style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} 
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white', fontFamily: 'var(--font-mono)' }}>{req.volunteer_name}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Αναμονή</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc', fontFamily: 'var(--font-mono)' }}>Δράση: {req.action_title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ΟΘΟΝΗ ΛΕΠΤΟΜΕΡΕΙΩΝ ΑΙΤΗΣΗΣ */}
      {step === 2 && selectedRequest && (
        <>
          <button onClick={() => setStep(1)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontFamily: 'var(--font-mono)', marginBottom: '15px' }}>← Πίσω στη Λίστα</button>
          
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 5px 0' }}>Αίτηση Συμμετοχής</h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', margin: '0 0 20px 0' }}>Δράση: {selectedRequest.action_title}</p>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.2)' }}>
             <h4 style={{ color: '#10b981', fontFamily: 'var(--font-mono)', margin: '0 0 15px 0' }}>Στοιχεία Εθελοντή</h4>
             <p style={{ margin: '5px 0', color: '#ccc', fontFamily: 'var(--font-mono)' }}><strong>Όνομα:</strong> {selectedRequest.volunteer_name}</p>
             <p style={{ margin: '5px 0', color: '#ccc', fontFamily: 'var(--font-mono)' }}><strong>Δεξιότητες:</strong> {selectedRequest.volunteer_skills}</p>
             <p style={{ margin: '5px 0', color: '#ccc', fontFamily: 'var(--font-mono)' }}><strong>Διαθέσιμα Μέσα:</strong> {selectedRequest.volunteer_resources}</p>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', paddingTop: '20px' }}>
            <button className="releaf-button" style={{ flex: 1, background: '#10b981', color: 'white' }} onClick={() => submitDecision('approved')}>Έγκριση</button>
            <button className="releaf-button" style={{ flex: 1, background: '#ff4d4d', color: 'white', border: 'none' }} onClick={() => submitDecision('rejected')}>Απόρριψη</button>
          </div>
        </>
      )}

      {/* ΟΘΟΝΗ ΑΠΟΤΕΛΕΣΜΑΤΟΣ */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: result.status === 'success' ? '#8db600' : '#ff4d4d', fontSize: '2rem', margin: '0 0 15px 0' }}>
            {result.status === 'success' ? 'Επιτυχία!' : 'Σφάλμα!'}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: '1.6', marginBottom: '30px' }}>{result.message}</p>
          <button className="releaf-button" onClick={() => { setStep(1); fetchRequests(); }}>Επιστροφή στις Αιτήσεις</button>
        </div>
      )}
    </div>
  );
}

export default ManageRequests;