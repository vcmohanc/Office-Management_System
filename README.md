# Office Management System (OMS)

A complete full-stack web application built with React, Tailwind CSS, Node.js, Express, and MongoDB.

## Project Structure

This project is a monorepo containing two main directories:
- `client/`: The React frontend application (Vite + Tailwind CSS).
- `server/`: The Node.js/Express backend API.

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB (Local instance or Atlas URI)

## Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory with the following variables (or adjust as needed):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/oms
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Features

- **Single Page Application (SPA)**: Smooth navigation without page reloads.
- **Authentication**: JWT-based secure login system.
- **Dashboard**: Protected route to view office management data.
- **Modern UI**: Styled with Tailwind CSS for a responsive, clean look.
