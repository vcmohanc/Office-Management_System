import React, { useState } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Settings({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to update password.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#162D50] mb-6">Account Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="font-semibold text-gray-700">Profile Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center text-[#162D50] font-bold text-2xl uppercase shadow-sm">
                {user?.username ? user.username.substring(0, 2) : 'US'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 capitalize">{user?.username || 'User'}</h3>
                <p className="text-gray-500 capitalize">{user?.role === 'admin' ? 'System Administrator' : `${user?.role} Department`}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                value={user?.username || ''} 
                disabled 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role / Department</label>
              <input 
                type="text" 
                value={user?.role || ''} 
                disabled 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed capitalize"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              Profile details are currently managed by the system administrator.
            </p>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Lock className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="font-semibold text-gray-700">Change Password</h2>
          </div>
          <div className="p-6">
            {status.message && (
              <div className={`mb-4 p-3 rounded-md flex items-start text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> : <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center px-4 py-2 bg-[#162D50] text-white rounded-md hover:bg-[#203a63] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
