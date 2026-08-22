# Project Memory (Current State)

## Current Status
- **Authentication:** Fully functional (Login, Register new admin/user, Update Password).
- **Frontend Dashboard:** Fully implemented and wired. State-based navigation works smoothly across 4 main departments (Admin, Account, HR, Support).
- **Backend API:** Basic auth and some dashboard routes are active. Most department-specific forms are currently UI-only (submitting to `console.log`) and require backend API implementations in future phases.

## Implemented Components
- **Admin:** `DashboardHome.jsx`, `AdminNewRegistration.jsx`
- **HR:** `HRDashboard.jsx`, `StaffRegistration.jsx`, `StaffList.jsx`, `VisaManagement.jsx`, `Resignation.jsx`
- **Account:** `AccountDashboard.jsx`, `NewCase.jsx`, `CaseList.jsx`, `PaymentStatus.jsx`
- **Support:** `SupportDashboard.jsx`, `StaffClaimRequest.jsx`, `ClaimList.jsx`
- **Global:** `Settings.jsx`, `Header.jsx`, `Sidebar.jsx`, `Login.jsx`

## Known Limitations / Next Steps
1. **API Integration:** Form submissions (e.g., Staff Registration, Claim Requests) need corresponding Express routes and MongoDB schemas.
2. **Data Fetching:** Tables (Staff List, Case List, Claim List) are currently populated with hardcoded mock data. They need to be wired to `useEffect` hooks fetching from the backend.
3. **Role Enforcement:** The backend `/register` route allows passing a `role`. A strict middleware should be added to ensure only `admin` users can hit the `/register` endpoint to create new accounts.
4. **Error Handling:** Add global toast notifications for success/error states instead of just inline text messages.
