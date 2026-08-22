import React, { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function AdminNewRegistration({ setActiveTab }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'account'
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`User '${formData.username}' registered successfully!`);
        setFormData({ username: '', password: '', confirmPassword: '', role: 'account' });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button 
        onClick={() => setActiveTab('Dashboard')}
        className="flex items-center text-sm text-gray-500 hover:text-[#162D50] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="p-2 bg-[#162D50] text-white rounded-lg mr-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#162D50]">New User Registration</h1>
            <p className="text-sm text-gray-500">Create a new account and assign a department role.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-medium">
              {message}
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. jsmith"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role / Department</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="account">Account Department</option>
                <option value="hr">HR Department</option>
                <option value="support">Support Department</option>
                <option value="admin">System Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-6 py-2.5 bg-[#162D50] text-white font-medium rounded-md hover:bg-[#0f1f38] transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Registering...' : 'Register User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
