import { useState, useEffect } from 'react';
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
    if (user.role === 'hr') return '人事部門';
    if (user.role === 'account') return '経理部門';
    if (user.role === 'support') return 'サポート部門';
    return 'B2B部門';
  });

  // Guard: if non-admin user lands on generic 'Dashboard', route to their department dashboard
  useEffect(() => {
    if (activeTab === 'Dashboard' && user.role && user.role !== 'admin') {
      if (user.role === 'hr') setActiveTab('人事部門');
      else if (user.role === 'account') setActiveTab('経理部門');
      else if (user.role === 'support') setActiveTab('サポート部門');
    }
  }, [activeTab, user.role]);
  const [openMenus, setOpenMenus] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#333333] font-sans overflow-hidden print:block print:overflow-visible print:h-auto">
      {/* Sidebar */}
      <div className="h-full print:hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openMenus={openMenus}
          toggleMenu={toggleMenu}
          setToken={setToken}
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 print:block print:overflow-visible print:h-auto">
        {/* Header */}
        <div className="print:hidden">
          <Header activeTab={activeTab} user={user} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
        </div>

        <div className="flex-1 overflow-auto p-2.5 sm:p-4 md:p-6 lg:p-8 print:overflow-visible print:p-0">
          {activeTab === 'Dashboard' && (
            user.role === 'hr' ? <HRDashboard setParentActiveTab={setActiveTab} /> :
            user.role === 'account' ? <AccountDashboard /> :
            user.role === 'support' ? <SupportDashboard setActiveTab={setActiveTab} /> :
            <DashboardHome setActiveTab={setActiveTab} />
          )}
          {activeTab === '経理部門' && <AccountDashboard />}
          {activeTab === '人事部門' && <HRDashboard setParentActiveTab={setActiveTab} />}
          {activeTab === 'New Case' && <NewCase setActiveTab={setActiveTab} />}
          {activeTab === 'Case List' && <CaseList setActiveTab={setActiveTab} />}
          {activeTab === 'Payment Entry' && <PaymentEntry />}
          {activeTab === 'Paid Status' && <PaymentStatus />}
          {activeTab === 'Staff Registration' && <StaffRegistration setActiveTab={setActiveTab} />}
          {activeTab === 'Staff List' && <StaffList setActiveTab={setActiveTab} />}
          {activeTab === 'Assign Work Place' && <AssignWorkPlace />}
          {activeTab === 'Visa Management' && <VisaManagement />}
          {activeTab === 'Resignation' && <Resignation />}
          {activeTab === 'サポート部門' && <SupportDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'Staff Claim Request' && <StaffClaimRequest />}
          {activeTab === 'Claim List' && <CaseList setActiveTab={setActiveTab} />}
          {activeTab === 'Admin New Registration' && <AdminNewRegistration setActiveTab={setActiveTab} initialRole="account" fromTab="Dashboard" />}
          {(activeTab === 'Support User Management' || activeTab === 'サポート担当管理') && <AdminUserList setActiveTab={setActiveTab} filterRole="support" fromTab="人事部門" />}
          {(activeTab === 'Support User Registration' || activeTab === 'サポート担当登録') && <AdminNewRegistration setActiveTab={setActiveTab} initialRole="support" fromTab="Support User Management" lockRole="support" />}
          {activeTab === 'Admin User List' && <AdminUserList setActiveTab={setActiveTab} />}
          {activeTab === 'Settings' && <Settings user={user} />}
          {activeTab === 'Expense SetUp' && <ExpenseSetup />}
          {activeTab === 'B2B部門' && <B2BDashboard />}
          {activeTab !== 'Dashboard' && activeTab !== '経理部門' && activeTab !== '人事部門' && activeTab !== 'New Case' && activeTab !== 'Case List' && activeTab !== 'Payment Entry' && activeTab !== 'Paid Status' && activeTab !== 'Staff Registration' && activeTab !== 'Staff List' && activeTab !== 'Assign Work Place' && activeTab !== 'Visa Management' && activeTab !== 'Resignation' && activeTab !== 'サポート部門' && activeTab !== 'Staff Claim Request' && activeTab !== 'Claim List' && activeTab !== 'Admin New Registration' && activeTab !== 'Support User Registration' && activeTab !== 'サポート担当登録' && activeTab !== 'Support User Management' && activeTab !== 'サポート担当管理' && activeTab !== 'Admin User List' && activeTab !== 'Settings' && activeTab !== 'Expense SetUp' && activeTab !== 'B2B部門' && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>{activeTab} のコンテンツはまだ実装されていません。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
