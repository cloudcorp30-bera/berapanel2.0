import { db } from "@workspace/db";
import { botTemplatesTable, coinPackagesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const DEFAULT_BOT_TEMPLATES = [
  {
    id: "d3c85798-3884-4a20-980f-74d9f32a4eb3",
    name: "ATASSA MD",
    description:
      "Premium WhatsApp Multi-Device bot by GiftedTech. Features: auto-reply, group management, media downloader, games, AI assistant, and more. Powered by gifted-baileys.",
    category: "whatsapp",
    icon: "💬",
    repoUrl: "",
    branch: "main",
    startCommand: "node index.js",
    installCommand: "npm install --legacy-peer-deps",
    runtime: "node",
    requiredEnvVars: JSON.stringify([
      {
        key: "SESSION_ID",
        label: "Session ID",
        required: true,
        description:
          "Your WhatsApp Session ID from https://session.giftedtech.co.ke — required to connect the bot to your WhatsApp.",
      },
      {
        key: "MODE",
        label: "Bot Mode",
        required: true,
        description:
          "Set to public (everyone can use commands) or private (only bot owner can use commands).",
      },
      {
        key: "TIME_ZONE",
        label: "Time Zone",
        required: true,
        description:
          "Your timezone e.g. Africa/Nairobi, America/New_York, Asia/Kolkata",
      },
      {
        key: "AUTO_READ_STATUS",
        label: "Auto Read Status",
        required: false,
        description:
          "Set to true to automatically view WhatsApp statuses.",
      },
      {
        key: "AUTO_LIKE_STATUS",
        label: "Auto Like Status",
        required: false,
        description:
          "Set to true to automatically like WhatsApp statuses.",
      },
      {
        key: "DATABASE_URL",
        label: "Database URL (optional)",
        required: false,
        description:
          "PostgreSQL connection URL. Leave blank to use SQLite (auto-created in project folder).",
      },
    ]),
    tags: ["whatsapp", "baileys", "multi-device", "gifted", "bot"],
    coinCost: 25,
    featured: true,
    verified: true,
    enabled: true,
  },
  {
    id: "08274f66-8978-4e0f-b5aa-5e26ecb3186e",
    name: "Discord Bot Starter",
    description:
      "Discord.js bot with slash commands support. Perfect starter template for Discord bots with moderation, fun commands, and utilities.",
    category: "discord",
    icon: "🤖",
    repoUrl: "",
    branch: "main",
    startCommand: "node bot.js",
    installCommand: "npm install",
    runtime: "node",
    requiredEnvVars: JSON.stringify([
      {
        key: "DISCORD_TOKEN",
        label: "Discord Bot Token",
        required: true,
        description: "Your Discord bot token from the Discord Developer Portal.",
      },
      {
        key: "CLIENT_ID",
        label: "Client ID",
        required: true,
        description: "Your Discord application's Client ID.",
      },
    ]),
    tags: ["discord", "bot", "slash-commands"],
    coinCost: 0,
    featured: true,
    verified: true,
    enabled: true,
  },
  {
    id: "be270609-6019-4f60-ac84-42bceb667ad4",
    name: "WhatsApp Bot",
    description:
      "WhatsApp bot using baileys library. Supports auto-reply, group commands, and sticker creation.",
    category: "whatsapp",
    icon: "📱",
    repoUrl: "",
    branch: "main",
    startCommand: "npm start",
    installCommand: "npm install",
    runtime: "node",
    requiredEnvVars: JSON.stringify([
      {
        key: "SESSION_ID",
        label: "Session ID",
        required: true,
        description: "Your WhatsApp session ID to authenticate the bot.",
      },
    ]),
    tags: ["whatsapp", "baileys", "bot"],
    coinCost: 50,
    featured: true,
    verified: true,
    enabled: true,
  },
  {
    id: "ddc2f71b-1e27-4e06-a3c2-28168ac7a405",
    name: "Crypto Price Bot",
    description:
      "Telegram bot for real-time crypto prices. Supports BTC, ETH, BNB and 100+ coins with price alerts.",
    category: "telegram",
    icon: "📈",
    repoUrl: "",
    branch: "main",
    startCommand: "node bot.js",
    installCommand: "npm install",
    runtime: "node",
    requiredEnvVars: JSON.stringify([
      {
        key: "BOT_TOKEN",
        label: "Telegram Bot Token",
        required: true,
        description: "Your Telegram bot token from @BotFather.",
      },
    ]),
    tags: ["telegram", "crypto", "bot", "prices"],
    coinCost: 25,
    featured: true,
    verified: true,
    enabled: true,
  },
  {
    id: "f7d17257-853d-456e-88ff-d275c81e575a",
    name: "Telegram Bot Starter",
    description:
      "Feature-rich Telegram bot starter template with inline keyboards, callbacks, and session management.",
    category: "telegram",
    icon: "✈️",
    repoUrl: "",
    branch: "main",
    startCommand: "node index.js",
    installCommand: "npm install",
    runtime: "node",
    requiredEnvVars: JSON.stringify([
      {
        key: "BOT_TOKEN",
        label: "Telegram Bot Token",
        required: true,
        description: "Your Telegram bot token from @BotFather.",
      },
    ]),
    tags: ["telegram", "bot", "starter"],
    coinCost: 0,
    featured: true,
    verified: true,
    enabled: true,
  },
  {
    id: "a321bf28-6c5c-49a6-a40e-a693b70a5cb5",
    name: "Python Flask API",
    description:
      "Python Flask REST API with JWT auth, PostgreSQL support, and auto-generated Swagger docs.",
    category: "api",
    icon: "🐍",
    repoUrl: "",
    branch: "main",
    startCommand: "python app.py",
    installCommand: "pip install -r requirements.txt",
    runtime: "python",
    requiredEnvVars: JSON.stringify([
      {
        key: "SECRET_KEY",
        label: "Secret Key",
        required: true,
        description: "Flask secret key for session management.",
      },
    ]),
    tags: ["python", "flask", "api", "rest"],
    coinCost: 0,
    featured: false,
    verified: true,
    enabled: true,
  },
  {
    id: "0b0a32e8-88cc-4b0f-a99a-7a7ed8f50034",
    name: "Group Management Bot",
    description:
      "Telegram group management bot with anti-spam, welcome messages, warn system, and admin commands.",
    category: "telegram",
    icon: "👮",
    repoUrl: "",
    branch: "main",
    startCommand: "node index.js",
    installCommand: "npm install",
    runtime: "node",
    requiredEnvVars: JSON.stringify([
      {
        key: "BOT_TOKEN",
        label: "Telegram Bot Token",
        required: true,
        description: "Your Telegram bot token from @BotFather.",
      },
    ]),
    tags: ["telegram", "group", "moderation", "bot"],
    coinCost: 0,
    featured: false,
    verified: true,
    enabled: true,
  },
];

const DEFAULT_COIN_PACKAGES = [
  {
    id: "843ab89b-cf86-4bc9-8f8e-9ab5067efdee",
    name: "Starter Pack",
    description: "Perfect for 1 project — 100 coins to get you started",
    priceKsh: 50,
    coins: 100,
    bonusCoins: 0,
    badge: "Starter",
    enabled: true,
  },
  {
    id: "2de9fe81-c079-4212-8e7b-bb8839a962c3",
    name: "Basic Pack",
    description: "Good for 2–3 projects with some spare coins",
    priceKsh: 100,
    coins: 250,
    bonusCoins: 25,
    badge: "Basic",
    enabled: true,
  },
  {
    id: "f4ae5d7f-5350-42b7-973a-55c77f3273f8",
    name: "Pro Pack",
    description: "Best for active developers — 500 coins monthly",
    priceKsh: 200,
    coins: 500,
    bonusCoins: 50,
    badge: "Popular",
    enabled: true,
  },
  {
    id: "3897945c-18dd-4048-8976-8403fd1bcb1b",
    name: "Elite Pack",
    description: "Power users — 1,500 coins at a great rate",
    priceKsh: 500,
    coins: 1500,
    bonusCoins: 200,
    badge: "Elite",
    enabled: true,
  },
  {
    id: "b0f0331a-8156-49d1-b4c2-261425796a84",
    name: "Whale Pack",
    description: "Maximum value — 3,500 coins for serious builders",
    priceKsh: 1000,
    coins: 3500,
    bonusCoins: 500,
    badge: "Whale",
    enabled: true,
  },
];

export async function runSeed(): Promise<void> {
  try {
    // Ensure bot_template_id column exists (added in v2.1)
    await db.execute(sql.raw(
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS bot_template_id UUID`
    ));

    for (const bot of DEFAULT_BOT_TEMPLATES) {
      // PostgreSQL text[] literal: {tag1,tag2,...}
      const pgTags = `{${bot.tags.map((t) => t.replace(/"/g, '\\"')).join(",")}}`;
      await db.execute(sql`
        INSERT INTO bot_templates (
          id, name, description, category, icon, repo_url, branch,
          start_command, install_command, runtime, required_env_vars,
          tags, coin_cost, featured, verified, enabled
        ) VALUES (
          ${bot.id}::uuid,
          ${bot.name},
          ${bot.description},
          ${bot.category},
          ${bot.icon || ""},
          ${bot.repoUrl || ""},
          ${bot.branch},
          ${bot.startCommand},
          ${bot.installCommand},
          ${bot.runtime},
          ${bot.requiredEnvVars}::jsonb,
          ${pgTags}::text[],
          ${bot.coinCost},
          ${bot.featured},
          ${bot.verified},
          ${bot.enabled}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          icon = EXCLUDED.icon,
          repo_url = EXCLUDED.repo_url,
          branch = EXCLUDED.branch,
          start_command = EXCLUDED.start_command,
          install_command = EXCLUDED.install_command,
          runtime = EXCLUDED.runtime,
          required_env_vars = EXCLUDED.required_env_vars,
          coin_cost = EXCLUDED.coin_cost,
          featured = EXCLUDED.featured,
          verified = EXCLUDED.verified,
          enabled = EXCLUDED.enabled
      `);
    }
    console.log(`[seed] Synced ${DEFAULT_BOT_TEMPLATES.length} bot templates`);

    for (const pkg of DEFAULT_COIN_PACKAGES) {
      await db.execute(sql`
        INSERT INTO coin_packages (id, name, description, price_ksh, coins, bonus_coins, badge, enabled)
        VALUES (
          ${pkg.id}::uuid,
          ${pkg.name},
          ${pkg.description},
          ${pkg.priceKsh},
          ${pkg.coins},
          ${pkg.bonusCoins},
          ${pkg.badge},
          ${pkg.enabled}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    console.log(`[seed] Synced ${DEFAULT_COIN_PACKAGES.length} coin packages`);

    // Disable any bot templates that are NOT in our canonical list (cleanup duplicates/old entries)
    const knownIds = DEFAULT_BOT_TEMPLATES.map((b) => b.id);
    const knownIdList = knownIds.map((id) => `'${id}'`).join(", ");
    await db.execute(sql.raw(
      `UPDATE bot_templates SET enabled = false WHERE id NOT IN (${knownIdList})`
    ));

    // Transfer deploy_count from disabled bots to ATASSA MD so ranking is preserved
    await db.execute(sql`
      UPDATE bot_templates
      SET deploy_count = deploy_count + (
        SELECT COALESCE(SUM(deploy_count), 0)
        FROM bot_templates
        WHERE id NOT IN (${sql.raw(knownIdList)}) AND deploy_count > 0
      )
      WHERE id = 'd3c85798-3884-4a20-980f-74d9f32a4eb3'::uuid
    `);
    console.log("[seed] Cleaned up old/duplicate bot templates");

  } catch (err) {
    console.error("[seed] Error during seed:", err);
  }
}
