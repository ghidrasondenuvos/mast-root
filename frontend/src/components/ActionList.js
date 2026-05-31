// frontend/src/components/ActionList.js
import React, { useEffect, useState } from 'react';

function ActionList() {
    const [actions, setActions] = useState([]);

    useEffect(() => {
        // Κλήση στο Python API σας
        fetch('http://127.0.0.1:8000/actions')
            .then(res => res.json())
            .then(data => setActions(data));
    }, []);

    return (
        <div>
            <h1>Οθόνη Περιβαλλοντικών Δράσεων</h1>
            {/* Εδώ εμφανίζετε τις δράσεις */}
        </div>
    );
}

export default ActionList;