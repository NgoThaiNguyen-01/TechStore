# Tech Store - E-commerce Platform

A full-stack e-commerce platform built with React, Node.js, and MongoDB. This project features a robust consumer interface and a comprehensive admin dashboard for managing products, orders, users, and more.

## 🚀 Features

### Consumer Interface
- **Product Browsing**: Filter by categories and brands.
- **Shopping Cart**: Add, remove, and update products in the cart.
- **Order Management**: Track orders and view order history.
- **User Accounts**: Registration, login, and profile settings.
- **Wishlist**: Save favorite products for later.
- **Coupons & Vouchers**: Apply discounts to orders.

### Admin Dashboard
- **Product & Category Management**: CRUD operations for products and categories.
- **Order Processing**: Manage customer orders and after-sales cases.
- **User & Role Management**: RBAC (Role-Based Access Control) for admins and users.
- **Analytics**: View sales and user statistics.
- **Marketing Tools**: Manage coupons, flash sales, and posts.
- **Activity Logs**: Track administrative actions.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Axios, Lucide React, Sonner (Toasts), TailwindCSS (for styling - glassmorphism & modern design).
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Authentication, Bcryptjs.
- **Storage**: Multer for high-performance file uploads.

## 📁 Project Structure

```text
tech-store/
├── frontend/               # React client application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Admin and consumer pages
│   │   ├── services/       # API integration layers
│   │   └── utils/          # Helper functions
├── backend/                # Node.js Express server
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Complex logic & integrations
│   │   └── seed/           # Database seeding scripts
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)

### Installation & Quick Start

1. **Clone and Install everything**:
   ```bash
   git clone https://github.com/NgoThaiNguyen-01/TechStore.git
   cd tech-store
   npm run install:all    # This installs root, backend, and frontend dependencies
   ```

2. **Database Setup**:
   ```bash
   # Configure your .env in the backend folder first
   npm run seed           # Seeds both RBAC and base admin data
   ```

3. **Run both Backend & Frontend**:
   ```bash
   npm run dev            # Starts both servers concurrently
   ```

## 🛠️ Individual Commands
- `npm run dev:backend`: Run only the backend.
- `npm run dev:frontend`: Run only the frontend.
- `npm run build`: Build both projects for production.

## 📜 License
This project is licensed under the ISC License.
