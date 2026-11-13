import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        if (res.status === 504) {
          throw new Error('サーバーの応答がタイムアウトしました。しばらく待ってからもう一度お試しください。(HTTP 504)');
        }
        if (res.status === 502 || res.status === 503) {
          throw new Error(`サーバーに接続できません。しばらく待ってからもう一度お試しください。(HTTP ${res.status})`);
        }
        throw new Error(data?.error || data?.message || `ログインに失敗しました (HTTP ${res.status})`);
      }

      if (!data || !data.token) {
        throw new Error(`Server returned invalid response (HTTP ${res.status}).`);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('サーバーの応答がタイムアウトしました。しばらく待ってからもう一度お試しください。');
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-6 sm:p-10 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center overflow-hidden mb-2">
            <img src="/logo.png" alt="OMS Logo" className="h-12 w-auto object-contain" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            OMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ダッシュボードにアクセスするにはサインインしてください
          </p>
        </div>
        
        {showForgotMessage && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm text-blue-700">
              <strong>パスワードの復旧:</strong><br />
              パスワードのリセットについては、システム管理者にお問い合わせください。管理者は、管理者ダッシュボードから直接新しいパスワードを割り当てることができます。
            </p>
          </div>
        )}

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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowForgotMessage(!showForgotMessage)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                パスワードをお忘れですか？
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {isLoading ? 'サインイン中...' : 'サインイン'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
