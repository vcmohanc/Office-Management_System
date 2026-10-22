import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import PaymentStatus from './components/account/PaymentStatus';
import PaymentEntry from './components/account/PaymentEntry';
import { Toaster } from 'react-hot-toast';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const location = useLocation();

  // Control robots indexing dynamically: allow landing page, protect internal pages
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    if (location.pathname === '/') {
      metaRobots.setAttribute('content', 'index, follow');
    } else {
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');
    }
  }, [location.pathname]);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiUrl}/api/auth/me`, {
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
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login setToken={setToken} />} />
        <Route 
          path="/dashboard/*" 
          element={token ? <Dashboard setToken={setToken} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/payments/status/:caseId" 
          element={token ? <PaymentStatus /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/payments/entry/:caseId" 
          element={token ? <PaymentEntry /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/payments/entry/:caseId/term/:termNumber" 
          element={token ? <PaymentEntry /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </>
  );
}

export default App;
