import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Join from './pages/Join.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join/:code" element={<Join />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;