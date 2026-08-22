import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login setToken={setToken} />} />
      <Route 
        path="/dashboard/*" 
        element={token ? <Dashboard setToken={setToken} /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}

export default App;
