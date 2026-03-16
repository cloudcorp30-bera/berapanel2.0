# BeraPanel 2.0

  **Self-hosted cloud hosting PaaS platform** — Heroku + Railway + Netlify hybrid with coin economy, bot marketplace, admin CMS, and external developer API.

  ## Features

  ### Platform
  - **Project Hosting** — Git deploy, file manager (Monaco editor), real-time log streaming (SSE), terminal (xterm.js)
  - **Process Manager** — Node.js child_process with auto-restart, port pool 3001-4000
  - **Environment Variables** — Per-project env var editor
  - **Cron Jobs** — Scheduled task management per project
  - **Deploy History** — Full deployment log and history

  ### Bot Marketplace
  - 6+ pre-built templates: Telegram bots, Discord bots, WhatsApp bots, Python APIs
  - One-click deploy with env var setup
  - Reviews, ratings, categories, featured bots

  ### Coin Economy
  - Earn coins: daily streak, referrals, airdrops, promo codes, milestones
  - Spend coins: deploy bots, premium features
  - Transfer coins between users
  - Leaderboard, badges, earn options

  ### Payments
  - M-Pesa STK Push via PayHero (fallback demo mode)
  - Coin packages: Starter, Pro, Elite, Whale
  - Transaction history

  ### Admin Panel
  - Dashboard with system stats
  - User management (ban/unban, role, coins adjustment)
  - Economy overview and transaction management
  - Bot marketplace CRUD
  - Airdrop management
  - Promo code management
  - Support ticket management
  - Platform settings
  - Analytics (signups/deploys/revenue charts)
  - Audit log
  - System resource monitor (CPU/RAM/disk)
  - Emergency controls (stop-all, broadcast)

  ### Developer API
  - Full REST API with JWT auth
  - API key management with permissions
  - OpenAPI spec at `lib/api-spec/openapi.yaml`

  ## Quick Start

  ```bash
  # 1. Clone and install
  git clone https://github.com/cloudcorp30-bera/berapanel2.0
  cd berapanel2.0
  pnpm install

  # 2. Setup database
  cp .env.example .env
  # Edit .env with your DATABASE_URL

  # 3. Push schema
  pnpm --filter @workspace/db run push

  # 4. Seed admin user
  pnpm --filter @workspace/api-server tsx src/seed.ts

  # 5. Start backend
  pnpm --filter @workspace/api-server dev

  # 6. Start frontend
  pnpm --filter @workspace/berapanel dev
  ```

  ## Admin Credentials

  - **Username:** `admin`
  - **Password:** `BeraPanelAdmin2026!`

  ## Environment Variables

  | Variable | Description | Required |
  |----------|-------------|----------|
  | `DATABASE_URL` | PostgreSQL connection string | Yes |
  | `JWT_SECRET` | JWT signing secret | Yes |
  | `PAYHERO_AUTH` | PayHero Basic auth header | No (uses demo mode) |
  | `PAYHERO_CHANNEL_ID` | PayHero channel ID | No |
  | `TELEGRAM_BOT_TOKEN` | Telegram bot for admin alerts | No |
  | `TELEGRAM_ADMIN_CHAT_ID` | Telegram admin chat ID | No |
  | `BASE_URL` | Public base URL | No |

  ## Tech Stack

  - **Backend:** Node.js, Express, TypeScript, Drizzle ORM
  - **Frontend:** React, Vite, TypeScript, TailwindCSS, React Query
  - **Database:** PostgreSQL
  - **Auth:** JWT with refresh tokens
  - **Payments:** PayHero M-Pesa STK Push
  - **Process Management:** Node.js child_process spawn
  - **Code Editor:** Monaco Editor
  - **Terminal:** xterm.js

  ## API Documentation

  API prefix: `/api/brucepanel/`

  Full OpenAPI spec available at `lib/api-spec/openapi.yaml`

  ## Promo Code

  Use promo code **BERA2026** for 100 free coins on signup!
  