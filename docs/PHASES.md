# Development Phases

The OMS project was built iteratively using a phased approach to ensure stability and precise alignment with UI/UX requirements.

## Phase 1: Foundation & Authentication
- Set up the MERN stack architecture (Vite + React, Node + Express).
- Implemented Tailwind CSS v4.
- Created MongoDB User schemas and JWT-based authentication routes.
- Built the `Login.jsx` screen and protected the main application wrapper.

## Phase 2: Navigation & Core Dashboard
- Built the core layout wrapper (`Header.jsx`, `Sidebar.jsx`).
- Implemented state-based routing (`activeTab`) to avoid full page reloads and complex URL management for the internal portal.
- Created the main `DashboardHome.jsx` (Overview) with stat cards and recent activity tables.

## Phase 3: Department Modules Implementation
- **HR Department:** Implemented sub-routes for Staff Registration, Staff List, Visa Management, and Resignation. Focus on complex form layouts and grid structures.
- **Account Department:** Implemented sub-routes for New Case, Case List, and Payment Status. Focus on financial data presentation.
- **Support Department:** Implemented Staff Claim Request and Claim List. Added file upload UI and expense category selectors.

## Phase 4: Polish & Settings
- Implemented `Settings.jsx` to allow users to view their profile and change their password.
- Added role-based rendering to the sidebar (e.g., HR users only see HR tabs).
- Replaced all dropdowns with flat navigation buttons based on user feedback.
- Finalized English translations for all UI components.

## Phase 5: Backend Integration (Upcoming)
- Wire up frontend forms to backend REST APIs.
- Create Mongoose schemas for Staff, Cases, and Claims.
- Implement data validation and error handling.
