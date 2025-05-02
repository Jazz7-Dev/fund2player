// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DonorDashboard from './components/DonorDashboard';
import AthleteDashboard from './components/AthleteDashboard';
import CampaignForm from './components/CampaignForm';

export default function App() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (loginResponse) => {
    const userRole = loginResponse.user?.role || null;
    setRole(userRole);
    if (userRole) {
      navigate(`/${userRole}`);
    }
    localStorage.setItem('user', JSON.stringify(loginResponse.user));

  };

  return (
    <Routes>
      {/* <AdminDashboard /> */}
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/admin" element={<AdminDashboard /> } />
      <Route path="/donor" element={role==='donor'? <DonorDashboard /> : <Navigate to="/" />} />
      <Route path="/athlete" element={role==='athlete'? <AthleteDashboard /> : <Navigate to="/" />} />
      <Route path="/athlete/create" element={role==='athlete'? <CampaignForm /> : <Navigate to="/" />} />
    
    </Routes>
    
  );
}
