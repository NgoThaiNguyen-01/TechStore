# Tech Store - Frontend

This is the React-based frontend application for the Tech Store e-commerce platform. It is powered by Vite for a fast development experience and high-performance production builds.

## 🛠️ Features
- **Dynamic Routing**: SSR-ready routing with React Router 7.
- **State Management**: Local state management with React hooks and persistent storage for cart/auth.
- **Modern UI**: Tailored design with dark mode support and micro-animations.
- **Admin Panel**: Full-featured administrative interface with role-based access.
- **Responsive Images**: Optimized asset loading and handling.

## 📁 Structure
- `src/components`: UI primitives and composite components (Pagination, Modals, etc).
- `src/pages`: Main view components for both public and admin routes.
- `src/services`: API client definitions using Axios.
- `src/utils`: Utility functions for auth, cart, shipping, and more.

## 🚀 Setup
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start development server**:
   ```bash
   npm run dev
   ```
3. **Build for production**:
   ```bash
   npm run build
   ```

## 🔌 API Integration
The frontend communicates with a Node.js backend. Ensure the backend is running and the API URLs in `src/services/axiosConfig.js` (if applicable) are correctly configured.
