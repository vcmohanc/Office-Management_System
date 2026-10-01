import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResignationModal from './ResignationModal';
import ResignationDetailModal from './ResignationDetailModal';

import { apiFetch } from '../../utils/apiFetch.js';

export default function Resignation() {
  const [employees, setEmployees] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, resRes] = await Promise.all([
        apiFetch('/api/employees'),
        apiFetch('/api/resignations')
      ]);
      const empData = await empRes.json();
      const resData = await resRes.json();
      setEmployees(empData);
      setResignations(resData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResignation = async (data, selectedStaff) => {
    try {
      const resignationPayload = {
        employeeId: selectedStaff._id,
        status: data.status,
        ...data.resignation
      };
      
      await apiFetch('/api/resignations', {
        method: 'POST',
        body: JSON.stringify(resignationPayload)
      });
      
      await fetchData();
      setIsModalOpen(false);
      toast.success('退職手続きを登録しました');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('保存に失敗しました');
    }
  };

  const activeNotices = resignations.filter(r => r.status !== '完了').length;
  const pendingClearances = resignations.filter(r => r.status === 'In Progress').length;
  const scheduledInterviews = resignations.filter(r => r.interviewEnabled).length;

  const filteredResignations = resignations.filter(resig => {
    const emp = resig.employeeId || {};
    const matchesSearch = (emp.romajiName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (emp._id || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus !== 'All') {
       let statusLabel = '通知期間';
       if (resig.status === '完了') statusLabel = '完了';
       else if (resig.status === 'In Progress') statusLabel = '経理クリアランス';
       else if (resig.interviewEnabled) statusLabel = '退職面談';
       
       if (filterStatus !== statusLabel) matchesFilter = false;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">退職管理</h2>
        <p className="text-gray-500 text-sm">スタッフの退職手続き、クリアランス状況、および最終精算を追跡および管理します。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">アクティブな通知</p>
          <p className="text-3xl font-bold text-[#162D50]">{activeNotices}</p>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">クリアランス保留中</p>
          <p className="text-3xl font-bold text-[#162D50]">{pendingClearances}</p>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">退職面談予定</p>
          <p className="text-3xl font-bold text-[#162D50]">{scheduledInterviews}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="名前またはIDでスタッフを検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
          />
        </div>
        <div className="flex space-x-3 w-full sm:w-auto items-center">
          <div className="relative">
            <div className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
              <Filter className="w-4 h-4 mr-2" />
              <select 
                className="bg-transparent outline-none cursor-pointer appearance-none pr-4"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">すべての状況</option>
                <option value="通知期間">通知期間</option>
                <option value="退職面談">退職面談</option>
                <option value="経理クリアランス">経理クリアランス</option>
                <option value="完了">完了</option>
              </select>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center bg-[#0A192F] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#162D50] transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            新規退職
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-sm font-bold text-[#162D50]">
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">退職日</th>
                <th className="py-4 px-6">最終出勤日</th>
                <th className="py-4 px-6">クリアランス状況</th>
                <th className="py-4 px-6">アクション</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 px-6 text-center text-gray-500">データを読み込み中...</td>
                </tr>
              ) : filteredResignations.length > 0 ? (
                filteredResignations.map(resig => {
                  let statusLabel = '通知期間';
                  let statusColor = 'bg-purple-100 text-purple-700';
                  
                  if (resig.status === '完了') {
                    statusLabel = '完了';
                    statusColor = 'bg-green-100 text-green-700';
                  } else if (resig.status === 'In Progress') {
                    statusLabel = '経理クリアランス';
                    statusColor = 'bg-blue-100 text-blue-700';
                  } else if (resig.interviewEnabled) {
                    statusLabel = '退職面談';
                    statusColor = 'bg-yellow-100 text-yellow-700';
                  }

                  const emp = resig.employeeId || {};

                  return (
                    <tr key={resig._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-600">#{emp._id?.slice(-6).toUpperCase() || 'N/A'}</td>
                      <td className="py-4 px-6 font-bold text-gray-900">{emp.romajiName || 'Unknown Staff'}</td>
                      <td className="py-4 px-6 text-gray-600">{resig.resignationDate ? new Date(resig.resignationDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}</td>
                      <td className="py-4 px-6 text-gray-600">{resig.lastWorkingDate ? new Date(resig.lastWorkingDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`${statusColor} px-3 py-1 rounded-full text-xs font-medium`}>{statusLabel}</span>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => {
                            setSelectedResignation(resig);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-[#162D50] font-bold hover:underline text-sm"
                        >
                          詳細を表示
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 px-6 text-center text-gray-500">退職手続き中のスタッフはいません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ResignationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employees={employees} 
        onSave={handleSaveResignation} 
      />
      <ResignationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        resignation={selectedResignation}
      />
    </div>
  );
}
