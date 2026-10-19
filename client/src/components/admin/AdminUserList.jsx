import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, ArrowLeft, Edit2, Eye, X, Check, Search,
  Users, UserCheck, Briefcase, HeadphonesIcon, Key,
  Calendar, RefreshCw, User, ChevronDown, Building2, MapPin, CheckSquare, Square, Tag,
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  admin:   { label: 'システム管理者', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500', icon: Shield },
  hr:      { label: '人事部門',       color: 'bg-blue-100   text-blue-800',   dot: 'bg-blue-500',   icon: Users },
  account: { label: '経理部門',       color: 'bg-amber-100  text-amber-800',  dot: 'bg-amber-500',  icon: Briefcase },
  support: { label: 'サポート部門',   color: 'bg-green-100  text-green-800',  dot: 'bg-green-500',  icon: HeadphonesIcon },
};

const AVATAR_COLORS = [
  'bg-[#162D50]', 'bg-purple-600', 'bg-blue-600',
  'bg-emerald-600', 'bg-amber-600',
];

function getInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || { label: role, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function AdminUserList({ setActiveTab }) {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [partners, setPartners]     = useState([]);
  const [partnerSearch, setPartnerSearch] = useState('');

  const [viewUser, setViewUser]     = useState(null);
  const [editUser, setEditUser]     = useState(null);
  const [editForm, setEditForm]     = useState({ username: '', role: '', password: '', assignedPartners: [], assignedBranches: [] });
  const [saving, setSaving]         = useState(false);
  const [showPwd, setShowPwd]       = useState(false);

  useEffect(() => { 
    fetchUsers(); 
    fetchPartners();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/auth/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setError(data.error || 'ユーザー情報の取得に失敗しました');
    } catch {
      setError('サーバーエラーが発生しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await apiFetch('/api/b2b/partners');
      const data = res.ok ? await res.json() : [];
      if (Array.isArray(data) && data.length > 0) {
        setPartners(data);
      } else {
        const engRes = await apiFetch('/api/b2b/engagements?limit=100');
        const engData = engRes.ok ? await engRes.json() : { data: [] };
        setPartners(engData.data || []);
      }
    } catch (e) {
      console.error('Error fetching partners in AdminUserList:', e);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      username: user.username,
      role: user.role,
      password: '',
      assignedPartners: Array.isArray(user.assignedPartners) ? [...user.assignedPartners] : [],
      assignedBranches: Array.isArray(user.assignedBranches) ? [...user.assignedBranches] : []
    });
    setPartnerSearch('');
    setShowPwd(false);
  };

  const toggleEditPartner = (pName) => {
    setEditForm(prev => {
      const cur = prev.assignedPartners || [];
      const next = cur.includes(pName) ? cur.filter(p => p !== pName) : [...cur, pName];
      return { ...prev, assignedPartners: next };
    });
  };

  const handleSelectAllPartners = () => {
    setEditForm(prev => ({
      ...prev,
      assignedPartners: filteredPartnersForEdit.map(p => p.partner_name)
    }));
  };

  const handleDeselectAllPartners = () => {
    setEditForm(prev => ({
      ...prev,
      assignedPartners: []
    }));
  };

  const filteredPartnersForEdit = useMemo(() => {
    const q = partnerSearch.toLowerCase().trim();
    if (!q) return partners;
    return partners.filter(p => {
      const matchName = (p.partner_name || '').toLowerCase().includes(q);
      const matchInd = (p.industry || '').toLowerCase().includes(q);
      const matchBranches = Array.isArray(p.workplaceCategories) && p.workplaceCategories.some(b => b.toLowerCase().includes(q));
      return matchName || matchInd || matchBranches;
    });
  }, [partners, partnerSearch]);

  const saveEdit = async () => {
    if (!editForm.username.trim()) { toast.error('ユーザー名は必須です'); return; }
    if (editForm.password && editForm.password.length < 8) {
      toast.error('パスワードは8文字以上で入力してください');
      return;
    }
    if (editForm.role === 'support' && (!editForm.assignedPartners || editForm.assignedPartners.length === 0)) {
      toast.error('サポート部門には少なくとも1つの担当ビジネスパートナーを選択してください');
      return;
    }

    setSaving(true);
    try {
      const assignedBranches = [];
      if (editForm.role === 'support' && Array.isArray(editForm.assignedPartners)) {
        editForm.assignedPartners.forEach(pName => {
          const p = partners.find(pt => pt.partner_name === pName);
          if (p && Array.isArray(p.workplaceCategories)) {
            p.workplaceCategories.forEach(w => {
              if (!assignedBranches.includes(w)) assignedBranches.push(w);
            });
          }
        });
      }

      const body = {
        username: editForm.username.trim(),
        role: editForm.role,
        assignedPartners: editForm.role === 'support' ? editForm.assignedPartners : [],
        assignedBranches: editForm.role === 'support' ? assignedBranches : []
      };
      if (editForm.password) body.password = editForm.password;

      const res  = await apiFetch(`/api/auth/users/${editUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u._id === editUser._id ? data : u));
        setEditUser(null);
        toast.success('アカウント情報を更新しました');
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch {
      toast.error('サーバーエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    total:   users.length,
    admin:   users.filter(u => u.role === 'admin').length,
    hr:      users.filter(u => u.role === 'hr').length,
    account: users.filter(u => u.role === 'account').length,
    support: users.filter(u => u.role === 'support').length,
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-[#162D50] to-[#1e4080] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('Dashboard')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="ダッシュボードへ戻る"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="p-3 bg-white/10 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-0.5">管理者設定</p>
              <h1 className="text-2xl font-bold">システムアカウント管理</h1>
              <p className="text-sm text-white/70 mt-0.5">部門別ログインアカウントの確認・編集</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              更新
            </button>
            <button
              onClick={() => setActiveTab('Admin New Registration')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#162D50] rounded-lg text-sm font-bold hover:bg-white/90 transition-colors"
            >
              新規アカウント登録
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3 mt-6">
          {[
            { label: '全アカウント', value: counts.total,   icon: Users,          active: roleFilter === 'all',     key: 'all' },
            { label: 'システム管理者', value: counts.admin,  icon: Shield,         active: roleFilter === 'admin',   key: 'admin' },
            { label: '人事部門',     value: counts.hr,      icon: Users,          active: roleFilter === 'hr',      key: 'hr' },
            { label: '経理部門',     value: counts.account, icon: Briefcase,      active: roleFilter === 'account', key: 'account' },
            { label: 'サポート部門', value: counts.support,  icon: HeadphonesIcon, active: roleFilter === 'support', key: 'support' },
          ].map(({ label, value, icon: Icon, active, key }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`text-left p-3 rounded-xl transition-colors ${active ? 'bg-white/20 ring-2 ring-white/40' : 'bg-white/10 hover:bg-white/15'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-white/60" />
                <p className="text-xs text-white/70">{label}</p>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ユーザー名で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162D50]/20 focus:border-[#162D50]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {error && (
          <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-24" />
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">アカウントが見つかりません</p>
            <p className="text-sm text-gray-400 mt-1">検索条件を変更してください</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">アカウント</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">部門 / 権限</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">担当取引先 / 提携先</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">登録日</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user, idx) => (
                  <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {getInitials(user.username)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.username}</p>
                          <p className="text-xs text-gray-400 mt-0.5">ID: {user._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-4 px-6">
                      {user.role === 'support' ? (
                        user.assignedPartners && user.assignedPartners.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {user.assignedPartners.slice(0, 2).map((p, pIdx) => (
                              <span key={pIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[120px]">{p}</span>
                              </span>
                            ))}
                            {user.assignedPartners.length > 2 && (
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                +{user.assignedPartners.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            全取引先 (未設定)
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {fmtDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewUser(user)}
                          className="p-2 text-gray-400 hover:text-[#162D50] hover:bg-indigo-50 rounded-lg transition-colors"
                          title="詳細を見る"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              {roleFilter !== 'all' || search
                ? `${filtered.length} / ${users.length} 件のアカウントを表示中`
                : `${users.length} 件のアカウント`}
            </p>
          </div>
        )}
      </div>

      {/* View modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#162D50] to-[#1e4080] p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wider">アカウント詳細</p>
                <button onClick={() => setViewUser(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {getInitials(viewUser.username)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewUser.username}</h2>
                  <RoleBadge role={viewUser.role} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">ユーザーID</p>
                  <p className="text-sm font-mono font-medium text-gray-700">{viewUser._id.slice(-8)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">権限レベル</p>
                  <p className="text-sm font-medium text-gray-700">
                    {ROLE_CONFIG[viewUser.role]?.label || viewUser.role}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> 登録日時</p>
                <p className="text-sm font-medium text-gray-700">{fmtDate(viewUser.createdAt)}</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-xs font-medium text-amber-700">パスワード</p>
                </div>
                <p className="text-xs text-amber-600">セキュリティ上の理由でパスワードは表示されません。変更が必要な場合は「編集」から更新してください。</p>
              </div>

              {viewUser.role === 'support' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-[#162D50]" /> 担当ビジネスパートナー / 支店 ({viewUser.assignedPartners?.length || 0}件)
                  </p>
                  {viewUser.assignedPartners && viewUser.assignedPartners.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-36 overflow-y-auto">
                      {viewUser.assignedPartners.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 shadow-xs text-gray-800 text-xs rounded-lg font-medium">
                          <Building2 className="w-3 h-3 text-[#162D50]" />
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium mt-1">全取引先 (未制限)</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setViewUser(null); openEdit(viewUser); }}
                  className="flex-1 py-2.5 bg-[#162D50] text-white text-sm font-medium rounded-lg hover:bg-[#0f1f38] transition-colors"
                >
                  編集する
                </button>
                <button
                  onClick={() => setViewUser(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setEditUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">アカウント編集</h2>
                <p className="text-xs text-gray-400 mt-0.5">「{editUser.username}」の情報を変更</p>
              </div>
              <button
                onClick={() => !saving && setEditUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ユーザー名 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162D50]/20 focus:border-[#162D50]"
                    placeholder="ユーザー名"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">部門 / 権限</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162D50]/20 focus:border-[#162D50] appearance-none bg-white"
                  >
                    <option value="admin">システム管理者</option>
                    <option value="hr">人事部門</option>
                    <option value="account">経理部門</option>
                    <option value="support">サポート部門</option>
                  </select>
                </div>
              </div>

              {/* Support Partner Assignment Section */}
              {editForm.role === 'support' && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#162D50]" />
                      担当ビジネスパートナー / 支店（複数選択可）
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      選択中: {editForm.assignedPartners?.length || 0}件
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    このサポート担当者が管理・閲覧できるビジネスパートナー（支店・提携先）を選択してください。
                  </p>

                  {/* Search and Select/Clear controls */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={partnerSearch}
                        onChange={(e) => setPartnerSearch(e.target.value)}
                        placeholder="取引先名・業種・支店名で絞り込み..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#162D50]"
                      />
                      {partnerSearch && (
                        <button
                          type="button"
                          onClick={() => setPartnerSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPartners}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        すべて選択
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllPartners}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Square className="w-3.5 h-3.5" />
                        全解除
                      </button>
                    </div>
                  </div>

                  {/* Partner cards list */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
                    {partners.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">
                        ビジネスパートナー情報を読み込み中...
                      </div>
                    ) : filteredPartnersForEdit.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">
                        一致する取引先が見つかりません
                      </div>
                    ) : (
                      filteredPartnersForEdit.map((partner) => {
                        const isSelected = (editForm.assignedPartners || []).includes(partner.partner_name);
                        return (
                          <div
                            key={partner._id || partner.partner_name}
                            onClick={() => toggleEditPartner(partner.partner_name)}
                            className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-gray-900 truncate">
                                  {partner.partner_name}
                                </span>
                                {partner.industry && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                                    {partner.industry}
                                  </span>
                                )}
                              </div>
                              {Array.isArray(partner.workplaceCategories) && partner.workplaceCategories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {partner.workplaceCategories.map((w, wIdx) => (
                                    <span key={wIdx} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  新しいパスワード
                  <span className="text-gray-400 font-normal ml-1">(変更しない場合は空欄)</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="8文字以上で入力"
                    className="w-full pl-9 pr-16 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162D50]/20 focus:border-[#162D50]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? '隠す' : '表示'}
                  </button>
                </div>
                {editForm.password && editForm.password.length > 0 && editForm.password.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">パスワードは8文字以上が必要です</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-600">
                  変更はすぐに反映されます。パスワードを変更した場合、対象ユーザーは次回ログイン時に新しいパスワードを使用してください。
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50">
              <button
                onClick={() => !saving && setEditUser(null)}
                disabled={saving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editForm.username.trim()}
                className="flex-1 py-2.5 bg-[#162D50] text-white text-sm font-bold rounded-lg hover:bg-[#0f1f38] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    変更を保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
