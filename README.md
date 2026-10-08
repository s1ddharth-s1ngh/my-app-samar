# Samar

Samar is a personal web application for managing finances, projects, tasks, daily habits, and planned purchases.

## Setup & Running

1. `npm install`
2. `npm run dev` to start the development server
3. `npm run test` to run unit tests
4. `npm run build` to build for production

## Architecture

- **UI Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom CSS Variables
- **State Management**: Zustand
- **Persistence**: IndexedDB (via a typed `DataAdapter`)

### Project Structure

- `src/domain/`: Pure business logic, unit-tested. No React components or I/O.
- `src/data/`: Data models, validation schemas (Zod), and data persistence adapters.
- `src/ui/`: Reusable, generic UI primitives.
- `src/features/`: Feature-specific React components and hooks.
- `src/stores/`: Zustand stores.
