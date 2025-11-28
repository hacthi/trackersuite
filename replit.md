# Suite Tracker - Client Relationship System

## Overview

This is a full-stack HR CRM (Customer Relationship Management) system built with React, Express.js, and PostgreSQL. The application helps HR professionals manage client relationships, track interactions, and schedule follow-ups efficiently.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and bundling
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Validation**: Zod schemas for type-safe data validation
- **Storage**: PostgreSQL database with persistent storage using Drizzle ORM

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Route components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and API client
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data layer abstraction with PostgreSQL
│   ├── db.ts         # Database connection and configuration
│   └── vite.ts       # Development server setup
├── shared/           # Shared TypeScript types and schemas
└── drizzle.config.ts # Drizzle ORM configuration
```

## Key Components

### Data Models
- **Clients**: Core client information (name, email, phone, company, status, notes)
- **Follow-ups**: Scheduled tasks with due dates and completion tracking
- **Interactions**: Historical record of client communications
- **Users**: Basic user management (prepared for future auth)

### API Endpoints
- **Client Management**: CRUD operations for clients with search functionality
- **Follow-up Management**: Create, update, and track follow-up tasks
- **Interaction Management**: Log and track client communications
- **Dashboard**: Statistics and overview data aggregation
- **Export**: Data export functionality for reporting

### UI Components
- **Dashboard**: Overview with statistics and recent activity
- **Client Management**: List, create, edit, and delete clients
- **Follow-up Management**: Task scheduling and completion tracking
- **Communication Tracker**: Log interactions with clients
- **Advanced Reporting**: Comprehensive analytics and data visualization
- **Data Export**: Export clients and follow-ups to CSV/JSON

## Data Flow

1. **Client Interaction**: User interacts with React components
2. **API Communication**: TanStack Query handles HTTP requests to Express API
3. **Data Processing**: Express routes validate input using Zod schemas
4. **Storage Layer**: Abstract storage interface supports both memory and database
5. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
6. **Response Handling**: Data flows back through the same path with proper error handling

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured for Neon)
- **Drizzle ORM**: Type-safe database operations
- **Connection**: Environment-based DATABASE_URL configuration

### UI Framework
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESLint**: Code linting (configured but not shown)

## Deployment Strategy

### Development
- **Hot Reloading**: Vite middleware integrated with Express
- **Memory Storage**: Fallback storage for development without database
- **Source Maps**: Full debugging support

### Production
- **Build Process**: 
  - Frontend: Vite builds React app to `dist/public`
  - Backend: esbuild bundles Express server to `dist/index.js`
- **Static Serving**: Express serves built React app in production
- **Database**: PostgreSQL connection required via DATABASE_URL
- **Process Management**: Single Node.js process serving both API and static files

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Build Scripts**: Separate dev/build/start commands
- **Database Migrations**: Drizzle Kit for schema management

## Recent Changes

### Cloud Run Deployment Fixes (July 20, 2025)
- **Fixed**: Cloud Run deployment issues with proper 0.0.0.0 host binding configuration
- **Added**: Comprehensive startup error handling with database connectivity testing
- **Enhanced**: PostgreSQL connection pooling optimized for Cloud Run environment (reduced max connections, added allowExitOnIdle)
- **Implemented**: Health check endpoints `/health` and `/ready` for deployment monitoring with database status
- **Added**: Graceful shutdown handling (SIGTERM/SIGINT) and unhandled error catching
- **Improved**: Server initialization with detailed logging and startup timeout protection
- **Enhanced**: Session store error handling with better PostgreSQL configuration
- **CRITICAL FIX**: Multi-layer MIME type enforcement to solve CSS/JS serving as application/json
  - Fixed middleware order to serve static files before Vite catch-all route
  - Added dedicated static file serving for both development and production environments
  - Implemented proper MIME type enforcement for CSS (`text/css`) and JS (`application/javascript`)
  - Resolved static asset requests returning HTML instead of actual file content
- **Resolved**: Static asset path resolution for production builds (dist/public vs server/public)
- **Added**: Database connection retry logic for deployment environment stability
- **Enhanced**: Production path resolution with fallback logic for deployed environment
- **Fixed**: CORS configuration for Replit deployments allowing `.replit.app` domains  
- **Fixed**: Dynamic require('path') error in deployed environment by converting to ES module imports
- **Resolved**: Navigation to dashboard cards (/interactions, /follow-ups, /clients) now works in production
- **Added**: Comprehensive deployment debugging and server startup logging

### Theme System & Visual Enhancements (July 2025)
- **Added**: Comprehensive light and dark mode theme system with localStorage persistence
- **Implemented**: Theme toggle dropdown with light, dark, and system preference options
- **Enhanced**: All UI components updated with theme-aware CSS variables and proper contrast
- **Created**: Beautiful falling stars background animation on login page with glowing effects
- **Updated**: Application branding from "HR CRM" to "Tracker Suite" throughout interface
- **Optimized**: Theme system works seamlessly across all components and pages

### Advanced Performance & Scaling Optimization (July 2025)
- **Completed**: Step 1 - Database optimization with proper indexes on frequently queried fields
- **Completed**: Step 2 - API Performance & Caching with intelligent cache invalidation
- **Completed**: Step 3 - Frontend optimization with smart loading states and memoization
- **Added**: Multi-tier caching system with node-cache for dashboard (5min), clients (10min), follow-ups (3min)
- **Implemented**: Compression, security headers, request timing middleware for production optimization
- **Enhanced**: Smart cache invalidation on all write operations to maintain data consistency
- **Optimized**: Database query patterns with proper Drizzle ORM syntax and null handling
- **Created**: Optimized React Query hooks with specialized caching for different data types
- **Built**: Smart skeleton loading states and memoized components for better UX performance
- **Added**: Virtualized lists and performance-focused component architecture
- **Completed**: Step 4 - Advanced Security & Rate Limiting with comprehensive protection
- **Implemented**: Express rate limiting with IPv6 support and progressive slow-down
- **Enhanced**: Input validation with Zod schemas and XSS/SQL injection protection
- **Added**: CORS configuration, request sanitization, and security headers

### Authentication System Fix (July 2025)
- **Fixed**: Session cookie persistence issues in deployed environment
- **Implemented**: Session regeneration during login to ensure clean state
- **Enhanced**: PostgreSQL session storage with proper cookie configuration
- **Resolved**: Browser session stale data issues requiring deployment refresh
- **Added**: Comprehensive session debugging and error handling
- **Improved**: Authentication middleware with proper session validation

### Dashboard Quick Actions Fix (July 2025)
- **Fixed**: Schedule Follow-up functionality not working in deployed environment
- **Resolved**: Date handling issues in follow-up form and API validation
- **Connected**: All dashboard quick action buttons to their respective modals
- **Enhanced**: Client search functionality with real-time filtering
- **Improved**: Client row actions (edit, schedule follow-up, view history) with proper data pre-filling
- **Added**: Event-based communication between dashboard widgets and modals

### Complete Trial System Implementation (July 20, 2025)
- **Implemented**: Comprehensive 7-day free trial system with automatic setup for new users
- **Added**: Trial monitoring service with email notifications (warnings 2 days before expiry)
- **Built**: Trial status checking middleware protecting all API endpoints
- **Created**: Trial banner component displaying remaining days and upgrade prompts
- **Enhanced**: Database schema with trial fields (accountStatus, trialEndsAt, trialEmailSent)
- **Fixed**: Authentication flow with proper dashboard navigation after login/registration
- **Integrated**: PostgreSQL trial data management with background monitoring service
- **Added**: Real-time trial status display throughout the application interface

### Personalized User Journey Visualization & Milestone Tracking (July 20, 2025)
- **Implemented**: Comprehensive user journey system with 14 different milestone types across 5 categories
- **Built**: Intelligent milestone detection that automatically triggers when users complete actions
- **Created**: Beautiful journey visualization with progress tracking, level system, and stage evolution
- **Added**: Real-time point earning system with level progression (50 points per level)
- **Enhanced**: Database schema with user_journey_milestones and user_journey_progress tables
- **Integrated**: Automatic milestone checking on client creation, follow-up scheduling, and interaction logging
- **Features**: Five journey stages (onboarding → exploring → active → power_user → expert)
- **Categories**: Getting Started, Client Management, Engagement, Growth, Advanced
- **Navigation**: Added "Your Journey" link to sidebar for easy access to progress visualization
- **Gamification**: Points-based achievement system with trophy icons and completion celebrations
- **Auto-Initialize**: New user journeys start automatically on registration with welcome milestones
- **Verified**: Complete milestone flow tested from registration through client creation and progress tracking

### Enhanced Landing Page with Interactive Demo (July 20, 2025)
- **Customized**: Complete landing page redesign with modern gradient branding and professional layout
- **Implemented**: Interactive "View Demo" modal with tabbed navigation showcasing all major features
- **Created**: Four demo sections: Dashboard Overview, Client Management, Journey Tracking, Advanced Analytics
- **Enhanced**: Hero section with gradient Tracker Suite branding, feature highlights, and floating showcase cards
- **Added**: Mock data visualization showing realistic client management scenarios and journey progression
- **Improved**: Visual hierarchy with badges, enhanced typography, and consistent color schemes
- **Integrated**: Real feature demonstrations including milestone tracking, analytics metrics, and client workflows
- **Optimized**: Mobile-responsive design with interactive elements and smooth transitions
- **Added**: Beautiful falling stars background animation with glowing effects and twinkling motion
- **Implemented**: Theme toggle functionality allowing users to switch between light, dark, and system preferences
- **Enhanced**: Fixed-position theme toggle button in top-right corner for easy accessibility
- **Layered**: Proper z-index management ensuring content appears above animated background elements

### Custom Innovative Logo Design (January 2025)
- **Created**: Professional SVG logo with network visualization concept featuring interconnected nodes
- **Design Elements**: Central hub with connected client nodes representing relationship tracking
- **Interactive Features**: Animated activity indicators with pulsing effects showing engagement levels  
- **Theme Integration**: Dynamic color adaptation for light/dark themes with gradient effects
- **Scalable Component**: Multiple size variants (sm, md, lg, xl) and icon-only option for different contexts
- **Brand Identity**: Consistent "Tracker Suite" branding with "Client Relationship Excellence" tagline
- **Technical Implementation**: React component with theme hooks, customizable animations, and performance optimization
- **Visual Appeal**: Glowing effects, smooth transitions, professional gradient color schemes
- **Integration Points**: Landing page hero, sidebar navigation, authentication forms, admin dashboard
- **Logo Concept**: Reflects CRM core functionality through network visualization and tracking paths

### Comprehensive Mobile Optimization (January 2025)
- **Mobile-First Design**: Complete redesign with mobile-first responsive breakpoints and optimized layouts
- **Logo Responsiveness**: Added mobile-specific sizing with `mobileSize` prop and intelligent viewport detection
- **Touch-Friendly Interface**: Implemented 44px minimum touch targets and improved button spacing
- **Responsive Typography**: Scalable text sizes from xs to xl with mobile-optimized font sizing
- **Grid Layouts**: Converted complex layouts to mobile-friendly grids with proper breakpoints
- **Navigation Optimization**: Mobile-collapsible sidebar with better touch interactions and compact styling
- **Form Enhancement**: Mobile-optimized authentication forms with proper input scaling
- **Dashboard Redesign**: Mobile-responsive dashboard with stacked layouts and touch-friendly controls
- **CSS Optimization**: Added mobile-specific CSS rules for better text rendering and scroll prevention
- **Landing Page**: Mobile-first hero section with responsive demo modals and touch-optimized buttons
- **Cross-Device Testing**: Ensured consistent experience across all mobile devices and orientations

### Phase 1 Foundation Features (January 2025)
- **Comprehensive REST API v1**: Built complete API endpoints for clients, follow-ups, interactions, analytics with pagination, filtering, and sorting
- **Advanced Search System**: Universal search across all entities, search suggestions, recent searches, and saved searches functionality
- **Webhook Integration**: Complete webhook system with delivery tracking, retry logic, and event-based triggers for external integrations
- **API Authentication**: Session-based authentication middleware protecting all API endpoints with role-based access control
- **Database Schema Extensions**: Added webhook, webhook deliveries, search history, and saved searches tables with proper indexing
- **Enhanced Storage Layer**: Extended DatabaseStorage with paginated queries, advanced filtering, and search capabilities
- **API Documentation**: Self-documenting API endpoints with comprehensive error handling and validation
- **Rate Limiting**: Enterprise-level API rate limiting and security middleware for production scalability

### Enhanced Support Infrastructure (July 20, 2025)
- **Created**: Comprehensive Privacy Policy with GDPR/CCPA compliance and detailed data handling procedures
- **Implemented**: Professional Terms of Service with clear subscription terms, acceptable use policies, and liability limitations
- **Built**: Complete Support Center with interactive contact form, FAQ section, and multiple support channels
- **Added**: Comprehensive Documentation system with 6 categories covering all CRM features and workflows
- **Implemented**: Video Tutorials section with featured series, step-by-step walkthroughs, and category browsing
- **Created**: Interactive Live Chat interface with real-time messaging, agent status, and support statistics
- **Built**: Extensive FAQ system with 20+ questions, category filtering, search functionality, and helpfulness ratings
- **Enhanced**: Support system includes priority-based ticket system, response time expectations, and system status monitoring
- **Structured**: Professional legal framework covering data ownership, intellectual property, termination procedures, and dispute resolution
- **Integrated**: All pages designed with consistent branding, mobile-responsive layouts, and proper navigation
- **Features**: Search capabilities, progress tracking, interactive elements, and comprehensive CRM-specific content

### Admin Authentication Flow Fix (July 20, 2025)
- **RESOLVED**: Admin user authentication redirect issue - admin@trackercrm.com now properly routes to admin dashboard
- **Enhanced**: App.tsx routing logic to automatically detect admin users (admin/master_admin roles) and redirect appropriately
- **Updated**: Login and registration forms to check user roles after authentication and route accordingly
- **Fixed**: Authentication hook imports to use correct useAuth.ts file with loginMutation functionality
- **Implemented**: Automatic admin detection on home route (/) and dashboard route (/dashboard) redirecting to admin interface
- **Added**: Console logging for debugging admin user redirects and role detection
- **Verified**: Master admin credentials (admin@trackercrm.com / admin123) working with automatic admin dashboard access

### Master Admin Account System (July 20, 2025)
- **Implemented**: Comprehensive role-based access control with user, admin, and master_admin roles
- **Created**: Master admin account (admin@trackercrm.com / admin123) with full system privileges
- **Built**: Admin middleware with granular permission checking and role validation
- **Added**: User management endpoints for viewing, updating roles, and deleting accounts
- **Enhanced**: Database schema with userRole and permissions fields for access control
- **Protected**: Regular users cannot delete their own accounts - only master admins can
- **Implemented**: Trial modification capabilities for admins to extend/modify user trials
- **Added**: Self-protection preventing master admins from deleting or demoting themselves
- **Secured**: Role-based endpoint protection with proper authentication checks

### Enhanced Dashboard & Notification System (January 2025)
- **Added**: Advanced dashboard widgets with real-time metrics and visual indicators
- **Features**: Interactive client growth tracking, follow-up performance metrics, and activity monitoring
- **Implemented**: Comprehensive notification center with priority-based alerts
- **Enhanced**: Client search functionality with server-side search and debouncing
- **Added**: Smart notification system for overdue follow-ups, due dates, and client milestones
- **Improved**: Dashboard layout with actionable widgets and quick access buttons

### Communication Tracker Integration (January 2025)
- **Added**: Communication tracker component with modal integration
- **Enhanced**: Client pages with communication logging buttons
- **Fixed**: Interactions API to properly handle userId from authenticated sessions
- **Improved**: Navigation with quick access to communication features

### Advanced Reporting System (January 2025)
- **Added**: Comprehensive reporting dashboard with analytics
- **Features**: Multi-tab interface (Overview, Clients, Follow-ups, Communications)
- **Visualizations**: Charts for client status, interaction types, and activity timeline
- **Export**: JSON report generation with comprehensive metrics
- **Date Filtering**: Customizable date ranges for reporting periods

### Navigation Enhancement (January 2025)
- **Added**: Navigation buttons across all pages (Dashboard, Clients, Follow-ups)
- **Improved**: Mobile-responsive navigation with smart text display
- **Enhanced**: Quick access to key features from any page

## Key Design Decisions

### Monorepo Structure
- **Problem**: Managing frontend and backend code separately
- **Solution**: Unified project structure with shared types
- **Benefits**: Type safety across API boundaries, simplified deployment

### Database Integration
- **Problem**: Need for persistent, reliable data storage
- **Solution**: PostgreSQL database with Drizzle ORM and type-safe operations
- **Benefits**: Persistent data storage, ACID compliance, production-ready scalability

### Schema-First Development
- **Problem**: Type safety between database and application
- **Solution**: Drizzle schemas with Zod validation
- **Benefits**: Compile-time type checking, runtime validation

### Component Library Choice
- **Problem**: Consistent UI without custom component development
- **Solution**: shadcn/ui with Tailwind CSS
- **Benefits**: Customizable, accessible, modern design system

### Data Visualization Strategy
- **Problem**: Complex analytics requirements for HR managers
- **Solution**: Recharts library with comprehensive dashboard
- **Benefits**: Interactive charts, responsive design, extensive customization