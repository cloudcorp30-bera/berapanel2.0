# BeraPanel 2.0

## Overview

BeraPanel is a cloud hosting PaaS platform built as a pnpm workspace monorepo. It lets users deploy bots, APIs, and web apps, manage them with a dashboard, earn coins, and use a marketplace.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + TailwindCSS + React Query
- **Auth**: JWT tokens
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Payments**: PayHero M-Pesa STK Push (optional)
- **Notifications**: Telegram bot (optional)
- **Process Manager**: Node.js child_process spawn
- **Code Editor**: Monaco Editor
- **Terminal**: xterm.js

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   └── berapanel/          # React frontend (port 5173)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## Admin Credentials

- **Username:** `bera`
- **Password:** `brucebera7824_`
- **Role:** superadmin

## API Routes

All API routes are under `/api/brucepanel/`:

- `/api/brucepanel/auth/` - Authentication (login, register, refresh token)
- `/api/brucepanel/projects/` - Project management (CRUD, deploy, logs)
- `/api/brucepanel/coins/` - Coin economy (balance, transfer, history)
- `/api/brucepanel/bots/` - Marketplace bot templates
- `/api/brucepanel/airdrops/` - Airdrop claiming
- `/api/brucepanel/account/` - User profile, API keys
- `/api/brucepanel/admin/` - Admin panel (requires admin role)
- `/api/brucepanel/chat/` - Community chat channels
- `/api/brucepanel/support/` - Support tickets

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes (auto-set by Replit) |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PAYHERO_AUTH` | PayHero Basic auth header | No |
| `PAYHERO_CHANNEL_ID` | PayHero channel ID | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot for admin alerts | No |
| `TELEGRAM_ADMIN_CHAT_ID` | Telegram admin chat ID | No |
| `BASE_URL` | Public base URL | No |

## Development

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Seed initial data (admin, coin packages, bots, promo)
cd artifacts/api-server && npx tsx src/seed.ts

# Start backend
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/berapanel run dev
```

## Promo Code

Use promo code **BERA2026** for 100 free coins on signup!

## Key Fixes Applied

1. Added missing DB tables: `projectWebhooksTable`, `teamMembersTable`, `featureFlagsTable`, `chatChannelsTable`, `chatMessagesTable`
2. Fixed `api-zod` index.ts to export values (Zod schemas) not just types
3. Added chat router to routes index
4. Fixed chat route import path
5. Fixed live URL generation to use Replit proxy path (`/app/:projectId`)
6. Set `autoRestart` default to `false` (was `true`)
7. Fixed process manager to generate correct live URLs for Replit environment
