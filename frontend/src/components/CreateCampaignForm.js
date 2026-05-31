import React, { useState, useEffect } from 'react';

function CreateCampaignForm({ currentUser, onBack }) {
  const [form, setForm] = useState({ title: '', description: '', goal_amount: '', action_id: '' });
  const [userActions, setUserActions] = useState([]);
  const [step, setStep] = useState(1); 
  const [result, setResult] = useState({ status: '', message: '' });

  // Φόρτωση των δράσεων του χρήστη (Έλεγχος Συσχετισμένης Δράσης)
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/user-actions/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setUserActions(data))
      .catch(err => console.error(err));
  }, [currentUser.id]);

  const submitCampaign = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.goal_amount || !form.action_id) {
      setResult({ status: 'error', message: 'Παρακαλώ συμπληρώστε όλα τα πεδία.' });
      setStep(2); return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          goal_amount: parseInt(form.goal_amount),
          action_id: parseInt(form.action_id),
          creator_user_id: currentUser.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ status: 'success', message: data.message });
      } else {
        setResult({ status: 'error', message: data.detail || 'Αποτυχία δημιουργίας.' });
      }
    } catch (err) {
      setResult({ status: 'error', message: 'Αδυναμία σύνδεσης με τον διακομιστή.' });
    }
    setStep(2);
  };

  const labelStyle = { fontSize: '0.75rem', color: 'var(--accent-color)', marginLeft: '15px', marginBottom: '3px', fontFamily: 'var(--font-mono)', display: 'block', textAlign: 'left' };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.90)', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '500px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center' }}>
      {step === 1 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#4f46e5', fontSize: '2rem', margin: '0 0 20px 0' }}>Δημιουργία Καμπάνιας</h2>
          
          {userActions.length === 0 ? (
            <div style={{ color: '#aaa', fontFamily: 'var(--font-mono)', margin: '30px 0', lineHeight: '1.6' }}>
              <p>Δεν έχετε διοργανώσει κάποια δράση ακόμα.</p>
              <p style={{ fontSize: '0.85rem' }}>Πρέπει πρώτα να δημιουργήσετε μια περιβαλλοντική δράση για να μπορέσετε να ξεκινήσετε καμπάνια χρηματοδότησης γι' αυτήν!</p>
              <button className="releaf-button" style={{ marginTop: '20px', background: 'transparent', border: '1px solid white' }} onClick={onBack}>Ακύρωση</button>
            </div>
          ) : (
            <form onSubmit={submitCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={labelStyle}>ΣΥΣΧΕΤΙΣΜΕΝΗ ΔΡΑΣΗ</span>
                <select className="releaf-input" style={{ width: '100%', boxSizing: 'border-box', margin: 0, appearance: 'none', cursor: 'pointer' }} value={form.action_id} onChange={e => setForm({...form, action_id: e.target.value})}>
                  <option value="" disabled>Επιλέξτε τη δράση σας...</option>
                  {userActions.map(action => (
                    <option key={action.id} value={action.id}>{action.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <span style={labelStyle}>ΤΙΤΛΟΣ ΚΑΜΠΑΝΙΑΣ</span>
                <input className="releaf-input" placeholder="π.χ. Αγορά εξοπλισμού καθαρισμού" style={{ width: '100%', boxSizing: 'border-box', margin: 0 }} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div>
                <span style={labelStyle}>ΠΕΡΙΓΡΑΦΗ ΑΝΑΓΚΩΝ</span>
                <textarea className="releaf-input" placeholder="Περιγράψτε γιατί χρειάζεστε αυτούς τους πόρους..." rows="3" style={{ resize: 'none', padding: '12px', width: '100%', boxSizing: 'border-box', margin: 0 }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div>
                <span style={labelStyle}>ΠΟΣΟ ΣΤΟΧΟΣ (€)</span>
                <input className="releaf-input" type="number" placeholder="π.χ. 500" style={{ width: '100%', boxSizing: 'border-box', margin: 0 }} value={form.goal_amount} onChange={e => setForm({...form, goal_amount: e.target.value})} />
              </div>

              <button className="releaf-button" type="submit" style={{ marginTop: '10px', background: '#4f46e5' }}>Έναρξη Καμπάνιας</button>
              <button className="releaf-button" type="button" style={{ background: 'transparent', border: '1px solid white' }} onClick={onBack}>Ακύρωση</button>
            </form>
          )}
        </>
      )}

      {step === 2 && (
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: result.status === 'success' ? '#8db600' : '#ff4d4d', fontSize: '2rem', margin: '0 0 15px 0' }}>{result.status === 'success' ? 'Επιτυχία!' : 'Σφάλμα!'}</h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: '1.6', marginBottom: '30px' }}>{result.message}</p>
          <button className="releaf-button" onClick={() => { setStep(1); if(result.status === 'success') onBack(); }}>{result.status === 'success' ? 'Επιστροφή στο Dashboard' : 'Δοκιμάστε Ξανά'}</button>
        </div>
      )}
    </div>
  );
}

export default CreateCampaignForm;