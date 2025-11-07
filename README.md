# Workout Tracker

A local-first workout tracker app that allows users to schedule workouts, track progress, and manage exercises with CSV import capability.

## Tech Stack

- **Frontend**: SvelteKit
- **Styling**: Tailwind CSS v4
- **Data Storage**: IndexedDB via Dexie.js
- **Charts**: Chart.js
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```