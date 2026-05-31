import React, { useEffect, useState } from 'react';

function DatabaseViewer({ onBack }) {
  const [users, setUsers] = useState([]);
  const [actions, setActions] = useState([]);
  const [requests, setRequests] = useState([]); 
  const [activeTab, setActiveTab] = useState('users'); 

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/db-view')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));

    fetch('http://127.0.0.1:8000/api/db-actions')
      .then(res => res.json())
      .then(data => setActions(data))
      .catch(err => console.error(err));

    fetch('http://127.0.0.1:8000/api/db-requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.error(err));
  }, []);

  const thStyle = { padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.2)' };
  const tdStyle = { padding: '8px 10px', fontSize: '0.85rem' };

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.95)', padding: '20px', borderRadius: '15px', width: '95%', maxWidth: '1200px', height: '80vh', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', margin: 0, fontSize: '1.5rem' }}>
          🛠️ db admin
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            style={{ padding: '5px 15px', background: activeTab === 'users' ? 'var(--accent-color)' : 'transparent', color: '#fff', border: '1px solid var(--accent-color)', borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }} 
            onClick={() => setActiveTab('users')}
          >
            Χρήστες
          </button>
          <button 
            style={{ padding: '5px 15px', background: activeTab === 'actions' ? '#10b981' : 'transparent', color: '#fff', border: '1px solid #10b981', borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }} 
            onClick={() => setActiveTab('actions')}
          >
            Δράσεις
          </button>
          <button 
            style={{ padding: '5px 15px', background: activeTab === 'requests' ? '#4f46e5' : 'transparent', color: '#fff', border: '1px solid #4f46e5', borderRadius: '5px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }} 
            onClick={() => setActiveTab('requests')}
          >
            Αιτήσεις
          </button>
        </div>

        <button className="releaf-button" style={{ padding: '5px 15px', fontSize: '0.9rem' }} onClick={onBack}>κλείσιμο</button>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)' }}>
          
          {activeTab === 'users' && (
            <>
              <thead style={{ position: 'sticky', top: 0, background: '#1b181b', zIndex: 1 }}>
                <tr style={{ color: 'var(--accent-color)', fontSize: '0.85rem' }}>
                  <th style={thStyle}>id</th>
                  <th style={thStyle}>username</th>
                  <th style={thStyle}>password</th>
                  <th style={thStyle}>email</th>
                  <th style={thStyle}>full_name</th>
                  <th style={thStyle}>type</th>
                  <th style={thStyle}>skills</th>
                  <th style={thStyle}>resources</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(166,124,82,0.15)'} onMouseLeave={e => e.currentTarget.style.background= index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)'}>
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.username}</td>
                    <td style={{ ...tdStyle, color: '#ff4d4d' }}>{u.password}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>{u.full_name}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{u.account_type}</td>
                    <td style={tdStyle}>{u.skills}</td>
                    <td style={tdStyle}>{u.resources}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {activeTab === 'actions' && (
            <>
              <thead style={{ position: 'sticky', top: 0, background: '#1b181b', zIndex: 1 }}>
                <tr style={{ color: '#10b981', fontSize: '0.85rem' }}>
                  <th style={thStyle}>id</th>
                  <th style={thStyle}>τίτλος</th>
                  <th style={thStyle}>περιγραφή</th>
                  <th style={thStyle}>συμμετέχοντες</th>
                  <th style={thStyle}>τοποθεσία</th>
                  <th style={thStyle}>τύπος</th>
                  <th style={thStyle}>προφίλ</th> {/* ΑΛΛΑΓΗ ΕΔΩ ΑΠΟ "οργανισμός" σε "προφίλ" */}
                </tr>
              </thead>
              <tbody>
                {actions.map((a, index) => (
                  <tr key={a.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.15)'} onMouseLeave={e => e.currentTarget.style.background= index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)'}>
                    <td style={tdStyle}>{a.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{a.title}</td>
                    <td style={{ ...tdStyle, color: '#aaa', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.description}>{a.description}</td>
                    <td style={tdStyle}>{a.max_participants}</td>
                    <td style={tdStyle}>{a.location}</td>
                    <td style={tdStyle}>{a.action_type}</td>
                    <td style={{ ...tdStyle, color: '#10b981' }}>{a.organisation}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <thead style={{ position: 'sticky', top: 0, background: '#1b181b', zIndex: 1 }}>
                <tr style={{ color: '#4f46e5', fontSize: '0.85rem' }}>
                  <th style={thStyle}>id</th>
                  <th style={thStyle}>εθελοντής</th>
                  <th style={thStyle}>τίτλος δράσης</th>
                  <th style={thStyle}>κατάσταση (status)</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Δεν βρέθηκαν αιτήσεις.</td></tr>
                ) : (
                  requests.map((r, index) => (
                    <tr key={r.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(79, 70, 229, 0.15)'} onMouseLeave={e => e.currentTarget.style.background= index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)'}>
                      <td style={tdStyle}>{r.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{r.volunteer_name}</td>
                      <td style={tdStyle}>{r.action_title}</td>
                      <td style={{ 
                        ...tdStyle, 
                        color: r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ff4d4d' : '#fbbf24',
                        fontWeight: 'bold'
                      }}>
                        {r.status.toUpperCase()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}

        </table>
      </div>
    </div>
  );
}

export default DatabaseViewer;