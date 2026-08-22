# Architecture Document

## Overview
The Office Management System (OMS) is a modern, decoupled monolithic web application utilizing the MERN stack (MongoDB, Express.js, React, Node.js). 

## High-Level Architecture

```mermaid
graph TD
    Client[Client (React/Vite)]
    API[REST API (Express/Node)]
    DB[(Database - MongoDB)]
    
    Client -- HTTP/JSON --> API
    API -- Mongoose --> DB
```

## Frontend (Client)
- **Framework:** React 18, bootstrapped with Vite for extremely fast Hot Module Replacement (HMR) and optimized build speeds.
- **Styling:** Tailwind CSS v4 is used extensively for utility-first styling. No separate CSS files are used for component styling; everything is inline classes.
- **Routing:** Handled via custom state-based routing (`activeTab` pattern) within the main `Dashboard.jsx` to avoid complex URL state management for internal portal views, though React Router is used for top-level separation (Login vs Dashboard).
- **Icons:** `lucide-react` is the sole iconography provider, ensuring a consistent SVG-based design language.

## Backend (Server)
- **Framework:** Express.js running on Node.js.
- **Authentication:** Stateless authentication using JSON Web Tokens (JWT). Tokens are verified via a custom Express middleware (`middleware/auth.js`).
- **Data Persistence:** MongoDB, accessed via Mongoose ODM.
- **API Structure:** RESTful pattern. Routes are modularized inside the `server/routes/` directory (e.g., `auth.js`, `dashboard.js`).

## Data Flow (Auth Example)
1. User submits credentials on `/login`.
2. Frontend sends `POST /api/auth/login`.
3. Backend validates against MongoDB via `bcrypt.compare()`.
4. Backend generates a JWT (signed with `JWT_SECRET`) and returns it.
5. Frontend stores the JWT in `localStorage` and redirects to the Dashboard.
6. Subsequent API requests attach the JWT in the `Authorization: Bearer <token>` header.
