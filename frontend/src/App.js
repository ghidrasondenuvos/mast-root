import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState("Ελέγχουμε τη σύνδεση...");

  useEffect(() => {
    fetch('http://127.0.0.1:8000/test-connection')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => setMessage("Σφάλμα σύνδεσης: " + error.message));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Backend Status:</h1>
      <p style={{ fontSize: '24px', color: 'blue' }}>{message}</p>
    </div>
  );
}

export default App;