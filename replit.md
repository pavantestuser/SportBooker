# Sports Booking and Management System

## Overview

This is a comprehensive sports booking and management system built as a full-stack web application. The system supports both public and private organizations with role-based access control, facility management, slot booking with advanced restrictions, coupon management, and push notifications. It's designed to handle complex booking scenarios with features like group restrictions, full court bookings, and multi-slot combinations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Bcrypt for password hashing, session-based auth
- **Real-time**: Firebase Cloud Messaging for push notifications

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with code-first schema definition
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Generated in `./migrations` directory

### Authentication & Authorization
- **Multi-role System**: App Admin, Organization Admin, Staff, User
- **Session-based**: Express sessions with role switching capability
- **Organization Access**: Private orgs require explicit user mapping
- **Permission System**: Role-based access control with organization context

### Core Business Logic
- **Organizations**: Support for public/private organization types
- **Facilities & Courts**: Hierarchical structure (Org → Facility → Court)
- **Slot Management**: Advanced booking slots with restrictions
- **Booking System**: Individual and full-court booking options
- **Group Management**: User groups for access control
- **Coupon System**: Multiple coupon types (fixed, percentage, conditional)

### Frontend Features
- **Responsive Design**: Mobile-first approach with Tailwind
- **Real-time Updates**: Query invalidation for live data sync
- **Component Library**: Comprehensive UI components from shadcn/ui
- **Form Handling**: React Hook Form with Zod validation
- **Toast Notifications**: User feedback system

## Data Flow

### Authentication Flow
1. User logs in via `/api/login` endpoint
2. Session created with user ID and current role
3. Role switching available via `/api/switch-role`
4. Frontend queries `/api/me` for user context
5. All API requests include session cookies

### Booking Flow
1. User selects organization, facility, and court
2. Available slots fetched with restrictions applied
3. Booking eligibility checked server-side
4. Coupon validation (if applicable)
5. Payment processing simulation
6. Booking confirmation with push notification

### Permission System
- App Admins: Full system access
- Org Admins: Organization-specific management
- Staff: Facility and slot management within assigned org
- Users: Booking access based on org type and group membership

## External Dependencies

### Core Dependencies
- **Database**: Neon serverless PostgreSQL
- **UI Framework**: React with Radix UI primitives
- **Styling**: Tailwind CSS with custom sports theme
- **State Management**: TanStack Query for API state
- **Validation**: Zod schemas for type-safe validation
- **Date Handling**: date-fns for date operations

### Development Tools
- **TypeScript**: Full type safety across the stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Production build optimization
- **Drizzle Kit**: Database schema management

### Optional Integrations
- **Firebase**: Push notifications (gracefully degrades if not configured)
- **Payment Gateway**: Simulated payments (ready for real integration)

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to `dist/public`
2. **Backend Build**: ESBuild bundles server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push`

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key
- **FIREBASE_***: Firebase configuration (optional)
- **NODE_ENV**: Environment detection

### Scripts
- `dev`: Development server with hot reload
- `build`: Production build for both frontend and backend
- `start`: Production server startup
- `db:push`: Apply database schema changes

### Architecture Benefits
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Developer Experience**: Hot reload, error overlays, and type checking
- **Scalability**: Role-based access control supports multi-tenant scenarios
- **Flexibility**: Plugin architecture for optional features like Firebase
- **Maintainability**: Clear separation of concerns and shared utilities

The system is designed to be production-ready with proper error handling, validation, and security measures while maintaining excellent developer experience and code organization.