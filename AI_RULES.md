# Bot Tubarão V3 - AI Rules & Guidelines

## Tech Stack

- **TanStack Start v1** - Full-stack React framework with server functions and routing
- **React 19** - Latest React version with concurrent features
- **TypeScript** - Type-safe development throughout the codebase
- **Tailwind CSS v4** - Utility-first CSS framework with custom design tokens
- **Supabase** - Database, authentication, and real-time capabilities
- **TanStack Query** - Server state management and caching
- **TanStack Router** - File-based routing with type safety
- **shadcn/ui** - Reusable UI components with Radix UI primitives
- **Lucide React** - Icon library for consistent visual elements
- **Zod** - Schema validation for form inputs and API responses

## Library Usage Rules

### UI Components
- **Always use shadcn/ui components** from `src/components/ui/` when available
- **Never create custom UI components** that duplicate existing shadcn/ui functionality
- **Use Radix UI primitives** only when creating entirely new component patterns
- **Always use Tailwind CSS classes** for styling - no inline styles or CSS files
- **Follow the existing design system** with deep ocean theme, neon accents, and glass morphism

### State Management
- **Use TanStack Query** for all server state and data fetching
- **Use React hooks** (useState, useEffect) for local component state only
- **Never use Redux or other state management libraries** - TanStack Query is sufficient
- **Use server functions** (`createServerFn`) for all API calls to the backend

### Data & API
- **Always use Zod** for input validation on forms and API endpoints
- **Use Supabase client** for all database operations and authentication
- **Never fetch data directly** in components - always use TanStack Query
- **Use server functions** for all external API calls (Binance, Yahoo Finance)
- **Follow the existing database schema** and types from `src/integrations/supabase/types.ts`

### Routing & Navigation
- **Always use TanStack Router** for all routing needs
- **Create route files** in `src/routes/` following the existing pattern
- **Use `createFileRoute`** for all new route definitions
- **Never use React Router** or other routing libraries

### Styling & Design
- **Always use Tailwind CSS classes** - no CSS files or styled-jsx
- **Follow the existing color scheme** with deep ocean theme and neon accents
- **Use the existing font system**: Orbitron (display), Rajdhani (body), JetBrains Mono (code)
- **Implement responsive design** using Tailwind's responsive utilities
- **Use glass morphism effects** for cards and panels as shown in existing components

### Code Organization
- **Create components** in `src/components/` with descriptive names
- **Use hooks** in `src/hooks/` for reusable logic
- **Put utilities** in `src/lib/` for pure functions and helpers
- **Follow the existing file structure** and naming conventions
- **Always use TypeScript** with proper type definitions

### Error Handling
- **Use Sonner** for toast notifications (already configured)
- **Follow the existing error handling patterns** in server functions
- **Never use try/catch blocks** unless specifically requested - let errors bubble up
- **Use the existing error boundary** and error page components

### Performance
- **Use React.memo** for expensive components that don't need re-rendering
- **Implement proper loading states** using TanStack Query's built-in states
- **Use lazy loading** for route components when appropriate
- **Optimize bundle size** by avoiding unnecessary dependencies

### Security
- **Always use Supabase RLS** for database security
- **Never expose API keys** in client-side code
- **Use server functions** for all sensitive operations
- **Follow the existing authentication patterns** with `useAuth` hook