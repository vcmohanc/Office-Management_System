# Product Requirements Document (PRD)

## 1. Objective
Build an internal Office Management System (OMS) to streamline cross-departmental workflows including HR, Accounting, and Support. The system must be fast, visually appealing, and enforce role-based access.

## 2. Target Audience
Internal employees of the organization, specifically:
- **System Administrators:** Need oversight of all departments and the ability to provision new user accounts.
- **HR Staff:** Need to manage employee lifecycles (registration, visas, resignations).
- **Account Staff:** Need to manage financial cases and payment statuses.
- **Support Staff:** Need to manage internal claims and expenses.

## 3. Core Features

### 3.1 Authentication & Authorization
- Secure login portal.
- Role-based Access Control (RBAC). Users only see navigation items pertinent to their assigned role.

### 3.2 Admin Features
- High-level overview dashboard (Pending Settlements, Awaiting Recoveries, Monthly Totals).
- Ability to create new user accounts and assign roles.

### 3.3 Human Resources (HR)
- **Staff Registration:** Collect comprehensive employee data (Personal, Employment, Bank).
- **Staff List:** View all staff members in a tabular format.
- **Visa Management:** Monitor visa expiration dates.
- **Resignation:** Handle employee offboarding workflows.

### 3.4 Accounting
- **New Case:** Open new financial files.
- **Case List:** Review active financial cases.
- **Payment Status:** Monitor financial health and outstanding payments.

### 3.5 Support
- **Claim Request:** Allow staff to submit expense claims with receipts/attachments.
- **Claim List:** Review and process submitted claims.

## 4. Non-Functional Requirements
- **Performance:** Instant page transitions (achieved via React state routing).
- **Aesthetics:** Clean, airy, and professional UI. No cluttered screens.
- **Language:** Strictly English interface.
- **Responsiveness:** Usable on desktop monitors (primary use case).
