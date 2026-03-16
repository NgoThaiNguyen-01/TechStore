# Tech Store - Backend

The server-side application for Tech Store, providing a RESTful API built with Express.js and MongoDB.

## 🛠️ Features
- **RBAC (Role-Based Access Control)**: Secure management of roles and permissions.
- **Authentication**: JWT-based auth with refresh token support.
- **File Uploads**: High-performance image processing with Multer.
- **Validation**: Strict request validation using `express-validator`.
- **Momo Payment Integration**: Support for Momo e-wallet payments.
- **Real-time**: Real-time service integrations for live updates.

## 📁 Structure
- `src/controllers`: Request handlers and route logic.
- `src/models`: Mongoose schemas for MongoDB.
- `src/routes`: API route definitions.
- `src/services`: Core logic for payments, RBAC, shipping, and more.
- `src/validation`: Reusable validation logic for critical endpoints.

## 🚀 Setup
1. **Initialize Environment**:
   ```bash
   cp .env.example .env
   # Fill in your MONGODB_URI, JWT_SECRET, etc.
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Database Seeding**:
   ```bash
   npm run seed:rbac      # Initialize roles/permissions
   npm run seed:admins    # Create default admin accounts
   ```
4. **Run Server**:
   ```bash
   npm run dev            # Development mode with Nodemon
   npm start              # Production mode
   ```

## 🧪 Testing
- `npm run test:policy`: Test Super Admin policies.
- `npm run test:validation`: Test registration form validation logic.
