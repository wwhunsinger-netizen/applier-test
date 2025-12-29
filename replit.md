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

### Supabase Clients Table Schema
The `clients` table in Supabase should have these columns:
- `id` (uuid, primary key, auto-generated)
- `first_name` (text, required)
- `last_name` (text, required)
- `email` (text, required)
- `username` (text, required)
- `status` (text: onboarding_not_started | onboarding_in_progress | active | paused | placed)
- `resume_approved` (boolean, default false)
- `cover_letter_approved` (boolean, default false)
- `job_criteria_signoff` (boolean, default false)
- `resume_url` (text, nullable)
- `cover_letter_url` (text, nullable)
- `resume_text` (text, nullable)
- `client_gmail` (text, nullable)
- `client_gmail_password` (text, nullable) - **TODO: Replace with secure credential storage for production**
- `target_job_titles` (text[], nullable)
- `required_skills` (text[], nullable)
- `nice_to_have_skills` (text[], nullable)
- `exclude_keywords` (text[], nullable)
- `years_of_experience` (integer, nullable)
- `seniority_level` (text, nullable)
- `daily_application_target` (integer, default 10)
- `onboarding_transcript` (text, nullable)
- `first_application_date` (timestamptz, nullable) - auto-updated when first application sent
- `last_application_date` (timestamptz, nullable) - auto-updated on each application
- `placement_date` (timestamptz, nullable)
- `document_feedback` (jsonb, nullable) - Stores client feedback per document type: `{"resume": {"text": "...", "status": "requested|completed|null"}, "cover-letter": {...}, "linkedin": {...}}`
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, auto-updated)

### Supabase job_criteria_samples Table Schema
The `job_criteria_samples` table stores jobs scraped from URLs for client calibration:
- `id` (uuid, primary key, auto-generated)
- `client_id` (uuid, FK to clients)
- `title` (text, nullable) - Populated after Apify scraping
- `company_name` (text, nullable) - Populated after Apify scraping
- `location` (text, nullable)
- `is_remote` (boolean, nullable)
- `job_type` (text, nullable) - full-time, part-time, contract, etc.
- `description` (text, nullable)
- `required_skills` (jsonb/text[], nullable) - Skills extracted from job posting
- `experience_level` (text, nullable) - junior, mid, senior, etc.
- `source_url` (text, required) - Original job posting URL
- `apply_url` (text, nullable) - Direct apply link
- `salary_min` (integer, nullable)
- `salary_max` (integer, nullable)
- `salary_currency` (text, nullable)
- `company_logo_url` (text, nullable)
- `scrape_status` (text: pending | complete | failed) - Tracks Apify scraping progress
- `scraped_at` (timestamptz, nullable) - When scraping completed
- `raw_data` (jsonb, nullable) - Full Apify API response for reference
- `created_at` (timestamptz, default now())

### Apify Integration
- **API**: Uses Apify's LinkedIn Jobs Scraper (`curious_coder~linkedin-jobs-scraper`)
- **Secret**: Requires `APIFY_API_TOKEN` environment variable
- **Workflow**: Admin adds job URLs → samples created with `pending` status → click scrape button → Apify fetches job details → status becomes `complete` or `failed`
- **Implementation**: `server/apify.ts` contains the scraping logic

### Supabase client_job_responses Table Schema
The `client_job_responses` table stores client yes/no verdicts on sample jobs:
- `id` (uuid, primary key, auto-generated)
- `client_id` (uuid, FK to clients)
- `sample_id` (uuid, FK to job_criteria_samples)
- `verdict` (text: yes | no)
- `comment` (text, nullable) - Required if verdict = "no" (validated in app logic)
- `responded_at` (timestamptz, required)

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