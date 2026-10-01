import React from 'react';
import { X, Calendar, User, FileText, CreditCard } from 'lucide-react';

export default function ResignationDetailModal({ isOpen, onClose, resignation }) {
  if (!isOpen || !resignation) return null;

  const emp = resignation.employeeId || {};

  let statusLabel = '通知期間';
  let statusColor = 'bg-purple-100 text-purple-700 border-purple-200';
  
  if (resignation.status === '完了') {
    statusLabel = '完了';
    statusColor = 'bg-green-100 text-green-700 border-green-200';
  } else if (resignation.status === 'In Progress') {
    statusLabel = '経理クリアランス';
    statusColor = 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (resignation.interviewEnabled) {
    statusLabel = '退職面談';
    statusColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-[#F8F9FA] sm:rounded-t-xl">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-[#162D50]">退職詳細情報</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          
          {/* Staff Info */}
          <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{emp.romajiName || 'Unknown'}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">ID: #{emp._id?.slice(-6).toUpperCase()} • {emp.department || '部署未設定'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Resignation Info */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 relative">
              <h4 className="font-bold text-[#162D50] text-sm flex items-center mb-4 pb-2 border-b border-gray-100">
                <FileText className="w-4 h-4 mr-2" />
                退職基本情報
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">退職区分</p>
                  <p className="font-semibold text-gray-800">{resignation.reasonType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">詳細理由</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{resignation.reasonDetail || '記載なし'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">退職日</p>
                    <p className="font-semibold text-gray-800">{formatDate(resignation.resignationDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">最終出勤日</p>
                    <p className="font-semibold text-gray-800">{formatDate(resignation.lastWorkingDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clearance & Settlement Info */}
            <div className="space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 relative">
                <h4 className="font-bold text-[#162D50] text-sm flex items-center mb-4 pb-2 border-b border-gray-100">
                  <Calendar className="w-4 h-4 mr-2" />
                  面談・クリアランス
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">退職面談</p>
                      <p className="font-semibold text-gray-800">
                        {resignation.interviewEnabled ? `${formatDate(resignation.interviewDate)} ${resignation.interviewTime || ''}` : '実施なし'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">面談担当者</p>
                      <p className="font-semibold text-gray-800">{resignation.interviewPerson || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">アカウント停止予定日</p>
                    <p className="font-semibold text-gray-800">{formatDate(resignation.accountStopDate)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 relative">
                <h4 className="font-bold text-[#162D50] text-sm flex items-center mb-4 pb-2 border-b border-gray-100">
                  <CreditCard className="w-4 h-4 mr-2" />
                  精算・書類
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">最終給与日</p>
                      <p className="font-semibold text-gray-800">{formatDate(resignation.finalPayDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">退職金</p>
                      <p className="font-semibold text-gray-800">
                        {resignation.hasSeverance && resignation.severanceAmount ? `¥${Number(resignation.severanceAmount).toLocaleString()}` : 'なし'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end rounded-b-xl">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded font-bold hover:bg-gray-100 transition-colors">
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}
