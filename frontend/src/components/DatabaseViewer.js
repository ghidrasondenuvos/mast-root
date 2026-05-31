import React, { useEffect, useState } from 'react';

function DatabaseViewer({ onBack }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/db-view')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ background: 'rgba(27, 24, 27, 0.95)', padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '1000px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', textAlign: 'center', marginBottom: '30px' }}>
        βάση δεδομένων
      </h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'separate', borderSpacing: '0 8px', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>
              <th style={{ padding: '10px 15px' }}>id</th>
              <th style={{ padding: '10px 15px' }}>username</th>
              <th style={{ padding: '10px 15px' }}>password</th>
              <th style={{ padding: '10px 15px' }}>email</th>
              <th style={{ padding: '10px 15px' }}>ονοματεπώνυμο</th>
              <th style={{ padding: '10px 15px' }}>τύπος λογ.</th>
              <th style={{ padding: '10px 15px' }}>δεξιότητες</th>
              <th style={{ padding: '10px 15px' }}>μέσα</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr 
                key={u.id} 
                style={{ background: 'rgba(0,0,0,0.5)', transition: 'background 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(166,124,82,0.15)'} 
                onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.5)'}
              >
                <td style={{ padding: '15px', borderRadius: '10px 0 0 10px' }}>{u.id}</td>
                <td style={{ padding: '15px' }}>{u.username}</td>
                <td style={{ padding: '15px', color: '#a67c52' }}>{u.password}</td>
                <td style={{ padding: '15px' }}>{u.email}</td>
                <td style={{ padding: '15px' }}>{u.full_name}</td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{u.account_type}</td>
                <td style={{ padding: '15px' }}>{u.skills}</td>
                <td style={{ padding: '15px', borderRadius: '0 10px 10px 0' }}>{u.resources}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className="releaf-button" onClick={onBack}>επιστροφή</button>
      </div>
    </div>
  );
}
export default DatabaseViewer;