import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Edit2, Check, X } from 'lucide-react';

export default function AdminUserList({ setActiveTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', role: '', password: '' });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({ username: user.username, role: user.role, password: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ username: '', role: '', password: '' });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    setUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.map(u => u._id === id ? data : u));
        setEditingId(null);
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Server error. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button 
        onClick={() => setActiveTab('Dashboard')}
        className="flex items-center text-sm text-gray-500 hover:text-[#162D50] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-[#162D50] text-white rounded-lg mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#162D50]">User List</h1>
              <p className="text-sm text-gray-500">Manage all registered users in the system.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('Admin New Registration')}
            className="px-4 py-2 bg-[#162D50] text-white text-sm font-medium rounded-md hover:bg-[#0f1f38] transition-colors"
          >
            Add New User
          </button>
        </div>

        <div className="p-0">
          {error && (
            <div className="m-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Password</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          {editingId === user._id ? (
                            <input 
                              type="text" 
                              name="username"
                              value={editForm.username}
                              onChange={handleEditChange}
                              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full"
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{user.username}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {editingId === user._id ? (
                            <select
                              name="role"
                              value={editForm.role}
                              onChange={handleEditChange}
                              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full"
                            >
                              <option value="account">Account Department</option>
                              <option value="hr">HR Department</option>
                              <option value="support">Support Department</option>
                              <option value="admin">System Admin</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                              ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                user.role === 'hr' ? 'bg-blue-100 text-blue-800' : 
                                user.role === 'support' ? 'bg-green-100 text-green-800' : 
                                'bg-orange-100 text-orange-800'}`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {editingId === user._id ? (
                            <input
                              type="password"
                              name="password"
                              value={editForm.password}
                              onChange={handleEditChange}
                              placeholder="New password..."
                              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full"
                            />
                          ) : (
                            <span className="text-gray-400 italic text-xs">Hidden</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {editingId === user._id ? (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => saveEdit(user._id)}
                                disabled={updateLoading}
                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={cancelEdit}
                                disabled={updateLoading}
                                className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEdit(user)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
