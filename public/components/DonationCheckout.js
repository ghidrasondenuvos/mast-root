import React, { useState } from 'react';

function DonationCheckout({ currentUser, campaign, onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: '', card_number: '', expiry: '', cvv: '', card_name: '' });
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setStatus('processing');
    setMessage('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsor_id: currentUser.id,
          campaign_id: campaign.id,
          amount: parseInt(form.amount),
          card_number: form.card_number
        })
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setReceipt(data.receipt);
        setTimeout(() => onSuccess(), 3000); // Κλείνει μετά από 3 δευτερόλεπτα
      } else {
        setStatus('error');
        setMessage(data.detail || 'Αποτυχία πληρωμής.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px', boxSizing: 'border-box',
    border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem',
    marginBottom: '15px', fontFamily: 'var(--font-mono)'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      
      <div style={{ background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '12px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: '#1b181b', fontSize: '1.8rem' }}>RELEAF Pay</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            Χρηματοδότηση: <strong>{campaign.title}</strong>
          </p>
        </div>

        {status === 'idle' || status === 'error' ? (
          <form onSubmit={handlePayment}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#666', fontWeight: 'bold' }}>€</span>
              <input type="number" required placeholder="Ποσό Δωρεάς" style={{ ...inputStyle, paddingLeft: '35px', fontWeight: 'bold', fontSize: '1.2rem' }} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} min="1" />
            </div>

            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#495057', marginBottom: '5px', fontWeight: 'bold' }}>Στοιχεία Κάρτας</label>
              <input type="text" required placeholder="Αριθμός Κάρτας (16 ψηφία)" style={inputStyle} value={form.card_number} onChange={e => setForm({...form, card_number: e.target.value})} maxLength="16" />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" required placeholder="MM/YY" style={{ ...inputStyle, marginBottom: 0 }} value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} maxLength="5" />
                <input type="text" required placeholder="CVC" style={{ ...inputStyle, marginBottom: 0 }} value={form.cvv} onChange={e => setForm({...form, cvv: e.target.value})} maxLength="3" />
              </div>
            </div>
            
            <input type="text" required placeholder="Όνομα Κατόχου (όπως αναγράφεται)" style={inputStyle} value={form.card_name} onChange={e => setForm({...form, card_name: e.target.value})} />

            {status === 'error' && (
              <div style={{ color: '#d93025', background: '#fce8e6', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                {message}
              </div>
            )}

            <button type="submit" style={{ width: '100%', padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
              Πληρωμή {form.amount ? `€${form.amount}` : ''}
            </button>
            
            <button type="button" onClick={onClose} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#666', border: 'none', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
              Ακύρωση
            </button>
          </form>
        ) : status === 'processing' ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #10b981', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '20px', color: '#666', fontFamily: 'var(--font-mono)' }}>Επεξεργασία πληρωμής...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>✅</div>
            <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Επιτυχής Δωρεά!</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>{message}</p>
            <p style={{ color: '#999', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Κωδικός Απόδειξης: {receipt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DonationCheckout;