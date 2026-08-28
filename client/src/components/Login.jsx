import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '../constants/roles';

// プロトタイプ用のハードコードされたログイン情報（バックエンド接続なし）
const DEMO_ACCOUNTS = {
  admin: { password: 'password123', role: ROLES.ADMIN },
  reviewer_user: { password: 'password123', role: ROLES.REVIEWER },
  accounting_user: { password: 'password123', role: ROLES.ACCOUNTING },
  applicant_user: { password: 'password123', role: ROLES.APPLICANT },
};

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const account = DEMO_ACCOUNTS[username];
    if (!account || account.password !== password) {
      setError('ユーザー名またはパスワードが正しくありません');
      return;
    }

    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify({ username, role: account.role }));
    setToken('demo-token');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-[#162D50] rounded-lg flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#162D50]">
            立替・精算管理システム
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ログインしてダッシュボードにアクセスしてください
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="sr-only">ユーザー名</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50] focus:z-10 sm:text-sm"
                placeholder="ユーザー名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only">パスワード</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50] focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#0A192F] hover:bg-[#162D50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#162D50] transition-colors shadow-sm"
            >
              ログイン
            </button>
          </div>
        </form>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-500 mb-2">プロトタイプ用デモアカウント（パスワード共通：password123）</p>
          <ul className="text-xs text-gray-500 space-y-1">
            {Object.entries(DEMO_ACCOUNTS).map(([username, { role }]) => (
              <li key={username} className="flex justify-between">
                <span className="font-mono">{username}</span>
                <span>{ROLE_LABELS[role]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
