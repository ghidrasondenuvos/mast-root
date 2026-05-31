import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function MapClickHandler({ setMarker, setAddress }) {
  useMapEvents({
    click: async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setMarker({ lat, lng });

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=el`);
        const data = await response.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      } catch (error) {
        console.error("Σφάλμα κατά την ανάκτηση διεύθυνσης:", error);
      }
    }
  });
  return null;
}

function CreateActionForm({ currentUser, onBack }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    max_participants: 10,
    location_name: '',
    action_type_name: '' // Πλέον συμπληρώνεται από το dropdown
  });

  const [step, setStep] = useState(1); 
  const [result, setResult] = useState({ status: '', message: '' });
  const [marker, setMarker] = useState(null);

  const submitAction = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.location_name || !form.action_type_name) {
      setResult({ status: 'error', message: 'Παρακαλώ συμπληρώστε όλα τα πεδία της δράσης.' });
      setStep(2);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          creator_user_id: currentUser.id
        })
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ status: 'success', message: data.message });
      } else {
        setResult({ status: 'error', message: data.detail || 'Αποτυχία δημιουργίας δράσης.' });
      }
    } catch (err) {
      setResult({ status: 'error', message: 'Αδυναμία σύνδεσης με τον διακομιστή.' });
    }
    setStep(2);
  };

  const labelStyle = { 
    fontSize: '0.75rem', 
    color: 'var(--accent-color)', 
    marginLeft: '15px', 
    marginBottom: '3px', 
    fontFamily: 'var(--font-mono)',
    display: 'block',
    textAlign: 'left'
  };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.90)', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '500px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center' }}>
      
      {step === 1 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-color)', fontSize: '2rem', margin: '0 0 20px 0' }}>Δημιουργία Δράσης</h2>
          <form onSubmit={submitAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <span style={labelStyle}>ΤΙΤΛΟΣ</span>
              <input 
                className="releaf-input" 
                placeholder="π.χ. Αναδάσωση στο βουνό" 
                style={{ width: '100%', boxSizing: 'border-box', margin: 0 }}
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
              />
            </div>
            
            <div>
              <span style={labelStyle}>ΠΕΡΙΓΡΑΦΗ</span>
              <textarea 
                className="releaf-input" 
                placeholder="Γράψε λίγα λόγια για τη δράση..." 
                rows="2"
                style={{ resize: 'none', padding: '12px', width: '100%', boxSizing: 'border-box', margin: 0 }}
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>ΟΡΙΟ ΕΘΕΛΟΝΤΩΝ</span>
                <input 
                  className="releaf-input" 
                  type="number"
                  style={{ width: '100%', boxSizing: 'border-box', margin: 0 }}
                  value={form.max_participants} 
                  onChange={e => setForm({...form, max_participants: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div style={{ flex: 2 }}>
                <span style={labelStyle}>ΤΥΠΟΣ ΔΡΑΣΗΣ</span>
                
                {/* ΤΟ ΝΕΟ DROPDOWN ΜΕ ΤΙΣ 10 ΕΠΙΛΟΓΕΣ */}
                <select 
                  className="releaf-input" 
                  style={{ width: '100%', boxSizing: 'border-box', margin: 0, appearance: 'none', cursor: 'pointer' }}
                  value={form.action_type_name} 
                  onChange={e => setForm({...form, action_type_name: e.target.value})} 
                >
                  <option value="" disabled>Επιλέξτε Κατηγορία...</option>
                  <option value="Δενδροφύτευση">🌳 Δενδροφύτευση</option>
                  <option value="Καθαρισμός Παραλίας">🏖️ Καθαρισμός Παραλίας</option>
                  <option value="Καθαρισμός Δάσους">🌲 Καθαρισμός Δάσους</option>
                  <option value="Ανακύκλωση / Κυκλική Οικονομία">♻️ Ανακύκλωση / Κυκλική Οικονομία</option>
                  <option value="Προστασία Πανίδας">🦊 Προστασία Πανίδας</option>
                  <option value="Πυροπροστασία / Δασοπροστασία">🔥 Πυροπροστασία / Δασοπροστασία</option>
                  <option value="Διάσωση & Περίθαλψη Ζώων">🐾 Διάσωση & Περίθαλψη Ζώων</option>
                  <option value="Περιβαλλοντική Εκπαίδευση">📚 Περιβαλλοντική Εκπαίδευση</option>
                  <option value="Φροντίδα Αστικού Πρασίνου">🏙️ Φροντίδα Αστικού Πρασίνου</option>
                  <option value="Αποκατάσταση Τοπίου">⛰️ Αποκατάσταση Τοπίου</option>
                </select>

              </div>
            </div>

            <div>
              <span style={labelStyle}>ΤΟΠΟΘΕΣΙΑ (Κάνε κλικ στον χάρτη)</span>
              <input 
                className="releaf-input" 
                placeholder="Πληκτρολόγησε ή επίλεξε από κάτω" 
                style={{ width: '100%', boxSizing: 'border-box', margin: 0 }}
                value={form.location_name} 
                onChange={e => setForm({...form, location_name: e.target.value})} 
              />
            </div>
            
            <div style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', marginTop: '-5px' }}>
              <MapContainer center={[38.246242, 21.735084]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapClickHandler 
                  setMarker={setMarker} 
                  setAddress={(address) => setForm({...form, location_name: address})} 
                />
                {marker && <Marker position={marker} icon={markerIcon} />}
              </MapContainer>
            </div>

            <button className="releaf-button" type="submit" style={{ marginTop: '10px' }}>Υποβολή Δράσης</button>
            <button className="releaf-button" type="button" style={{ background: 'transparent', border: '1px solid white' }} onClick={onBack}>Ακύρωση</button>
          </form>
        </>
      )}

      {step === 2 && (
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: result.status === 'success' ? '#8db600' : '#ff4d4d', fontSize: '2rem', margin: '0 0 15px 0' }}>
            {result.status === 'success' ? 'Επιτυχία!' : 'Σφάλμα!'}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: '1.6', marginBottom: '30px' }}>
            {result.message}
          </p>
          <button className="releaf-button" onClick={() => { setStep(1); if(result.status === 'success') onBack(); }}>
            {result.status === 'success' ? 'Επιστροφή στο Dashboard' : 'Δοκιμάστε Ξανά'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CreateActionForm;