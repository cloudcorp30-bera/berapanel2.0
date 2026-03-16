# BeraPanel 2.0

Self-hosted cloud hosting PaaS platform — Heroku + Railway + Netlify hybrid with coin economy, bot marketplace, admin CMS, and full REST API.

## Architecture

### Monorepo Structure (pnpm workspaces)
```
/
├── artifacts/
│   ├── api-server/        # Express backend (port from $PORT env)
│   │   └── src/
│   │       ├── app.ts             # Express app + CORS + middleware
│   │       ├── index.ts           # Entry point
│   │       ├── seed.ts            # Database seeder
│   │       ├── lib/
│   │       │   ├── auth.ts        # JWT middleware
│   │       │   ├── coins.ts       # Coin award/spend
│   │       │   ├── notify.ts      # Notification creation + Telegram
│   │       │   └── process-manager.ts  # Child process management
│   │       └── routes/
│   │           ├── index.ts       # Route aggregator
│   │           ├── auth.ts        # Login/register/refresh
│   │           ├── projects.ts    # Project CRUD, deploy, files, logs, env, crons
│   │           ├── economy.ts     # Coins, payments, airdrops, referrals, streak, promo
│   │           ├── marketplace.ts # Bot templates, reviews
│   │           ├── account.ts     # Profile, notifications, tickets, API keys
│   │           └── admin.ts       # Full admin panel routes
│   └── berapanel/         # React + Vite frontend
│       └── src/
│           ├── App.tsx            # Router and layout
│           ├── pages/             # All pages
│           └── components/        # Shared UI components
├── lib/
│   ├── db/                # Drizzle ORM + PostgreSQL schema
│   │   └── src/schema/
│   │       ├── users.ts   # users, sessions
│   │       ├── projects.ts # projects, deploy_history, metrics, crons
│   │       ├── economy.ts # transactions, packages, airdrops, referrals, promo
│   │       └── platform.ts # notifications, API keys, bots, tickets, announcements, audit
│   └── api-spec/          # OpenAPI spec + codegen (Orval)
│       └── openapi.yaml
```

## API Routes

All routes under `/api/brucepanel/`:

| Category | Routes |
|----------|--------|
| Auth | POST /auth/register, /auth/login, /auth/refresh, /auth/logout, GET /auth/me |
| Projects | CRUD, /start, /stop, /restart, /deploy, /logs, /stream (SSE), /files, /env, /crons |
| Economy | /coins/balance, /coins/history, /coins/transfer, /subscribe/*, /airdrops/*, /referral/*, /streak/*, /promo/redeem |
| Marketplace | GET /bots, /bots/:id, POST /bots/:id/deploy, /bots/:id/review |
| Account | /account/profile, /notifications, /support/tickets, /api/keys, /announcements |
| Admin | /admin/* — full platform management |

## Authentication

- JWT tokens stored in localStorage
- `Authorization: Bearer <token>` header
- Refresh tokens for silent re-auth
- Roles: `user`, `admin`, `superadmin`

## Admin Access

- **Username:** `admin`
- **Password:** `BeraPanelAdmin2026!`

## Process Management

Projects run as child processes:
- Directory: `bp_projects/<projectId>/`
- Port pool: 3001-4000
- Live URL: `http://host:port`
- SSE log streaming at `/api/brucepanel/projects/:id/stream`

## Payments

PayHero M-Pesa STK Push:
- Set `PAYHERO_AUTH` env var to enable
- Falls back to demo auto-complete mode if not configured

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing secret |
| `PAYHERO_AUTH` | PayHero Basic auth header |
| `PAYHERO_CHANNEL_ID` | PayHero channel ID |
| `TELEGRAM_BOT_TOKEN` | Admin notifications |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin chat ID |
| `BASE_URL` | Public base URL |
| `PROJECTS_DIR` | Where to store project files (default: `bp_projects/`) |

## GitHub

Repository: https://github.com/cloudcorp30-bera/berapanel2.0

## Promo Code

**BERA2026** — 100 free coins for new users
