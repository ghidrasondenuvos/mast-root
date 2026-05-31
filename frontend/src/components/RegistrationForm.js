import React, { useState } from 'react';

function RegistrationForm({ onBack, onComplete }) {
  const initialFormState = { username: '', email: '', password: '', full_name: '', account_type: 'volunteer', skills: '', resources: '' };
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState(''); 

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.full_name || !form.username || !form.email || !form.password) {
      setErrorMessage('παρακαλώ συμπληρώστε όλα τα προσωπικά στοιχεία.');
      return;
    }
    if (form.full_name.length < 2) return setErrorMessage('το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
    if (form.username.length < 2) return setErrorMessage('το username πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
    if (form.password.length < 4) return setErrorMessage('το password πρέπει να έχει τουλάχιστον 4 χαρακτήρες.');
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      setErrorMessage('το email πρέπει να έχει ΜΟΝΟ αγγλικούς χαρακτήρες, ένα "@" και ένα "."');
      return;
    }

    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.skills || !form.resources) {
      setErrorMessage('παρακαλώ συμπληρώστε τις δεξιότητες και τα μέσα.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if(res.ok) {
        setStep(3);
        onComplete();
      } else {
        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        if (["username", "email", "password", "full_name"].includes(errorMsg) || errorMsg.includes("Email") || errorMsg.includes("Username")) {
          setStep(1);
        }
        setErrorMessage(`σφάλμα: ${errorMsg}`);
      }
    } catch (err) {
      setErrorMessage("σφάλμα: δεν υπάρχει σύνδεση με το backend.");
    }
  };

  const errorStyle = { color: '#ff4d4d', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginTop: '10px', minHeight: '20px' };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.8)', padding: '40px', borderRadius: '15px', backdropFilter: 'blur(10px)', width: '380px', textAlign: 'center' }}>
      
      {step !== 3 && (
        <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)' }}>
          {step === 1 ? 'προσωπικά στοιχεία' : 'συμπληρωματικά στοιχεία'}
        </h2>
      )}
      
      {step === 1 && (
        <form onSubmit={handleNext}>
          {/* autoComplete="off" και αλλαγμένα ονόματα για να μην τα πειράζει ο Firefox! */}
          <input className="releaf-input" type="text" name="reg_fullname" autoComplete="off" placeholder="ονοματεπώνυμο" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          <input className="releaf-input" type="text" name="reg_user_id" autoComplete="off" placeholder="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          
          <input className="releaf-input" type="email" name="email" autoComplete="username" placeholder="email (π.χ. test@test.com)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input className="releaf-input" type="password" name="password" autoComplete="new-password" placeholder="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <div style={errorStyle}>{errorMessage}</div>
          <button className="releaf-button" type="submit" style={{ marginTop: '15px' }}>επόμενο</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submit}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>
            επίλεξε τον ρόλο που σου ταιριάζει.<br/>
            αν είσαι εθελοντής, δήλωσε τις γνώσεις σου.<br/>
            αλλιώς, μπορείς να βοηθήσεις το έργο μας<br/>
            ως οργανισμός ή ως χορηγός.
          </div>
          <select className="releaf-input" value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})} style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', textAlign: 'center', cursor: 'pointer' }}>
            <option value="volunteer">εθελοντής</option>
            <option value="organization">οργανισμός</option>
            <option value="sponsor">χορηγός</option>
          </select>
          <input className="releaf-input" placeholder="δεξιότητες (π.χ. κηπουρική, pr)" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
          <input className="releaf-input" placeholder="διαθέσιμα μέσα (π.χ. οχήματα, budget)" value={form.resources} onChange={e => setForm({...form, resources: e.target.value})} />
          <div style={errorStyle}>{errorMessage}</div>
          <button className="releaf-button" type="submit" style={{ marginTop: '15px' }}>υποβολή εγγραφής</button>
        </form>
      )}

      {step === 3 && (
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#8db600', fontSize: '2rem', margin: '0 0 10px 0' }}>επιτυχία!</h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: '1.6' }}>ο λογαριασμός σας δημιουργήθηκε.<br/>καλώς ήρθατε στο releaf.</p>
          <button className="releaf-button" onClick={() => { setForm(initialFormState); setStep(1); onBack(); }} style={{ marginTop: '30px' }}>επιστροφή στο μενού</button>
        </div>
      )}
      
      {step !== 3 && (
        <>
          <br />
          <button className="releaf-button" type="button" style={{ background: 'transparent', border: '1px solid white', marginTop: '10px' }} onClick={() => { setForm(initialFormState); setErrorMessage(''); setStep(1); onBack(); }}>ακύρωση</button>
        </>
      )}
    </div>
  );
}
export default RegistrationForm;