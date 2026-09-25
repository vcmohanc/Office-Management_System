import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';


export default function ExpenseSetup() {
  const [activeTab, setActiveTab] = useState('postal');
  const [regions, setRegions] = useState([]);
  const [postalCharges, setPostalCharges] = useState({});
  const [travelCharges, setTravelCharges] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Region management states
  const [editingRegion, setEditingRegion] = useState(null);
  const [editName1, setEditName1] = useState('');
  const [editName2, setEditName2] = useState('');
  const [newName1, setNewName1] = useState('');
  const [newName2, setNewName2] = useState('');

  const fetchData = async () => {
    try {
      let fetchedRegions = [];
      const regionsRes = await apiFetch('/api/regions');
      if (regionsRes.ok) {
        fetchedRegions = await regionsRes.json();
        setRegions(fetchedRegions);
      }

      const [postalRes, travelRes] = await Promise.all([
        apiFetch('/api/expenses/postal'),
        apiFetch('/api/expenses/travel')
      ]);
      
      if (postalRes.ok) {
        const postalData = await postalRes.json();
        setPostalCharges(postalData);
      }
      
      if (travelRes.ok) {
        const travelData = await travelRes.json();
        const transformedData = {};
        for (const [depId, charges] of Object.entries(travelData)) {
          transformedData[depId] = {};
          const depRegion = fetchedRegions.find(r => r._id === depId);
          for (const [destId, val] of Object.entries(charges)) {
            const destRegion = fetchedRegions.find(r => r._id === destId);
            if (typeof val === 'string' || typeof val === 'number') {
              const isEligible = isFlightEligible(depRegion, destRegion);
              transformedData[depId][destId] = { bus: String(val), flight: isEligible ? String(val) : '' };
            } else {
              transformedData[depId][destId] = val;
            }
          }
        }
        setTravelCharges(transformedData);
      }
    } catch (err) {
      console.error("Failed to fetch charges:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isFlightEligible = (dep, dest) => {
    return true;
  };

  const handleSave = async () => {
    setIsLoading(true);
    const endpoint = activeTab === 'postal' ? '/api/expenses/postal' : '/api/expenses/travel';
    const payload = activeTab === 'postal' ? postalCharges : travelCharges;
    
    try {
      const res = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        toast.success(`${activeTab === 'postal' ? 'Postal' : 'Travel'} 変更が保存されました！`);
      } else {
        let errMsg = '変更の保存に失敗しました。';
        try {
          const errData = await res.json();
          if (errData.message) errMsg = `変更の保存に失敗しました: ${errData.message}`;
        } catch (e) {
          errMsg = `変更の保存に失敗しました。ステータス: ${res.status}`;
        }
        toast.error(errMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error(`変更の保存中にエラーが発生しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChargeChange = (departureId, destinationId, value, type) => {
    if (activeTab === 'postal') {
      setPostalCharges(prev => ({
        ...prev,
        [departureId]: {
          ...(prev[departureId] || {}),
          [destinationId]: value
        }
      }));
    } else {
      setTravelCharges(prev => {
        const existing = prev[departureId]?.[destinationId];
        const newObj = (existing && typeof existing === 'object') ? { ...existing } : { bus: existing || '', flight: '' };
        newObj[type] = value;
        return {
          ...prev,
          [departureId]: {
            ...(prev[departureId] || {}),
            [destinationId]: newObj
          }
        };
      });
    }
  };

  const handleAddRegion = async () => {
    if (!newName1.trim() || !newName2.trim()) {
      toast.error('送信者/出発地と受信者/到着地の両方を入力してください。');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/regions', {
        method: 'POST',
        body: JSON.stringify({ name1: newName1, name2: newName2 }),
      });
      if (res.ok) {
        setNewName1('');
        setNewName2('');
        fetchData();
      } else {
        toast.error('地域の追加に失敗しました');
      }
    } catch (err) {
      console.error(err);
      toast.error('地域の追加中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRegion = async (id) => {
    if (!editName1.trim() || !editName2.trim()) {
      toast.error('送信者/出発地と受信者/到着地の両方を入力してください。');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/regions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name1: editName1, name2: editName2 }),
      });
      if (res.ok) {
        setEditingRegion(null);
        fetchData();
      } else {
        toast.error('地域の更新に失敗しました');
      }
    } catch (err) {
      console.error(err);
      toast.error('地域の更新中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegion = async (id) => {
    const confirmed = await toastConfirm('この地域を削除してもよろしいですか？この地域に保存された価格もすべて削除されます。');
    if (!confirmed) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/regions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        toast.error('地域の削除に失敗しました');
      }
    } catch (err) {
      console.error(err);
      toast.error('地域の削除中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCharges = activeTab === 'postal' ? postalCharges : travelCharges;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      
      {/* Top Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('postal')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'postal' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          郵便料金
        </button>
        <button
          onClick={() => setActiveTab('travel')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'travel' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          交通費
        </button>
        <button
          onClick={() => setActiveTab('regions')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'regions' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          地域管理
        </button>
      </div>

      <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#162D50]">
            {activeTab === 'postal' && '郵便料金設定'}
            {activeTab === 'travel' && '交通費設定'}
            {activeTab === 'regions' && '地域管理'}
          </h2>
          {activeTab !== 'regions' && (
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-[#162D50] text-white rounded-md hover:bg-[#203c6b] transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? '保存中...' : '変更を保存'}
            </button>
          )}
        </div>

        <div className="p-6 overflow-auto">
          {activeTab === 'regions' ? (
            <div className="max-w-4xl">
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">新しい地域を追加</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">送信者 / 出発地名（名前1）</label>
                    <input 
                      type="text" 
                      value={newName1}
                      onChange={e => setNewName1(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="例：北海道"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">受信者 / 到着地名（名前2）</label>
                    <input 
                      type="text" 
                      value={newName2}
                      onChange={e => setNewName2(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="例：北海道"
                    />
                  </div>
                  <button 
                    onClick={handleAddRegion}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    追加
                  </button>
                </div>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">送信者 / 出発地 (名前1)</th>
                    <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">受信者 / 到着地 (名前2)</th>
                    <th className="p-3 border border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase w-32">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map(region => (
                    <tr key={region._id} className="hover:bg-gray-50">
                      {editingRegion === region._id ? (
                        <>
                          <td className="p-3 border border-gray-200">
                            <input 
                              type="text" 
                              value={editName1}
                              onChange={e => setEditName1(e.target.value)}
                              className="w-full p-1.5 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 border border-gray-200">
                            <input 
                              type="text" 
                              value={editName2}
                              onChange={e => setEditName2(e.target.value)}
                              className="w-full p-1.5 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 border border-gray-200 text-center">
                            <button onClick={() => handleUpdateRegion(region._id)} className="text-blue-600 hover:text-blue-800 mr-3 font-medium">保存</button>
                            <button onClick={() => setEditingRegion(null)} className="text-gray-500 hover:text-gray-700 font-medium">キャンセル</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border border-gray-200 text-sm text-gray-800">{region.name1}</td>
                          <td className="p-3 border border-gray-200 text-sm text-gray-800">{region.name2}</td>
                          <td className="p-3 border border-gray-200 text-center">
                            <button 
                              onClick={() => {
                                setEditingRegion(region._id);
                                setEditName1(region.name1);
                                setEditName2(region.name2);
                              }} 
                              className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                            >
                              編集
                            </button>
                            <button onClick={() => handleDeleteRegion(region._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">削除</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 z-10 w-32">
                    {activeTab === 'postal' ? '送信者 / 受信者' : '出発地 / 到着地'}
                  </th>
                  {regions.map(region => (
                    <th key={region._id} className="p-3 border border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      {region.name2}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regions.map((departure, rowIndex) => (
                  <tr key={departure._id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 border border-gray-200 font-medium text-sm text-gray-700 bg-white sticky left-0 z-10 whitespace-nowrap">
                      {departure.name1}
                    </td>
                    
                    {regions.map((destination) => {
                      const isDiagonal = departure._id === destination._id;
                      const value = currentCharges[departure._id]?.[destination._id] || '';
                      
                      return (
                        <td 
                          key={`${departure._id}-${destination._id}`} 
                          className={`p-2 border border-gray-200 text-center ${isDiagonal ? 'bg-red-50' : 'bg-white'}`}
                        >
                          {isDiagonal && activeTab === 'postal' ? (
                            <span className="text-red-500 font-bold text-sm">なし</span>
                          ) : activeTab === 'travel' ? (
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center">
                                <span className="text-gray-500 text-xs w-8 text-left">バス</span>
                                <span className="text-gray-500 mx-1">¥</span>
                                <input
                                  type="text"
                                  value={value?.bus || ''}
                                  onChange={(e) => handleChargeChange(departure._id, destination._id, e.target.value, 'bus')}
                                  className="w-full text-center p-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              {!isDiagonal && (
                                <div className={`flex items-center ${!isFlightEligible(departure, destination) ? 'opacity-50' : ''}`}>
                                  <span className="text-gray-500 text-xs w-8 text-left">フライト</span>
                                  <span className="text-gray-500 mx-1">¥</span>
                                  <input
                                    type="text"
                                    value={value?.flight || ''}
                                    onChange={(e) => handleChargeChange(departure._id, destination._id, e.target.value, 'flight')}
                                    disabled={!isFlightEligible(departure, destination)}
                                    className="w-full text-center p-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">¥</span>
                              <input
                                type="text"
                                value={typeof value === 'object' ? (value.bus || '') : value}
                                onChange={(e) => handleChargeChange(departure._id, destination._id, e.target.value)}
                                className="w-full text-center p-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
