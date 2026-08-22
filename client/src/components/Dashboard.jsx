import { useState } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import DashboardHome from './dashboard/DashboardHome';
import AccountDashboard from './account/AccountDashboard';
import NewCase from './account/NewCase';
import CaseList from './account/CaseList';
import PaymentStatus from './account/PaymentStatus';
import HRDashboard from './hr/HRDashboard';
import StaffRegistration from './hr/StaffRegistration';
import StaffList from './hr/StaffList';
import VisaManagement from './hr/VisaManagement';
import Resignation from './hr/Resignation';
import SupportDashboard from './support/SupportDashboard';
import StaffClaimRequest from './support/StaffClaimRequest';
import ClaimList from './support/ClaimList';
import AdminNewRegistration from './admin/AdminNewRegistration';
import AdminUserList from './admin/AdminUserList';
import Settings from './settings/Settings';

export default function Dashboard({ setToken }) {
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'admin', username: 'admin' };
  
  const [activeTab, setActiveTab] = useState(() => {
    if (user.role === 'hr') return 'HR Department';
    if (user.role === 'account') return 'Account Department';
    if (user.role === 'support') return 'Support Department';
    return 'Dashboard';
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
          {activeTab === 'New Case' && <NewCase />}
          {activeTab === 'Case List' && <CaseList />}
          {activeTab === 'Payment Status' && <PaymentStatus />}
          {activeTab === 'Staff Registration' && <StaffRegistration />}
          {activeTab === 'Staff List' && <StaffList />}
          {activeTab === 'Visa Management' && <VisaManagement />}
          {activeTab === 'Resignation' && <Resignation />}
          {activeTab === 'Support Department' && <SupportDashboard />}
          {activeTab === 'Staff Claim Request' && <StaffClaimRequest />}
          {activeTab === 'Claim List' && <ClaimList />}
          {activeTab === 'Admin New Registration' && <AdminNewRegistration setActiveTab={setActiveTab} />}
          {activeTab === 'Admin User List' && <AdminUserList setActiveTab={setActiveTab} />}
          {activeTab === 'Settings' && <Settings user={user} />}
          {activeTab !== 'Dashboard' && activeTab !== 'Account Department' && activeTab !== 'HR Department' && activeTab !== 'New Case' && activeTab !== 'Case List' && activeTab !== 'Payment Status' && activeTab !== 'Staff Registration' && activeTab !== 'Staff List' && activeTab !== 'Visa Management' && activeTab !== 'Resignation' && activeTab !== 'Support Department' && activeTab !== 'Staff Claim Request' && activeTab !== 'Claim List' && activeTab !== 'Admin New Registration' && activeTab !== 'Admin User List' && activeTab !== 'Settings' && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Content for {activeTab} is not yet implemented.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
