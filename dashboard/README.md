# Zerodha Dashboard

This React dashboard uses [Vite](https://vite.dev/) for development and production builds.

## Requirements

- Node.js 20.19+ or 22.12+
- The backend API running separately (port 3002 by default)

## Environment variables

Copy `.env.example` to `.env` when you need to override the default API URL:

```env
VITE_API_URL=http://localhost:3002
```

Only variables prefixed with `VITE_` are exposed to browser code. Never put database credentials or other secrets in dashboard environment files.

## Commands

```bash
npm install
npm run dev
```

The development server runs at http://localhost:3000.

Other commands:

- `npm start` - alias for the Vite development server
- `npm run build` - create the production build in `dist`
- `npm run preview` - preview the production build at http://localhost:4173
- `npm test` - run the Vitest test suite once
