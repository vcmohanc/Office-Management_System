import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  FolderPlus, 
  MapPin, 
  ArrowRightLeft,
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';
import { 
  loadRegions, 
  saveRegions, 
  INITIAL_JAPAN_REGIONS, 
  filterRegions 
} from '../../utils/regionHelper.js';

export default function JapaneseRegionManagement({ regions: propRegions, onRegionsChange }) {
  const [internalRegions, setInternalRegions] = useState(() => loadRegions());
  const regions = propRegions !== undefined ? propRegions : internalRegions;

  const setRegions = (updater) => {
    const nextVal = typeof updater === 'function' ? updater(regions) : updater;
    if (onRegionsChange) {
      onRegionsChange(nextVal);
    }
    setInternalRegions(nextVal);
    saveRegions(nextVal);
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [isAddRegionModalOpen, setIsAddRegionModalOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [newInitialPrefecture, setNewInitialPrefecture] = useState('');

  const [addPrefectureTarget, setAddPrefectureTarget] = useState(null); // { regId, regName }
  const [newPrefectureName, setNewPrefectureName] = useState('');

  // Inline edit state for prefecture: { regId, prefId, name, targetRegionId }
  const [editingPrefecture, setEditingPrefecture] = useState(null);

  // Inline edit state for region: { regId, name }
  const [editingRegion, setEditingRegion] = useState(null);

  // Sync to localStorage whenever regions state changes
  useEffect(() => {
    saveRegions(regions);
  }, [regions]);


  // Filtered dataset with dynamic rowspan computation
  const filteredData = useMemo(() => {
    return filterRegions(regions, searchQuery);
  }, [regions, searchQuery]);

  // Overall counts
  const totalRegionsCount = regions.length;
  const totalPrefecturesCount = regions.reduce(
    (sum, r) => sum + (r.prefectures?.length || 0), 
    0
  );

  const displayedPrefecturesCount = filteredData.reduce(
    (sum, r) => sum + (r.matchingPrefectures?.length || 0), 
    0
  );

  // ----------------------------------------------------
  // CRUD Actions
  // ----------------------------------------------------

  // 1. Create Region with Initial Prefecture
  const handleAddRegion = (e) => {
    e?.preventDefault();
    const regName = newRegionName.trim();
    const prefName = newInitialPrefecture.trim();

    if (!regName) {
      toast.error('地域名を入力してください (Region name is required)');
      return;
    }
    if (!prefName) {
      toast.error('初期都道府県名を入力してください (Initial prefecture is required)');
      return;
    }

    const regId = `reg-${Date.now()}`;
    const prefId = `pref-${Date.now()}`;

    const newRegionObj = {
      id: regId,
      name: regName,
      prefectures: [{ id: prefId, name: prefName }]
    };

    setRegions(prev => [...prev, newRegionObj]);
    setNewRegionName('');
    setNewInitialPrefecture('');
    setIsAddRegionModalOpen(false);
    toast.success(`地域「${regName}」と「${prefName}」を追加しました`);
  };

  // 2. Create Prefecture under an existing Region
  const handleAddPrefecture = (e) => {
    e?.preventDefault();
    if (!addPrefectureTarget) return;

    const prefName = newPrefectureName.trim();
    if (!prefName) {
      toast.error('都道府県名を入力してください (Prefecture name is required)');
      return;
    }

    const prefId = `pref-${Date.now()}`;
    setRegions(prev => prev.map(reg => {
      if (reg.id !== addPrefectureTarget.regId) return reg;
      return {
        ...reg,
        prefectures: [...(reg.prefectures || []), { id: prefId, name: prefName }]
      };
    }));

    toast.success(`「${addPrefectureTarget.regName}」に「${prefName}」を追加しました`);
    setNewPrefectureName('');
    setAddPrefectureTarget(null);
  };

  // 3. Update Region Name
  const handleSaveRegionEdit = () => {
    if (!editingRegion) return;
    const trimmed = editingRegion.name.trim();
    if (!trimmed) {
      toast.error('地域名を入力してください');
      return;
    }

    setRegions(prev => prev.map(reg => {
      if (reg.id !== editingRegion.regId) return reg;
      return { ...reg, name: trimmed };
    }));

    toast.success('地域名を更新しました');
    setEditingRegion(null);
  };

  // 4. Update Prefecture Name & Reassign Region
  const handleSavePrefectureEdit = () => {
    if (!editingPrefecture) return;
    const trimmed = editingPrefecture.name.trim();
    if (!trimmed) {
      toast.error('都道府県名を入力してください');
      return;
    }

    const { regId, prefId, targetRegionId } = editingPrefecture;

    if (targetRegionId && targetRegionId !== regId) {
      // Reassign to another region
      setRegions(prev => {
        let movedPref = null;
        // 1. Remove from source
        const withoutPref = prev.map(reg => {
          if (reg.id === regId) {
            const pref = reg.prefectures.find(p => p.id === prefId);
            if (pref) movedPref = { ...pref, name: trimmed };
            return {
              ...reg,
              prefectures: reg.prefectures.filter(p => p.id !== prefId)
            };
          }
          return reg;
        });

        if (!movedPref) return prev;

        // 2. Add to destination
        return withoutPref.map(reg => {
          if (reg.id === targetRegionId) {
            return {
              ...reg,
              prefectures: [...(reg.prefectures || []), movedPref]
            };
          }
          return reg;
        });
      });
      toast.success('都道府県の名称と所属地域を更新しました');
    } else {
      // Rename in place
      setRegions(prev => prev.map(reg => {
        if (reg.id !== regId) return reg;
        return {
          ...reg,
          prefectures: reg.prefectures.map(p => {
            if (p.id !== prefId) return p;
            return { ...p, name: trimmed };
          })
        };
      }));
      toast.success('都道府県名を更新しました');
    }

    setEditingPrefecture(null);
  };

  // 5. Delete Prefecture
  const handleDeletePrefecture = async (regId, prefId, prefName) => {
    const confirmed = await toastConfirm(`「${prefName}」を削除してもよろしいですか？`);
    if (!confirmed) return;

    setRegions(prev => prev.map(reg => {
      if (reg.id !== regId) return reg;
      return {
        ...reg,
        prefectures: reg.prefectures.filter(p => p.id !== prefId)
      };
    }));
    toast.success(`「${prefName}」を削除しました`);
  };

  // 6. Delete Region along with all prefectures
  const handleDeleteRegion = async (regId, regName, prefCount) => {
    const confirmed = await toastConfirm(
      `地域「${regName}」および所属するすべての都道府県（${prefCount}件）を削除しますか？この操作は取り消せません。`
    );
    if (!confirmed) return;

    setRegions(prev => prev.filter(reg => reg.id !== regId));
    toast.success(`地域「${regName}」を削除しました`);
  };

  // 7. Reset to default dataset
  const handleResetToDefault = async () => {
    const confirmed = await toastConfirm(
      '標準の8地域・47都道府県データに初期化しますか？現在の編集内容は上書きされます。'
    );
    if (!confirmed) return;

    setRegions(INITIAL_JAPAN_REGIONS);
    setSearchQuery('');
    toast.success('標準データにリセットしました');
  };

  return (
    <div className="w-full font-sans text-gray-800">
      
      {/* ======================================================== */}
      {/* Top Controls & Action Bar */}
      {/* ======================================================== */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        
        {/* Search & Filter */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="地域名 (Kanto等) または 都道府県名 (東京等) で検索..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162D50] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              title="検索をクリア"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons & Statistics */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs text-gray-500 font-medium px-2.5 py-1.5 bg-gray-100 rounded-md">
            表示中: {displayedPrefecturesCount} / {totalPrefecturesCount} 都道府県 ({filteredData.length} 地域)
          </div>

          <button
            onClick={() => setIsAddRegionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#162D50] text-white text-sm font-medium rounded-md hover:bg-[#203c6b] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>新しい地域を追加</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            title="標準の47都道府県データに復元"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">リセット</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Main Table Matching Reference Styling */}
      {/* ======================================================== */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table 
          className="w-full border-collapse" 
          style={{ border: '1px solid #b8b3a8' }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th 
                className="py-3.5 px-4 text-center text-sm font-bold text-gray-900 tracking-wide"
                style={{ border: '1px solid #b8b3a8', width: '35%' }}
              >
                Region / Prefecture
              </th>
              <th 
                className="py-3.5 px-4 text-center text-sm font-bold text-gray-900 tracking-wide"
                style={{ border: '1px solid #b8b3a8', width: '38%' }}
              >
                Ken
              </th>
              <th 
                className="py-3.5 px-4 text-center text-sm font-bold text-gray-900 tracking-wide"
                style={{ border: '1px solid #b8b3a8', width: '27%' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td 
                  colSpan={3} 
                  className="py-12 text-center text-gray-500 text-sm"
                  style={{ border: '1px solid #b8b3a8' }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                    <p className="font-medium text-gray-600">一致する地域または都道府県が見つかりませんでした。</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        検索条件をクリア
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((region) => {
                const prefs = region.matchingPrefectures || [];
                const rowSpan = prefs.length > 0 ? prefs.length : 1;

                // Case 1: Region has no prefectures currently (e.g. all deleted or filtered out)
                if (prefs.length === 0) {
                  return (
                    <tr key={region.id}>
                      {/* Column 1: Region cell */}
                      <td
                        rowSpan={1}
                        className="p-4 align-middle bg-white text-center"
                        style={{ border: '1px solid #b8b3a8' }}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-base font-bold text-gray-900">{region.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAddPrefectureTarget({ regId: region.id, regName: region.name })}
                              className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-300 font-medium transition-colors"
                            >
                              + 都道府県追加
                            </button>
                            <button
                              onClick={() => handleDeleteRegion(region.id, region.name, 0)}
                              className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                              title="地域を削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      {/* Empty indicator */}
                      <td 
                        colSpan={2}
                        className="p-4 text-center text-sm text-gray-400 italic bg-[#fbf5fa]"
                        style={{ border: '1px solid #b8b3a8' }}
                      >
                        都道府県が登録されていません
                      </td>
                    </tr>
                  );
                }

                // Case 2: Region has prefectures
                return prefs.map((pref, prefIndex) => {
                  const isFirstRow = prefIndex === 0;
                  const isEditingPref = editingPrefecture?.prefId === pref.id;
                  
                  // Alternating lavender/pinkish-tinted row background (#fbf5fa)
                  const isAltRow = prefIndex % 2 === 1;
                  const rowBgColor = isAltRow ? '#fbf5fa' : '#ffffff';

                  return (
                    <tr 
                      key={pref.id}
                      className="transition-colors hover:bg-[#f6eef7]"
                    >
                      {/* ---------------------------------------------------- */}
                      {/* Column 1: Merged Region Cell (rendered only on first row) */}
                      {/* ---------------------------------------------------- */}
                      {isFirstRow && (
                        <td
                          rowSpan={rowSpan}
                          className="p-4 align-middle bg-white text-center"
                          style={{ border: '1px solid #b8b3a8' }}
                        >
                          <div className="flex flex-col items-center justify-center gap-2.5 max-w-[260px] mx-auto">
                            
                            {/* Region Name or Inline Edit */}
                            {editingRegion?.regId === region.id ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <input
                                  type="text"
                                  value={editingRegion.name}
                                  onChange={(e) => setEditingRegion({ ...editingRegion, name: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-center"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRegionEdit();
                                    if (e.key === 'Escape') setEditingRegion(null);
                                  }}
                                />
                                <button
                                  onClick={handleSaveRegionEdit}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="保存"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingRegion(null)}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                  title="キャンセル"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 group">
                                <span className="text-base font-bold text-gray-900 tracking-wide">
                                  {region.name}
                                </span>
                                <button
                                  onClick={() => setEditingRegion({ regId: region.id, name: region.name })}
                                  className="opacity-70 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-all"
                                  title="地域名を編集"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Region Action Controls */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => setAddPrefectureTarget({ regId: region.id, regName: region.name })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#162D50] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors shadow-xs"
                                title="この地域に都道府県を追加"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Item</span>
                              </button>

                              <button
                                onClick={() => handleDeleteRegion(region.id, region.name, (region.prefectures || []).length)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                title="地域全体を削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-[11px] text-gray-400 font-mono">
                              ({(region.prefectures || []).length} Ken)
                            </span>
                          </div>
                        </td>
                      )}

                      {/* ---------------------------------------------------- */}
                      {/* Column 2: Prefecture (Ken) in Japanese Characters */}
                      {/* ---------------------------------------------------- */}
                      <td
                        className="py-2.5 px-4 text-center align-middle text-base font-medium text-gray-900"
                        style={{ 
                          border: '1px solid #b8b3a8',
                          backgroundColor: rowBgColor 
                        }}
                      >
                        {isEditingPref ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="text"
                              value={editingPrefecture.name}
                              onChange={(e) => setEditingPrefecture({ ...editingPrefecture, name: e.target.value })}
                              className="px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-center w-40"
                              autoFocus
                              placeholder="都道府県名"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePrefectureEdit();
                                if (e.key === 'Escape') setEditingPrefecture(null);
                              }}
                            />
                          </div>
                        ) : (
                          <span className="tracking-wider">
                            {pref.name}
                          </span>
                        )}
                      </td>

                      {/* ---------------------------------------------------- */}
                      {/* Column 3: Actions (Inline Edit / Delete / Reassign) */}
                      {/* ---------------------------------------------------- */}
                      <td
                        className="py-2.5 px-4 text-center align-middle text-sm"
                        style={{ 
                          border: '1px solid #b8b3a8',
                          backgroundColor: rowBgColor 
                        }}
                      >
                        {isEditingPref ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            {/* Reassign Region selector */}
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 hidden md:inline">地域:</span>
                              <select
                                value={editingPrefecture.targetRegionId}
                                onChange={(e) => setEditingPrefecture({ ...editingPrefecture, targetRegionId: e.target.value })}
                                className="text-xs py-1 px-1.5 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {regions.map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Save / Cancel buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={handleSavePrefectureEdit}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingPrefecture(null)}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                setEditingPrefecture({
                                  regId: region.id,
                                  prefId: pref.id,
                                  name: pref.name,
                                  targetRegionId: region.id
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                            >
                              編集
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDeletePrefecture(region.id, pref.id, pref.name)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================== */}
      {/* Modal: Add New Region with Initial Prefecture */}
      {/* ======================================================== */}
      {isAddRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#162D50] text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-300" />
                <span>新しい地域と都道府県を追加</span>
              </h3>
              <button 
                onClick={() => setIsAddRegionModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRegion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  地域名 (Region / Romaji)
                </label>
                <input
                  type="text"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  placeholder="例: Kantō, Tōhoku, Shin'etsu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  初期都道府県名 (Ken / Kanji)
                </label>
                <input
                  type="text"
                  value={newInitialPrefecture}
                  onChange={(e) => setNewInitialPrefecture(e.target.value)}
                  placeholder="例: 東京都, 長野県"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddRegionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#162D50] hover:bg-[#203c6b] rounded-md transition-colors shadow-sm"
                >
                  地域を追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Add Prefecture to an existing Region */}
      {/* ======================================================== */}
      {addPrefectureTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">
                  「{addPrefectureTarget.regName}」に都道府県を追加
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">新しい Ken を入力してください</p>
              </div>
              <button 
                onClick={() => setAddPrefectureTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPrefecture} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  都道府県名 (Ken)
                </label>
                <input
                  type="text"
                  value={newPrefectureName}
                  onChange={(e) => setNewPrefectureName(e.target.value)}
                  placeholder="例: 東京都, 神奈川県"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddPrefectureTarget(null)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                >
                  追加する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
