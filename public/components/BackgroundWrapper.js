import React from 'react';
import './BackgroundWrapper.css';

function BackgroundWrapper({ blur, tint, children }) {
  return (
    <div className="bg-container">
      <div className="bg-image" style={{ filter: `blur(${blur}px)`, backgroundColor: tint }} />
      <div className="content">{children}</div>
    </div>
  );
}
export default BackgroundWrapper;