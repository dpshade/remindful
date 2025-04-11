import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css'; // We'll create this CSS file next

function Sidebar() {
  return (
    <nav className="sidebar-nav">
      <h2>Navigation</h2>
      <ul>
        <li>
          <Link to="/">Review</Link>
        </li>
        {/* Add link for CatalogPage if re-enabled */}
        {/* <li>
          <Link to="/catalog">Catalog</Link>
        </li> */}
        <li>
          <Link to="/settings">Settings</Link>
        </li>
        {/* Add more navigation links as needed */}
      </ul>
    </nav>
  );
}

export default Sidebar; 