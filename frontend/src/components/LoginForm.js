import React, { useState } from 'react';

function LoginForm({ onBack, onLoginSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [step, setStep] = useState(1); 
  const [result, setResult] = useState({ status: '', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    
    // ΤΟ ΜΑΓΙΚΟ ΚΟΛΠΟ: Ξε-εστιάζει τα πεδία, οπότε ο Firefox νομίζει ότι η φόρμα υποβλήθηκε κανονικά!
    if (document.activeElement) {
      document.activeElement.blur();
    }

    if (!form.email || !form.password) {
      setResult({ status: 'error', message: 'παρακαλώ συμπληρώστε όλα τα πεδία.' });
      setStep(2);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if(res.ok) {
        setResult({ status: 'success', message: 'επιτυχής σύνδεση! δημιουργία συνεδρίας...' });
        setStep(2);
        setTimeout(() => {
          onLoginSuccess(data.user, data.notifications);
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
    <div style={{ background: 'rgba(27, 24, 27, 0.8)', padding: '40px', borderRadius: '15px', backdropFilter: 'blur(10px)', width: '380px', textAlign: 'center' }}>
      
      {step === 1 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', marginBottom: '20px' }}>σύνδεση</h2>
          <form onSubmit={submit}>
            <input 
              className="releaf-input" 
              type="email" 
              name="email" 
              autoComplete="username" 
              placeholder="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
            <input 
              className="releaf-input" 
              type="password" 
              name="password" 
              autoComplete="current-password" 
              placeholder="password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
            <button className="releaf-button" type="submit" style={{ marginTop: '20px' }}>είσοδος</button>
          </form>
          <br />
          <button className="releaf-button" type="button" style={{ background: 'transparent', border: '1px solid white', marginTop: '10px' }} onClick={onBack}>ακύρωση</button>
        </>
      )}

      {step === 2 && (
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-heading)', 
            color: result.status === 'success' ? '#8db600' : '#ff4d4d', 
            fontSize: '2rem', margin: '0 0 10px 0' 
          }}>
            {result.status === 'success' ? 'επιτυχία!' : 'σφάλμα!'}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: '1.6' }}>
            {result.message}
          </p>
          {result.status === 'error' && (
            <button className="releaf-button" onClick={() => setStep(1)} style={{ marginTop: '30px' }}>
              δοκιμή ξανά
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export default LoginForm;