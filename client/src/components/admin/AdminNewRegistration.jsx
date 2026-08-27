import React, { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

export default function AdminNewRegistration({ setActiveTab }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: ROLES.APPLICANT
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
      setError('パスワードが一致しません');
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
        setMessage(`ユーザー「${formData.username}」を登録しました`);
        setFormData({ username: '', password: '', confirmPassword: '', role: ROLES.APPLICANT });
      } else {
        setError(data.error || '登録に失敗しました');
      }
    } catch (err) {
      setError('サーバーエラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => setActiveTab('admin-home')}
        className="flex items-center text-sm text-gray-500 hover:text-[#162D50] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        ホームに戻る
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="p-2 bg-[#162D50] text-white rounded-lg mr-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#162D50]">ユーザー新規登録</h1>
            <p className="text-sm text-gray-500">新しいアカウントを作成し、役割を割り当てます。</p>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">ユーザー名</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：jsmith"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">役割</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.values(ROLES).map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">パスワード</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを入力"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">パスワード（確認）</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを再入力"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 bg-[#162D50] text-white font-medium rounded-md hover:bg-[#0f1f38] transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? '登録中...' : 'ユーザーを登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
