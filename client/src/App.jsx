import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Token validation error:', error);
        }
      }
    };
    validateToken();
  }, [token]);

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
