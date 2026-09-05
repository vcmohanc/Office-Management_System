import { useState } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import DashboardHome from './dashboard/DashboardHome';
import AccountDashboard from './account/AccountDashboard';
import NewCase from './account/NewCase';
import CaseList from './account/CaseList';
import PaymentStatus from './account/PaymentStatus';
import PaymentEntry from './account/PaymentEntry';
import ExpenseSetup from './account/ExpenseSetup';
import HRDashboard from './hr/HRDashboard';
import StaffRegistration from './hr/StaffRegistration';
import StaffList from './hr/StaffList';
import AssignWorkPlace from './hr/AssignWorkPlace';
import VisaManagement from './hr/VisaManagement';
import Resignation from './hr/Resignation';
import SupportDashboard from './support/SupportDashboard';
import StaffClaimRequest from './support/StaffClaimRequest';
import ClaimList from './support/ClaimList';
import AdminNewRegistration from './admin/AdminNewRegistration';
import AdminUserList from './admin/AdminUserList';
import Settings from './settings/Settings';
import B2BDashboard from './b2b/B2BDashboard';

export default function Dashboard({ setToken }) {
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'admin', username: 'admin' };
  
  const [activeTab, setActiveTab] = useState(() => {
    if (user.role === 'hr') return 'HR Department';
    if (user.role === 'account') return 'Account Department';
    if (user.role === 'support') return 'Support Department';
    return 'B2B Department';
  });
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#333333] font-sans">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openMenus={openMenus} 
        toggleMenu={toggleMenu} 
        setToken={setToken} 
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header activeTab={activeTab} user={user} setActiveTab={setActiveTab} />

        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'Dashboard' && <DashboardHome setActiveTab={setActiveTab} />}
          {activeTab === 'Account Department' && <AccountDashboard />}
          {activeTab === 'HR Department' && <HRDashboard />}
          {activeTab === 'New Case' && <NewCase setActiveTab={setActiveTab} />}
          {activeTab === 'Case List' && <CaseList />}
          {activeTab === 'Payment Status' && <PaymentStatus />}
          {activeTab === 'Payment Entry' && <PaymentEntry />}
          {activeTab === 'Staff Registration' && <StaffRegistration setActiveTab={setActiveTab} />}
          {activeTab === 'Staff List' && <StaffList setActiveTab={setActiveTab} />}
          {activeTab === 'Assign Work Place' && <AssignWorkPlace />}
          {activeTab === 'Visa Management' && <VisaManagement />}
          {activeTab === 'Resignation' && <Resignation />}
          {activeTab === 'Support Department' && <SupportDashboard />}
          {activeTab === 'Staff Claim Request' && <StaffClaimRequest />}
          {activeTab === 'Claim List' && <ClaimList />}
          {activeTab === 'Admin New Registration' && <AdminNewRegistration setActiveTab={setActiveTab} />}
          {activeTab === 'Admin User List' && <AdminUserList setActiveTab={setActiveTab} />}
          {activeTab === 'Settings' && <Settings user={user} />}
          {activeTab === 'Expense SetUp' && <ExpenseSetup />}
          {activeTab === 'B2B Department' && <B2BDashboard />}
          {activeTab !== 'Dashboard' && activeTab !== 'Account Department' && activeTab !== 'HR Department' && activeTab !== 'New Case' && activeTab !== 'Case List' && activeTab !== 'Payment Status' && activeTab !== 'Payment Entry' && activeTab !== 'Staff Registration' && activeTab !== 'Staff List' && activeTab !== 'Assign Work Place' && activeTab !== 'Visa Management' && activeTab !== 'Resignation' && activeTab !== 'Support Department' && activeTab !== 'Staff Claim Request' && activeTab !== 'Claim List' && activeTab !== 'Admin New Registration' && activeTab !== 'Admin User List' && activeTab !== 'Settings' && activeTab !== 'Expense SetUp' && activeTab !== 'B2B Department' && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Content for {activeTab} is not yet implemented.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
