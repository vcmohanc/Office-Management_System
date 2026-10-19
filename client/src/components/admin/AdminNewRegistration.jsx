import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, ArrowLeft, Search, Check, Building2, MapPin, CheckSquare, Square, X, Briefcase, Tag } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

export default function AdminNewRegistration({ setActiveTab }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'account'
  });

  const [partners, setPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnersLoading, setPartnersLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch B2B partners when role is support
  useEffect(() => {
    if (formData.role === 'support' && partners.length === 0) {
      setPartnersLoading(true);
      apiFetch('/api/b2b/partners')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setPartners(data);
          } else {
            return apiFetch('/api/b2b/engagements?limit=100')
              .then(res => res.ok ? res.json() : { data: [] })
              .then(d => setPartners(d.data || []));
          }
        })
        .catch(err => console.error('Error fetching partners:', err))
        .finally(() => setPartnersLoading(false));
    }
  }, [formData.role, partners.length]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePartner = (partnerName) => {
    setSelectedPartners(prev => 
      prev.includes(partnerName) 
        ? prev.filter(p => p !== partnerName) 
        : [...prev, partnerName]
    );
  };

  const handleSelectAllPartners = () => {
    setSelectedPartners(filteredPartners.map(p => p.partner_name));
  };

  const handleDeselectAllPartners = () => {
    setSelectedPartners([]);
  };

  const filteredPartners = useMemo(() => {
    const q = partnerSearch.toLowerCase().trim();
    if (!q) return partners;
    return partners.filter(p => {
      const matchName = (p.partner_name || '').toLowerCase().includes(q);
      const matchInd = (p.industry || '').toLowerCase().includes(q);
      const matchBranches = Array.isArray(p.workplaceCategories) && p.workplaceCategories.some(b => b.toLowerCase().includes(q));
      return matchName || matchInd || matchBranches;
    });
  }, [partners, partnerSearch]);

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

    if (formData.role === 'support' && selectedPartners.length === 0) {
      setError('サポート部門のアカウントには、少なくとも1つの担当ビジネスパートナー / 支店を選択してください。');
      setLoading(false);
      return;
    }

    try {
      // Collect all branches corresponding to selected partners
      const assignedBranches = [];
      selectedPartners.forEach(pName => {
        const p = partners.find(pt => pt.partner_name === pName);
        if (p && Array.isArray(p.workplaceCategories)) {
          p.workplaceCategories.forEach(w => {
            if (!assignedBranches.includes(w)) assignedBranches.push(w);
          });
        }
      });

      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          assignedPartners: formData.role === 'support' ? selectedPartners : [],
          assignedBranches: formData.role === 'support' ? assignedBranches : []
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`ユーザー「${formData.username}」を正常に登録しました！`);
        setFormData({ username: '', password: '', confirmPassword: '', role: 'account' });
        setSelectedPartners([]);
        setPartnerSearch('');
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
    <div className="p-8 max-w-4xl mx-auto">
      <button 
        onClick={() => setActiveTab('Dashboard')}
        className="flex items-center text-sm text-gray-500 hover:text-[#162D50] mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        ダッシュボードに戻る
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2.5 bg-[#162D50] text-white rounded-lg mr-4 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#162D50]">新規ユーザー登録</h1>
              <p className="text-sm text-gray-500">アカウントを作成し、担当部署・権限を設定します。</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-medium rounded-r">
              {message}
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ユーザー名</label>
              <input 
                type="text" 
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. jsmith"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">役割 / 部門</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
              >
                <option value="account">経理部門 (Account Department)</option>
                <option value="hr">人事部門 (HR Department)</option>
                <option value="support">サポート部門 (Support Department)</option>
                <option value="admin">System Admin</option>
              </select>
            </div>

            {/* Support Department Dynamic Partnership Assignment Section */}
            {formData.role === 'support' && (
              <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#162D50]" />
                      <label className="text-sm font-bold text-[#162D50]">
                        担当ビジネスパートナー / 支店 (必須)
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      このユーザーが担当するビジネスパートナー（支店・ファーム）を選択してください。他担当者の案件はアクセス不可になります。
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#162D50] text-white">
                      {selectedPartners.length} 件選択中
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllPartners}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline px-1"
                    >
                      全選択
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllPartners}
                      className="text-xs text-gray-600 hover:text-gray-800 font-semibold underline px-1"
                    >
                      全解除
                    </button>
                  </div>
                </div>

                {/* Partner search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="パートナー名、業種、支店名で検索..."
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {partnerSearch && (
                    <button
                      type="button"
                      onClick={() => setPartnerSearch('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Partner Card List */}
                {partnersLoading ? (
                  <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border border-gray-200">
                    パートナー情報を読み込み中...
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                    一致するビジネスパートナーが見つかりません。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {filteredPartners.map(p => {
                      const isSelected = selectedPartners.includes(p.partner_name);
                      return (
                        <div
                          key={p._id || p.partner_name}
                          onClick={() => togglePartner(p.partner_name)}
                          className={`cursor-pointer p-3.5 rounded-lg border transition-all select-none flex items-start gap-3 ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 shadow-sm'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                                {p.partner_name}
                              </p>
                              {p.industry && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 truncate max-w-[100px]">
                                  {p.industry}
                                </span>
                              )}
                            </div>
                            {Array.isArray(p.workplaceCategories) && p.workplaceCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.workplaceCategories.map((cat, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-0.5 text-[10px] text-gray-600 bg-gray-100/80 px-1.5 py-0.5 rounded"
                                  >
                                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">パスワード</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password (8文字以上)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">パスワードの確認</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-7 py-2.5 bg-[#162D50] text-white font-bold rounded-lg hover:bg-[#0f1f38] transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? '登録中...' : 'ユーザーを登録 (Register User)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
