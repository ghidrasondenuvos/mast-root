import React, { useState } from 'react';

function CertificatesDashboard({ currentUser }) {
  // ΜΟCK DATA: Βάζουμε "ψεύτικα" δεδομένα για να παίζει κατευθείαν χωρίς το Backend
  const [approvedActions, setApprovedActions] = useState([
    { action_id: 1, action_title: "Δενδροφύτευση στο Ποικίλο Όρος", organisation: "Save Your Hood", has_certificate: false },
    { action_id: 2, action_title: "Καθαρισμός Παραλίας", organisation: "We4All", has_certificate: true }
  ]);

  const [certificates, setCertificates] = useState([
    { id: 101, action_title: "Καθαρισμός Παραλίας", organisation: "We4All", issue_date: new Date().toLocaleDateString('el-GR'), volunteer_name: currentUser?.username || "Εθελοντής" }
  ]);

  const [message, setMessage] = useState('');

  // Ψεύτικη λειτουργία έκδοσης που δουλεύει ακαριαία στο UI
  const issueCertificate = (actionId) => {
    const action = approvedActions.find(a => a.action_id === actionId);
    if (!action) return;

    // Ενημερώνουμε ότι βγήκε
    setApprovedActions(approvedActions.map(a => a.action_id === actionId ? { ...a, has_certificate: true } : a));

    // Φτιάχνουμε το νέο πιστοποιητικό
    const newCert = {
      id: Math.floor(Math.random() * 1000) + 200,
      action_title: action.action_title,
      organisation: action.organisation,
      issue_date: new Date().toLocaleDateString('el-GR'),
      volunteer_name: currentUser?.username || "Εθελοντής"
    };
    
    setCertificates([...certificates, newCert]);
    setMessage('Το πιστοποιητικό εκδόθηκε επιτυχώς!');
    setTimeout(() => setMessage(''), 3000);
  };

  // Ο ΜΗΧΑΝΙΣΜΟΣ ΠΟΥ ΦΤΙΑΧΝΕΙ ΤΟ PDF ΠΑΡΑΜΕΝΕΙ Ο ΙΔΙΟΣ
  const generatePDF = (cert) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Πιστοποιητικό - ${cert.action_title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Playfair+Display:ital,wght@1,600&display=swap');
            body { 
              font-family: 'Montserrat', sans-serif; 
              background: #52525b; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              -webkit-print-color-adjust: exact;
            }
            .certificate {
              background: white;
              width: 900px;
              height: 650px;
              padding: 50px;
              text-align: center;
              border: 15px solid #10b981;
              box-shadow: 0 0 30px rgba(0,0,0,0.5);
              position: relative;
              box-sizing: border-box;
            }
            .certificate::before {
              content: '';
              position: absolute;
              top: 10px; left: 10px; right: 10px; bottom: 10px;
              border: 2px dashed #10b981;
            }
            .logo { font-size: 2.5rem; font-weight: bold; color: #1b181b; letter-spacing: 5px; margin-bottom: 20px; }
            .title { font-family: 'Playfair Display', serif; font-size: 3.5rem; color: #10b981; margin: 0 0 20px 0; }
            .subtitle { font-size: 1.2rem; color: #666; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
            .name { font-family: 'Playfair Display', serif; font-size: 3rem; color: #1b181b; margin: 20px 0; border-bottom: 2px solid #ccc; display: inline-block; padding: 0 50px; }
            .action { font-size: 1.5rem; color: #4f46e5; font-weight: bold; margin: 30px 0; }
            .org { font-size: 1.1rem; color: #555; }
            .footer { position: absolute; bottom: 50px; left: 50px; right: 50px; display: flex; justify-content: space-between; font-size: 0.9rem; color: #888; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="logo">RELEAF</div>
            <h1 class="title">Πιστοποιητικό Εθελοντισμού</h1>
            <div class="subtitle">Απονέμεται Τιμητικά Στον/Στην</div>
            <div class="name">${cert.volunteer_name}</div>
            <div class="org">Για την ανεκτίμητη προσφορά και ενεργή συμμετοχή στην περιβαλλοντική δράση:</div>
            <div class="action">"${cert.action_title}"</div>
            <div class="org">Διοργάνωση: <strong>${cert.organisation}</strong></div>
            <div class="footer">
              <div>Ημερομηνία: ${cert.issue_date}</div>
              <div>Αρ. Πιστοποιητικού: #00${cert.id}</div>
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.95)', padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '900px', height: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#10b981', margin: '0 0 20px 0', fontSize: '1.8rem' }}>
        🏆 Τα Πιστοποιητικά Μου
      </h3>

      {message && <div style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '15px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{message}</div>}

      <div style={{ display: 'flex', gap: '30px', flex: 1, overflow: 'hidden' }}>
        
        {/* ΣΤΗΛΗ 1: ΕΓΚΕΚΡΙΜΕΝΕΣ ΔΡΑΣΕΙΣ */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
          <h4 style={{ color: '#fff', fontFamily: 'var(--font-mono)', marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Ολοκληρωμένες Δράσεις</h4>
          {approvedActions.length === 0 ? <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Δεν έχετε ολοκληρωμένες δράσεις ακόμα.</p> : null}
          
          {approvedActions.map(act => (
            <div key={act.action_id} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #4f46e5' }}>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>{act.action_title}</strong>
              <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Διοργάνωση: {act.organisation}</span>
              <div style={{ marginTop: '10px' }}>
                {act.has_certificate ? (
                  <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Το πιστοποιητικό έχει εκδοθεί</span>
                ) : (
                  <button className="releaf-button" style={{ margin: 0, padding: '5px 10px', fontSize: '0.8rem', background: '#4f46e5' }} onClick={() => issueCertificate(act.action_id)}>
                    Έκδοση Πιστοποιητικού
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ΣΤΗΛΗ 2: ΤΑ ΠΙΣΤΟΠΟΙΗΤΙΚΑ ΜΟΥ */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
          <h4 style={{ color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Διαθέσιμα Πιστοποιητικά</h4>
          {certificates.length === 0 ? <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Δεν έχουν εκδοθεί πιστοποιητικά.</p> : null}
          
          {certificates.map(cert => (
            <div key={cert.id} style={{ background: 'rgba(16,185,129,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#10b981', display: 'block', marginBottom: '5px' }}>{cert.action_title}</strong>
                <span style={{ fontSize: '0.75rem', color: '#ccc' }}>Ημερομηνία: {cert.issue_date}</span>
              </div>
              <button className="releaf-button" style={{ margin: 0, padding: '8px 15px', background: '#10b981', color: 'white' }} onClick={() => generatePDF(cert)}>
                📄 Λήψη PDF
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default CertificatesDashboard;