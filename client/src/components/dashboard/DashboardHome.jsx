import React, { useState, useEffect } from 'react';
import {
  Users, Server, PlusCircle, Settings, List, Activity,
  CheckCircle, Clock, AlertTriangle, Monitor, FileWarning,
  RotateCcw, Tags, TrendingUp
} from 'lucide-react';
import { ROLE_LABELS } from '../../constants/roles';

export default function DashboardHome({ setActiveTab }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setTotalUsers(data.length);
          setRecentUsers(data.slice(0, 5)); // 直近5件
        }
      } catch (err) {
        console.error("ユーザーの取得に失敗しました", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50]">システム概要</h2>
          <p className="text-sm text-gray-500 mt-1">おかえりなさい、管理者様。本日の状況をお知らせします。</p>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>{new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-blue-800">ユーザー総数</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {loading ? <span className="animate-pulse">...</span> : totalUsers}
          </p>
          <p className="text-xs font-medium text-blue-600 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> 全役割で有効
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-green-800">システム状態</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="text-green-600 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">稼働中</p>
          <p className="text-xs font-medium text-green-600 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" /> 稼働率99.9%を維持
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 border border-orange-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-orange-800">セキュリティアラート</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
          <p className="text-xs font-medium text-orange-600 flex items-center">
            ログイン失敗はありません
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border border-purple-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-purple-800">アクティブセッション</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Monitor className="text-purple-600 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">14</p>
          <p className="text-xs font-medium text-purple-600 flex items-center">
            <Activity className="w-3 h-3 mr-1" /> 利用のピーク時間帯
          </p>
        </div>
      </div>

      {/* Case Summaries */}
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">立替案件の状況（モックデータ）</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-blue-300 transition-colors cursor-default">
          <div className="flex items-center mb-4">
            <FileWarning className="text-blue-500 w-5 h-5 mr-2" />
            <h4 className="font-bold text-gray-800">未処理案件数</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">未処理</span>
              <span className="font-semibold text-orange-500">18</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">処理中</span>
              <span className="font-semibold">42</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">保留</span>
              <span className="font-semibold text-yellow-500">5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-red-300 transition-colors cursor-default">
          <div className="flex items-center mb-4">
            <RotateCcw className="text-red-500 w-5 h-5 mr-2" />
            <h4 className="font-bold text-gray-800">差戻し件数</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">今週の差戻し</span>
              <span className="font-semibold text-red-500">3</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">再申請待ち</span>
              <span className="font-semibold text-orange-500">2</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">添付不足</span>
              <span className="font-semibold text-red-500">7</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-purple-300 transition-colors cursor-default">
          <div className="flex items-center mb-4">
            <Tags className="text-purple-500 w-5 h-5 mr-2" />
            <h4 className="font-bold text-gray-800">種別マスタ件数</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">有効な種別</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">停止中の種別</span>
              <span className="font-semibold text-gray-400">0</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">今月の更新</span>
              <span className="font-semibold text-blue-600">1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content (Table) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">最近登録されたユーザー</h3>
            <button
              onClick={() => setActiveTab('admin-user-list')}
              className="text-xs font-medium text-[#162D50] hover:underline"
            >
              ユーザー一覧を見る
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-5 text-xs font-medium text-gray-500">ユーザー名</th>
                  <th className="py-3 px-5 text-xs font-medium text-gray-500">役割</th>
                  <th className="py-3 px-5 text-xs font-medium text-gray-500">登録日</th>
                  <th className="py-3 px-5 text-xs font-medium text-gray-500 text-right">状態</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">読み込み中...</td>
                  </tr>
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">ユーザーが見つかりません。</td>
                  </tr>
                ) : (
                  recentUsers.map(u => (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5 font-medium text-gray-800">{u.username}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'reviewer' ? 'bg-amber-100 text-amber-800' :
                              u.role === 'applicant' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'}`}>
                            {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-gray-500">{new Date(u.createdAt).toLocaleDateString('ja-JP')}</td>
                      <td className="py-4 px-5 text-right">
                        <span className="inline-flex items-center text-xs font-medium text-green-600">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                          有効
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Content (Panels) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">クイックアクション</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('admin-new-registration')}
                className="w-full flex items-center justify-center bg-[#162D50] hover:bg-[#0f1f38] text-white py-2.5 px-4 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                ユーザーを新規登録
              </button>
              <button
                onClick={() => setActiveTab('admin-user-list')}
                className="w-full flex items-center justify-center bg-[#E2E8F0] hover:bg-gray-300 text-[#4A5568] py-2.5 px-4 rounded-md text-sm font-medium transition-colors"
              >
                <List className="w-4 h-4 mr-2" />
                ユーザーを管理
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="w-full flex items-center justify-center bg-[#E2E8F0] hover:bg-gray-300 text-[#4A5568] py-2.5 px-4 rounded-md text-sm font-medium transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                全体設定
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">システムリソース</h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">ストレージ使用率</span>
                  <span className="text-gray-900 font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">データベース負荷</span>
                  <span className="text-gray-900 font-bold">28%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">メモリ使用率</span>
                  <span className="text-gray-900 font-bold">60%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
