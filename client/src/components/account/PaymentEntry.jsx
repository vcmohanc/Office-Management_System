import { useState } from 'react';
import { Landmark, Users, Briefcase, ArrowRight, ArrowLeft, Building2, Building } from 'lucide-react';
import PaymentEntryForm from './PaymentEntryForm';

export default function PaymentEntry() {
  const [selectedEntryType, setSelectedEntryType] = useState(null);

  const paymentOptions = [
    {
      id: 'client',
      title: 'Client Payment',
      description: 'Record incoming payments from clients for services rendered.',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-200 hover:border-blue-500'
    },
    {
      id: 'staff',
      title: 'Staff Payment / Advance',
      description: 'Process salary, advances, or expense reimbursements for staff.',
      icon: Briefcase,
      color: 'bg-green-100 text-green-700',
      borderColor: 'border-green-200 hover:border-green-500'
    },
    {
      id: 'vc_fund',
      title: 'VC Fund Transfer',
      description: 'Log fund transfers and recoveries related to VC fund management.',
      icon: Landmark,
      color: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-200 hover:border-purple-500'
    },
    {
      id: 'vendor',
      title: 'Vendor / Host Company',
      description: 'Process payments to external vendors or host companies.',
      icon: Building,
      color: 'bg-orange-100 text-orange-700',
      borderColor: 'border-orange-200 hover:border-orange-500'
    }
  ];

  if (selectedEntryType) {
    return <PaymentEntryForm onBack={() => setSelectedEntryType(null)} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">Payment Entry Selection</h2>
          <p className="text-gray-500 text-sm">Please select the type of payment entry you want to process.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div 
              key={option.id}
              onClick={() => setSelectedEntryType(option.id)}
              className={`bg-white rounded-xl border ${option.borderColor} p-6 cursor-pointer shadow-sm hover:shadow-md transition-all group flex flex-col`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${option.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#162D50] transition-colors">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-[#162D50] mb-2">{option.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {option.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
