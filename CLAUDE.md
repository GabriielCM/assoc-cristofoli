# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (TypeScript compile + Vite build)
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Architecture

This is a **React 19 + TypeScript PWA** for the Associação Cristofoli member portal. It manages space rentals, digital membership cards, events, and a points system.

### Tech Stack
- **Vite 7** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Zustand** - State management with localStorage persistence
- **Tailwind CSS** - Styling with custom color theme (primary: #0066CC, secondary: #00A86B, accent: #FF6B35)
- **html5-qrcode** - QR code scanning
- **qrcode.react** - QR code generation
- **date-fns** - Date manipulation
- **Lucide React** - Icons

### Project Structure

```
src/
├── App.tsx              # Routes with ProtectedRoute, AdminRoute, PublicRoute guards
├── components/
│   ├── layout/          # Header, Sidebar, BottomNav, Layout
│   └── ui/              # Button, Card, Modal, Input, Badge, Avatar, Alert, Loader
├── pages/
│   ├── admin/           # Dashboard, UsersManagement, SpacesManagement, EventsManagement, BookingsManagement
│   └── user/            # Home, Spaces, Membership, Events, Points, Profile
├── store/
│   ├── useAuthStore.ts  # Auth state (user, isAuthenticated, login/logout)
│   └── useStore.ts      # App state (users, spaces, bookings, events, pointTransactions)
└── types/
    └── index.ts         # TypeScript interfaces: User, Space, Booking, Event, PointTransaction, AppState, AuthState
```

### State Management

Two Zustand stores with `persist` middleware (localStorage):
- **useAuthStore** (`ahub-auth`) - Authentication state, reads users from useStore for login validation
- **useStore** (`ahub-storage`) - All domain data with CRUD operations for users, spaces, bookings, events, and points

### Key Domain Concepts

- **Users** have roles (`admin` | `user`), points, registration number, 1-year membership validity
- **Spaces** are rentable venues (Área Gourmet R$350, Salão de Festas R$1250) with date conflict prevention
- **Events** have dynamic QR codes that expire hourly, configurable points, and per-user scan limits
- **Points** are earned by scanning event QR codes, stored as transactions, never expire

### Route Guards

- `ProtectedRoute` - Requires authentication
- `AdminRoute` - Requires authentication + admin role
- `PublicRoute` - Redirects authenticated users to home

### Demo Credentials

- Admin: `admin@cristofoli.com.br` / `admin123`
- User: `associado@cristofoli.com.br` / `user123`
