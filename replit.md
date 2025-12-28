# Jumpseat - Applier Portal

## Overview

Jumpseat is a gamified job application review dashboard designed for remote workers who review AI-generated job applications before submission. The system supports three user roles: Appliers (primary users who review applications), Admins (who manage the system and clients), and Clients (who view their job search progress). The platform features performance tracking, leaderboards, and a client management system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React Context for user/application state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **External Database**: Supabase (PostgreSQL-based backend-as-a-service)

### Data Storage
- **Primary Database**: Supabase PostgreSQL
- **Schema Location**: `shared/schema.ts` contains Zod schemas for validation
- **Local Storage**: Used for session persistence and demo data (admin_clients, user preferences)

### Authentication
- **Current Implementation**: Mock authentication with localStorage-based session
- **User Roles**: Admin, Client, Applier - each with distinct dashboard views and permissions
- **Demo Users**: Predefined test accounts for development

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schemas used by both client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared code
- **Component Architecture**: shadcn/ui primitives with custom wrappers for consistent styling

## External Dependencies

### Backend Services
- **Supabase**: Primary database and authentication backend (requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables)
- **PostgreSQL**: Database engine (via Supabase, requires `DATABASE_URL` for Drizzle migrations)

### Key NPM Packages
- **@supabase/supabase-js**: Supabase client for database operations
- **drizzle-orm / drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Async state management
- **@radix-ui/***: Headless UI primitives for accessible components
- **zod / drizzle-zod**: Schema validation

### Development Tools
- **tsx**: TypeScript execution for server
- **esbuild**: Server bundling for production
- **Vite**: Frontend dev server and bundler