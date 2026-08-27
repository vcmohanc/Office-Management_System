import { useState } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import DashboardHome from './dashboard/DashboardHome';
import AccountDashboard from './account/AccountDashboard';
import NewCase from './account/NewCase';
import CaseList from './account/CaseList';
import PaymentStatus from './account/PaymentStatus';
import StaffRegistration from './hr/StaffRegistration';
import StaffList from './hr/StaffList';
import VisaManagement from './hr/VisaManagement';
import Resignation from './hr/Resignation';
import AdminNewRegistration from './admin/AdminNewRegistration';
import AdminUserList from './admin/AdminUserList';
import ExpenseTypeMaster from './admin/ExpenseTypeMaster';
import ServiceStaffMaster from './admin/ServiceStaffMaster';
import HostFarmerMaster from './admin/HostFarmerMaster';
import PostageRateMaster from './admin/PostageRateMaster';
import InstallmentSettings from './admin/InstallmentSettings';
import Settings from './settings/Settings';
import { ROLES } from '../constants/roles';
import { DEFAULT_TAB_BY_ROLE } from '../constants/navigation';

export default function Dashboard({ setToken }) {
  const user = JSON.parse(localStorage.getItem('user')) || { role: ROLES.ADMIN, username: 'admin' };

  const [activeTab, setActiveTab] = useState(() => DEFAULT_TAB_BY_ROLE[user.role] || 'settings');
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'new-case': return <NewCase />;
      case 'my-cases': return <CaseList />;
      case 'review-queue': return <CaseList />;
      case 'accounting-home': return <AccountDashboard />;
      case 'payment-processing': return <PaymentStatus />;
      case 'admin-home': return <DashboardHome setActiveTab={setActiveTab} />;
      case 'admin-new-registration': return <AdminNewRegistration setActiveTab={setActiveTab} />;
      case 'admin-user-list': return <AdminUserList setActiveTab={setActiveTab} />;
      case 'expense-type-master': return <ExpenseTypeMaster />;
      case 'staff-master': return <ServiceStaffMaster />;
      case 'farmer-master': return <HostFarmerMaster />;
      case 'postage-rate-master': return <PostageRateMaster />;
      case 'installment-settings': return <InstallmentSettings />;
      case 'hr-staff-registration': return <StaffRegistration />;
      case 'hr-staff-list': return <StaffList />;
      case 'hr-visa-management': return <VisaManagement />;
      case 'hr-resignation': return <Resignation />;
      case 'settings': return <Settings user={user} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>このページはまだ実装されていません。</p>
          </div>
        );
    }
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
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
