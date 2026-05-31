import React, { useState } from 'react';

function ProfileEditForm({ currentUser, onBack, onUpdateSuccess, onLogout }) {
  // Αρχικοποιούμε τη φόρμα με τα ΗΔΗ ΥΠΑΡΧΟΝΤΑ στοιχεία
  const [form, setForm] = useState({
    user_id: currentUser.id,
    username: currentUser.username || '',
    email: currentUser.email || '',
    password: currentUser.password || '',
    full_name: currentUser.full_name || '',
    account_type: currentUser.account_type || 'volunteer',
    skills: currentUser.skills || '',
    resources: currentUser.resources || ''
  });
  
  const [step, setStep] = useState(1);
  const [result, setResult] = useState({ status: '', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    
    if (!form.full_name || !form.username || !form.email || !form.password || !form.skills || !form.resources) {
      setResult({ status: 'error', message: 'παρακαλώ συμπληρώστε όλα τα πεδία.' });
      setStep(2);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/update-profile', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if(res.ok) {
        setResult({ status: 'success', message: 'επιτυχής τροποποίηση!' });
        setStep(2);
        setTimeout(() => {
          onUpdateSuccess(data.user);
        }, 1500);
      } else {
        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        setResult({ status: 'error', message: errorMsg });
        setStep(2);
      }
    } catch (err) {
      setResult({ status: 'error', message: "δεν υπάρχει σύνδεση με τον διακομιστή." });
      setStep(2);
    }
  };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.95)', padding: '40px', borderRadius: '15px', backdropFilter: 'blur(10px)', width: '380px', textAlign: 'center' }}>
      
      {step === 1 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', marginBottom: '20px' }}>επεξεργασία προφίλ</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input className="releaf-input" placeholder="ονοματεπώνυμο" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}/>
            <input className="releaf-input" placeholder="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}/>
            <input className="releaf-input" type="email" placeholder="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}/>
            <input className="releaf-input" type="text" placeholder="νέος κωδικός" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}/>
            
            <select className="releaf-input" value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})} style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', textAlign: 'center', cursor: 'pointer', margin: 0, width: '100%', boxSizing: 'border-box' }}>
              <option value="volunteer">εθελοντής</option>
              <option value="organization">οργανισμός</option>
              <option value="sponsor">χορηγός</option>
            </select>

            <input className="releaf-input" placeholder="δεξιότητες" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}/>
            <input className="releaf-input" placeholder="διαθέσιμα μέσα" value={form.resources} onChange={e => setForm({...form, resources: e.target.value})} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}/>
            
            <button className="releaf-button" type="submit" style={{ marginTop: '15px' }}>αποθήκευση αλλαγών</button>
          </form>
          
          <button className="releaf-button" type="button" style={{ background: 'transparent', border: '1px solid white', marginTop: '10px' }} onClick={onBack}>ακύρωση</button>

          {/* ΝΕΟ: Κουμπί Αποσύνδεσης (Logout) */}
          <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              className="releaf-button" 
              type="button" 
              style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', width: '100%', margin: 0, boxSizing: 'border-box', fontWeight: 'bold' }} 
              onClick={onLogout}
            >
              αποσύνδεση
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: result.status === 'success' ? '#8db600' : '#ff4d4d', fontSize: '2rem', margin: '0 0 10px 0' }}>
            {result.status === 'success' ? 'επιτυχής τροποποίηση!' : 'αποτυχία!'}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: '1.6' }}>{result.message}</p>
          {result.status === 'error' && (
            <button className="releaf-button" onClick={() => setStep(1)} style={{ marginTop: '30px' }}>δοκιμή ξανά</button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileEditForm;