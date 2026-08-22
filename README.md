# Office Management System (OMS)

A modern, full-stack web application for internal office management, built with the MERN stack (MongoDB, Express, React, Node.js) and styled with Tailwind CSS.

## Features

This system provides role-based access to various departmental tools, ensuring that employees and administrators have access to exactly what they need.

### 🛡️ Core & Admin
- **Role-Based Authentication:** Secure login using JWTs.
- **Admin Dashboard:** Overview of system KPIs, recent team activity, and quick access to administrative tools.
- **User Management:** Create new user accounts and assign them to specific departments (Admin, HR, Account, Support).
- **Settings:** View profile information and securely update passwords.

### 👥 HR Department
- **Staff Registration:** Comprehensive form to onboard new employees, collecting personal details, employment status, and bank information.
- **Staff List:** View and manage all registered employees.
- **Visa Management:** Track visa statuses and expiration dates for international staff.
- **Resignation:** Process and manage employee resignations.

### 💰 Account Department
- **New Case:** Open new financial or client cases.
- **Case List:** Track and manage ongoing cases.
- **Payment Status:** Monitor incoming and outgoing payments, settlements, and recoveries.

### 🛠️ Support Department
- **Staff Claim Request:** Allow staff to submit expense claims, travel reimbursements, or advances with integrated project and payment method selection.
- **Claim List:** A centralized view to review, filter (by month), and track the status of all submitted claims (Scheduled, Processing, Completed).

## Tech Stack

**Frontend:**
- [React](https://reactjs.org/) (bootstrapped with [Vite](https://vitejs.dev/))
- [Tailwind CSS v4](https://tailwindcss.com/) for rapid, utility-first styling
- [Lucide React](https://lucide.dev/) for clean and consistent iconography
- React Router DOM for client-side routing

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with Mongoose for database modeling
- `jsonwebtoken` for secure API authentication
- `bcryptjs` for password hashing

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas URI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vcmohanc/Office-Management_System.git
   cd Office-Management_System
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup:**
   Create a `.env` file in the `server` directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```

### Running the Application

1. **Start the Backend Server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the Application:**
   Open your browser and navigate to `http://localhost:5173`.

### Default Admin Login
On the first run, the system will automatically seed a default admin account.
- **Username:** `admin`
- **Password:** `password123`

## Architecture

The application uses a modular folder structure. The frontend routes are managed centrally in `Dashboard.jsx`, rendering specific department components conditionally based on the active sidebar tab and user role. The backend serves RESTful JSON endpoints.
