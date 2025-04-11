import React from 'react';
import './desktop-layout.css'; // We'll create this CSS file next

function DesktopLayout({ sidebar, children }) {
  return (
    <div className="desktop-layout">
      <aside className="desktop-layout__sidebar">
        {sidebar}
      </aside>
      <main className="desktop-layout__content">
        {children}
      </main>
    </div>
  );
}

export default DesktopLayout; 