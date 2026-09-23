import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const TermRow = ({ term, caseId, defaultMethod }) => {
  const queryClient = useQueryClient();
  const [isPaying, setIsPaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(term.netPayable);
  
  const [paymentData, setPaymentData] = useState({
    paymentMethod: defaultMethod || 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    bankName: '',
    branchCode: '',
    accountNumber: '',
    transactionRef: '',
    lessDeductions: 0
  });

  const payMutation = useMutation({
    mutationFn: async (data) => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      const payload = {
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef,
        paymentDate: data.paymentDate,
        lessDeductions: Number(data.lessDeductions),
      };

      if (data.paymentMethod === 'bank_transfer') {
        payload.bankDetails = {
          bankName: data.bankName,
          branchCode: data.branchCode,
          accountNumber: data.accountNumber
        };
      }

      const res = await fetch(`${apiUrl}/api/cases/${caseId}/terms/${term.termNo}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit payment');
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Term ${term.termNo} paid successfully`);
      queryClient.invalidateQueries(['ledger', caseId]);
      setIsPaying(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const editMutation = useMutation({
    mutationFn: async (amount) => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/cases/${caseId}/terms/${term.termNo}/amount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ netPayable: Number(amount) })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update amount');
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Term ${term.termNo} amount updated`);
      queryClient.invalidateQueries(['ledger', caseId]);
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <>
      <div className={`grid grid-cols-12 gap-4 py-4 items-center border-b ${term.status === 'paid' ? 'bg-green-50/30' : ''}`}>
        <div className="col-span-1 font-bold text-gray-500">
          {String(term.termNo).padStart(2, '0')}
        </div>
        <div className="col-span-2">
          {new Date(term.dueMonth).toISOString().slice(0, 7)}
        </div>
        
        {isEditing ? (
          <div className="col-span-3 flex items-center gap-2">
            <span className="text-gray-500">¥</span>
            <input 
              type="number" 
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-24 p-1 border border-gray-300 rounded outline-none"
            />
            <button onClick={() => editMutation.mutate(editAmount)} className="text-green-600 text-xs font-bold hover:underline">SAVE</button>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 text-xs hover:underline">CANCEL</button>
          </div>
        ) : (
          <div className="col-span-3 font-bold">
            ¥ {term.netPayable.toLocaleString()}
            {term.status === 'pending' && (
              <button onClick={() => setIsEditing(true)} className="ml-2 text-xs text-[#1a3622] underline font-normal">Edit</button>
            )}
          </div>
        )}

        <div className="col-span-2">
          <span className={`px-2 py-1 text-xs font-bold rounded ${term.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {term.status.toUpperCase()}
          </span>
        </div>
        
        <div className="col-span-2 text-xs text-gray-500">
          {term.status === 'paid' && term.paymentDate && new Date(term.paymentDate).toLocaleDateString()}
          {term.status === 'paid' && term.transactionRef && <><br/>Ref: {term.transactionRef}</>}
        </div>

        <div className="col-span-2 text-right">
          {term.status === 'pending' && !isPaying && (
            <button 
              onClick={() => setIsPaying(true)}
              className="bg-[#1a3622] text-white px-4 py-1 text-xs font-bold rounded hover:bg-[#122618]"
            >
              MARK PAID
            </button>
          )}
        </div>
      </div>

      {isPaying && (
        <div className="bg-gray-50 p-4 border-b border-gray-200 col-span-12">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Method</label>
              <select 
                value={paymentData.paymentMethod} 
                onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                className="w-full p-2 border border-gray-300 bg-white rounded text-sm"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
              <input 
                type="date" 
                value={paymentData.paymentDate} 
                onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})}
                className="w-full p-2 border border-gray-300 bg-white rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transaction Ref</label>
              <input 
                type="text" 
                value={paymentData.transactionRef} 
                onChange={e => setPaymentData({...paymentData, transactionRef: e.target.value})}
                className="w-full p-2 border border-gray-300 bg-white rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-500 uppercase mb-1">Deductions (¥)</label>
              <input 
                type="number" 
                value={paymentData.lessDeductions} 
                onChange={e => setPaymentData({...paymentData, lessDeductions: e.target.value})}
                className="w-full p-2 border border-red-200 text-red-600 bg-white rounded text-sm"
              />
            </div>
          </div>
          
          {paymentData.paymentMethod === 'bank_transfer' && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                <input 
                  type="text" 
                  value={paymentData.bankName} 
                  onChange={e => setPaymentData({...paymentData, bankName: e.target.value})}
                  className="w-full p-2 border border-gray-300 bg-white rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Branch Code</label>
                <input 
                  type="text" 
                  value={paymentData.branchCode} 
                  onChange={e => setPaymentData({...paymentData, branchCode: e.target.value})}
                  className="w-full p-2 border border-gray-300 bg-white rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                <input 
                  type="text" 
                  value={paymentData.accountNumber} 
                  onChange={e => setPaymentData({...paymentData, accountNumber: e.target.value})}
                  className="w-full p-2 border border-gray-300 bg-white rounded text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsPaying(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={() => payMutation.mutate(paymentData)}
              disabled={payMutation.isLoading}
              className="bg-[#1a3622] text-white px-4 py-2 text-sm rounded hover:bg-[#122618] font-bold"
            >
              {payMutation.isLoading ? 'Saving...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const SettlementLedger = ({ caseId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ledger', caseId],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/cases/${caseId}/ledger`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch ledger');
      }
      return res.json();
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading ledger...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>;
  if (!data || !data.ledger) return <div className="p-8 text-center text-gray-500">No settlement ledger found for this case.</div>;

  const { ledger, claims, payments, summary } = data;

  return (
    <div className="max-w-5xl mx-auto bg-[#f8f5f0] p-8 min-h-screen font-mono text-sm shadow-xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-[#1a3622]">SETTLEMENT LEDGER</h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase mt-1">1 CASE SELECTED</p>
        </div>
        <button className="border-2 border-[#1a3622] px-6 py-2 font-bold tracking-widest text-[#1a3622] flex items-center gap-2 hover:bg-[#1a3622] hover:text-white transition-colors">
          <span>🖨️</span> PRINT
        </button>
      </div>

      <div className="border-t-2 border-dashed border-gray-300 pt-6 mb-8 flex justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Payee</p>
          <p className="text-lg font-bold text-gray-900">{ledger.payeeName}</p>
          <p className="text-xs text-gray-500">ID: {ledger.staffId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-500 uppercase">Base Claim Amount</p>
          <p className="text-xl font-bold text-gray-900">¥ {ledger.baseClaimAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 border-b border-gray-200 pb-2">Itemized Claims</h3>
        {claims.length > 0 ? (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim._id} className="flex justify-between items-center text-sm">
                <span className="w-12 text-gray-500">{String(claim.lineNo).padStart(2, '0')}</span>
                <span className="w-32">{claim.claimRef}</span>
                <span className="flex-1 font-medium">{claim.description}</span>
                <span className="w-32 text-gray-500">{new Date(claim.claimDate).toLocaleDateString()}</span>
                <span className="w-24 text-right font-medium">¥ {claim.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No itemized claims found.</p>
        )}
      </div>

      <div className="border-t border-b border-gray-200 py-6 mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Agreed Terms</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Collection / Settlement Method</p>
            <p className="font-bold capitalize">{ledger.agreedTerms.settlementMethod.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Installment Plan</p>
            <p className="font-bold capitalize">{ledger.agreedTerms.installmentPlan.replace('_', ' ')} ({ledger.agreedTerms.installmentTotalTerms} Months)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Start Month</p>
            <p className="font-bold">{new Date(ledger.agreedTerms.startMonth).toISOString().slice(0, 7)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Ledger Status</p>
            <p className="font-bold uppercase">{ledger.status.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#1a3622] mb-4 border-b border-[#1a3622] pb-2">INSTALLMENT SCHEDULE</h3>
        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase border-b pb-2">
          <div className="col-span-1">Term</div>
          <div className="col-span-2">Due Month</div>
          <div className="col-span-3">Net Payable</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Details</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        
        {payments.map(term => (
          <TermRow 
            key={term._id} 
            term={term} 
            caseId={caseId} 
            defaultMethod={ledger.agreedTerms.settlementMethod} 
          />
        ))}
      </div>

      <div className="mt-12 border-t-2 border-[#1a3622] pt-6 flex justify-between items-end">
        <p className="text-xs font-bold text-gray-500 uppercase">Remaining Balance (Post-Payment)</p>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#1a3622] mb-1">¥ {summary.remainingBalance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SettlementLedger;
