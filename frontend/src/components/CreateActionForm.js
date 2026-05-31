import React, { useState } from 'react';

function CreateActionForm() {
  const [data, setData] = useState({ title: '', description: '', max_participants: 0 });

  const submitAction = async () => {
    const res = await fetch('http://127.0.0.1:8000/actions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if(res.ok) alert("Δράση δημιουργήθηκε!");
  };

  return (
    <div>
      <input onChange={e => setData({...data, title: e.target.value})} placeholder="Τίτλος" />
      <input onChange={e => setData({...data, description: e.target.value})} placeholder="Περιγραφή" />
      <input type="number" onChange={e => setData({...data, max_participants: e.target.value})} />
      <button onClick={submitAction}>Καταχώρηση Δράσης</button>
    </div>
  );
}
export default CreateActionForm;