# DPT Tracker

A comprehensive application management system for tracking DPT (Doctor of Physical Therapy) program applications, prerequisites, observations, and deadlines.

## Features

- 🎓 **Application Management**: Track applications to multiple DPT programs
- 📚 **Prerequisites Tracking**: Manage prerequisite courses and GPA calculation
- 👁️ **Observation Hours**: Log and verify observation hours
- 📅 **Calendar View**: Visualize deadlines, interviews, and decision dates
- 📊 **Comparison Tool**: Side-by-side comparison of DPT programs
- 📝 **Resources**: Access guides and external links for applications
- 🔔 **Notifications**: Browser notifications and toast alerts for upcoming events
- 📱 **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (see [Deployment Guide](./DEPLOYMENT.md))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dpt-tracker.git
   cd dpt-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration file in your Supabase SQL editor:
   ```bash
   # Copy contents of supabase/migrations/001_init.sql
   # Paste into Supabase SQL Editor and run
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint

## Project Structure

```
dpt-tracker/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── store/         # Zustand stores
│   └── test/          # Test setup
├── supabase/
│   └── migrations/    # Database migrations
├── tests/
│   └── e2e/           # End-to-end tests
└── public/            # Static assets
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push to GitHub
2. Import repository to Vercel
3. Add environment variables
4. Deploy!

## Testing

### Unit Tests

```bash
npm run test
```

Tests are located in `src/lib/__tests__/` and `src/store/__tests__/`.

### E2E Tests

```bash
npm run test:e2e
```

E2E tests use Playwright and test the full application flow.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

