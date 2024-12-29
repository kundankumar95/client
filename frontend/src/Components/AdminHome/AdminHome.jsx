import React from 'react';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import Sidebar from '../Sidebar/Sidebar';
import './AdminHome.css';

const AdminHome = () => {
  return (
    <div className="admin-home-container">
      <AdminNavbar />
      <div className="admin-main">
        <Sidebar />
        <div className="admin-content"></div>
      </div>
    </div>
  );
};

export default AdminHome;
