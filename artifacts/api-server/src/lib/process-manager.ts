import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import type { Response } from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { db } from "@workspace/db";
import { projectsTable, deployHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const PORT_MIN = 3001;
const PORT_MAX = 4000;

// Base URL for live project URLs — always use production deployment URL
const BASE_URL = "https://bruce-panel-1.replit.app";

// Resolve PROJECTS_DIR — try the configured/default path first, fall back to /tmp
// if the filesystem is read-only (common in Replit autoscale production).
function resolveProjectsDir(): string {
  const candidates = [
    process.env.PROJECTS_DIR,
    path.join(process.cwd(), "artifacts/api-server/bp_projects"),
    path.join(process.cwd(), "bp_projects"),
    "/tmp/bp_projects",
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Verify we can actually write to this directory
      const testFile = path.join(dir, ".write_test");
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
      console.log(`[pm] Projects directory: ${dir}`);
      return dir;
    } catch {
      // Try next candidate
    }
  }
  // Last resort — /tmp should always be writable
  const fallback = "/tmp/bp_projects";
  fs.mkdirSync(fallback, { recursive: true });
  console.warn(`[pm] Warning: using fallback projects directory: ${fallback}`);
  return fallback;
}

const PROJECTS_DIR = resolveProjectsDir();

const processes = new Map<string, ChildProcess>();
const logBuffers = new Map<string, string[]>();
const sseClients = new Map<string, Set<Response>>();
const usedPorts = new Set<number>();
const deployingProjects = new Set<string>(); // lock: skip auto-restart while deploying

function assignPort(): number {
  for (let p = PORT_MIN; p <= PORT_MAX; p++) {
    if (!usedPorts.has(p)) {
      usedPorts.add(p);
      return p;
    }
  }
  throw new Error("No available ports");
}

function releasePort(port: number) {
  usedPorts.delete(port);
}

function broadcastLog(projectId: string, data: string) {
  const buf = logBuffers.get(projectId) || [];
  buf.push(data);
  if (buf.length > 1000) buf.shift();
  logBuffers.set(projectId, buf);

  const clients = sseClients.get(projectId);
  if (clients) {
    for (const res of clients) {
      try {
        res.write(`data: ${JSON.stringify({ type: "log", data, ts: new Date().toISOString() })}\n\n`);
      } catch {}
    }
  }
}

export function addSseClient(projectId: string, res: Response) {
  if (!sseClients.has(projectId)) sseClients.set(projectId, new Set());
  sseClients.get(projectId)!.add(res);
}

export function removeSseClient(projectId: string, res: Response) {
  sseClients.get(projectId)?.delete(res);
}

export function getLogs(projectId: string, lines = 200): string {
  const buf = logBuffers.get(projectId) || [];
  return buf.slice(-lines).join("");
}

export function getLiveUrl(projectId: string): string {
  return `${BASE_URL}/app/${projectId}/`;
}

// ── Template File Generator — creates real working files when no repoUrl ───────
function generateTemplateFiles(dir: string, templateId: string, envVars: Record<string, string>) {
  const write = (name: string, content: string) =>
    fs.writeFileSync(path.join(dir, name), content, "utf8");

  // ── ATASSA MD — extract from bundled zip ────────────────────────────────────
  if (templateId === "d3c85798-3884-4a20-980f-74d9f32a4eb3") {
    // Resolve zip path: bundled with the api-server artifact
    const zipCandidates = [
      path.join(process.cwd(), "artifacts/api-server/bot_zips/atassa-md.zip"),
      path.join(process.cwd(), "bot_zips/atassa-md.zip"),
      "/home/runner/workspace/artifacts/api-server/bot_zips/atassa-md.zip",
    ];
    const zipPath = zipCandidates.find(p => fs.existsSync(p));
    if (!zipPath) {
      throw new Error("ATASSA zip file not found. Please contact support.");
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // The zip may have a top-level folder — detect it
    const topFolders = new Set<string>();
    for (const e of entries) {
      const parts = e.entryName.split("/");
      if (parts.length > 1 && parts[0]) topFolders.add(parts[0]);
    }
    const topFolder = topFolders.size === 1 ? [...topFolders][0] + "/" : "";

    // Extract all entries, stripping the top-level folder
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const relPath = topFolder ? entry.entryName.slice(topFolder.length) : entry.entryName;
      if (!relPath) continue;
      const destPath = path.join(dir, relPath);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, entry.getData());
    }

    // Write/overwrite .env with user-supplied env vars
    const envContent = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    write(".env", envContent);
    return;
  }

  // ── Telegram Bot Starter ────────────────────────────────────────────────────
  if (templateId === "f7d17257-853d-456e-88ff-d275c81e575a") {
    write("package.json", JSON.stringify({
      name: "telegram-bot-starter",
      version: "1.0.0",
      main: "index.js",
      scripts: { start: "node index.js" },
      dependencies: { telegraf: "^4.15.6", dotenv: "^16.0.3" }
    }, null, 2));

    write(".env.example", "BOT_TOKEN=your_token_from_botfather\n");

    write("index.js", `require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    '👋 Welcome to BeraPanel Bot!\\n\\nI am ready to serve you. Use /help to see all commands.',
    Markup.keyboard([['📊 Status', '❓ Help'], ['🔧 Commands', '📞 Contact']]).resize()
  );
});

bot.help((ctx) => {
  ctx.reply(
    '🤖 *Available Commands*\\n\\n' +
    '/start - Welcome message\\n' +
    '/help - Show this help\\n' +
    '/ping - Check bot status\\n' +
    '/echo <text> - Echo your message\\n' +
    '/time - Current server time\\n' +
    '/info - Bot information',
    { parse_mode: 'Markdown' }
  );
});

bot.command('ping', (ctx) => ctx.reply('🏓 Pong! Bot is online and running.'));
bot.command('time', (ctx) => ctx.reply(\`🕐 Server time: \${new Date().toISOString()}\`));
bot.command('info', (ctx) => {
  ctx.reply(
    '📋 *Bot Info*\\n\\n' +
    \`👤 Your ID: \${ctx.from.id}\\n\` +
    \`💬 Chat ID: \${ctx.chat.id}\\n\` +
    \`🤖 Bot: @\${ctx.botInfo.username}\\n\` +
    \`⚙️ Platform: BeraPanel\`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('echo', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  ctx.reply(text || '❌ Usage: /echo <text>');
});

bot.on('text', (ctx) => {
  const text = ctx.message.text;
  if (text === '📊 Status') return ctx.reply('✅ Bot is running fine on BeraPanel!');
  if (text === '❓ Help') return ctx.reply('Use /help to see all commands.');
  if (text === '🔧 Commands') return ctx.reply('Available: /start /help /ping /echo /time /info');
});

bot.launch({ dropPendingUpdates: true });
console.log('🤖 Telegram bot started successfully!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`);
  }

  // ── Crypto Price Bot ────────────────────────────────────────────────────────
  else if (templateId === "ddc2f71b-1e27-4e06-a3c2-28168ac7a405") {
    write("package.json", JSON.stringify({
      name: "crypto-price-bot",
      version: "1.0.0",
      main: "bot.js",
      scripts: { start: "node bot.js" },
      dependencies: { telegraf: "^4.15.6", axios: "^1.6.0", dotenv: "^16.0.3" }
    }, null, 2));

    write("bot.js", `require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const COINS = { btc: 'bitcoin', eth: 'ethereum', bnb: 'binancecoin', sol: 'solana', doge: 'dogecoin', ada: 'cardano', xrp: 'ripple', matic: 'matic-network', avax: 'avalanche-2', dot: 'polkadot' };

async function getPrice(coinId) {
  try {
    const { data } = await axios.get(
      \`https://api.coingecko.com/api/v3/simple/price?ids=\${coinId}&vs_currencies=usd,kes&include_24hr_change=true\`
    );
    return data[coinId];
  } catch { return null; }
}

bot.start((ctx) => ctx.reply(
  '📈 *Crypto Price Bot*\\n\\nGet live crypto prices!\\n\\n' +
  '*Commands:*\\n/price BTC - Bitcoin price\\n/price ETH - Ethereum\\n/price SOL - Solana\\n/price BNB - BNB\\n/top - Top coins overview\\n/help',
  { parse_mode: 'Markdown' }
));

bot.command('price', async (ctx) => {
  const symbol = ctx.message.text.split(' ')[1]?.toLowerCase();
  if (!symbol) return ctx.reply('Usage: /price BTC');
  const coinId = COINS[symbol] || symbol;
  await ctx.reply('⏳ Fetching price...');
  const data = await getPrice(coinId);
  if (!data) return ctx.reply('❌ Coin not found. Try: BTC, ETH, SOL, BNB, DOGE, ADA, XRP');
  const change = data.usd_24h_change?.toFixed(2);
  const arrow = change > 0 ? '🟢' : '🔴';
  ctx.reply(
    \`💰 *\${symbol.toUpperCase()} Price*\\n\\n\` +
    \`🇺🇸 USD: $\${data.usd?.toLocaleString()}\\n\` +
    \`🇰🇪 KES: KSh \${data.kes?.toLocaleString()}\\n\` +
    \`\${arrow} 24h: \${change}%\`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('top', async (ctx) => {
  await ctx.reply('⏳ Fetching top coins...');
  const ids = Object.values(COINS).slice(0, 6).join(',');
  try {
    const { data } = await axios.get(
      \`https://api.coingecko.com/api/v3/simple/price?ids=\${ids}&vs_currencies=usd&include_24hr_change=true\`
    );
    let msg = '📊 *Top Crypto Prices*\\n\\n';
    for (const [sym, id] of Object.entries(COINS).slice(0, 6)) {
      const d = data[id];
      if (d) {
        const ch = d.usd_24h_change?.toFixed(1);
        msg += \`*\${sym.toUpperCase()}*: $\${d.usd?.toLocaleString()} (\${ch > 0 ? '+' : ''}\${ch}%)\\n\`;
      }
    }
    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch { ctx.reply('❌ Failed to fetch prices.'); }
});

bot.help((ctx) => ctx.reply(
  '/price <coin> - Get price (BTC, ETH, SOL, BNB, DOGE, ADA, XRP, MATIC, AVAX, DOT)\\n/top - Top 6 coins\\n/start - Welcome'
));

bot.launch({ dropPendingUpdates: true });
console.log('📈 Crypto Price Bot started!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`);
  }

  // ── Discord Bot Starter ─────────────────────────────────────────────────────
  else if (templateId === "08274f66-8978-4e0f-b5aa-5e26ecb3186e") {
    write("package.json", JSON.stringify({
      name: "discord-bot-starter",
      version: "1.0.0",
      main: "bot.js",
      scripts: { start: "node bot.js" },
      dependencies: { "discord.js": "^14.14.1", dotenv: "^16.0.3" }
    }, null, 2));

    write("bot.js", `require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('info').setDescription('Bot information'),
  new SlashCommandBuilder().setName('hello').setDescription('Say hello!'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Server information'),
].map(c => c.toJSON());

client.once('ready', async () => {
  console.log(\`✅ Logged in as \${client.user.tag}\`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered!');
  } catch (e) { console.error('Slash command error:', e); }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply(\`🏓 Pong! Latency: \${client.ws.ping}ms\`);
  } else if (commandName === 'hello') {
    await interaction.reply(\`👋 Hello, \${interaction.user.username}! Welcome to BeraPanel Bot!\`);
  } else if (commandName === 'info') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Information')
      .setColor(0x5865F2)
      .addFields(
        { name: '📛 Name', value: client.user.username, inline: true },
        { name: '🆔 ID', value: client.user.id, inline: true },
        { name: '⚙️ Platform', value: 'BeraPanel', inline: true },
        { name: '📅 Uptime', value: \`\${Math.floor(process.uptime() / 60)}m\`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  } else if (commandName === 'serverinfo') {
    const guild = interaction.guild;
    const embed = new EmbedBuilder()
      .setTitle(\`📋 \${guild.name}\`)
      .setColor(0x5865F2)
      .addFields(
        { name: '👥 Members', value: String(guild.memberCount), inline: true },
        { name: '💬 Channels', value: String(guild.channels.cache.size), inline: true },
        { name: '🔊 Roles', value: String(guild.roles.cache.size), inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }
});

client.on('guildMemberAdd', (member) => {
  const channel = member.guild.systemChannel;
  if (channel) channel.send(\`👋 Welcome to the server, \${member}! We're glad to have you here.\`);
});

client.login(process.env.DISCORD_TOKEN);
`);
  }

  // ── WhatsApp Bot (baileys) ──────────────────────────────────────────────────
  else if (templateId === "be270609-6019-4f60-ac84-42bceb667ad4") {
    write("package.json", JSON.stringify({
      name: "whatsapp-bot",
      version: "1.0.0",
      main: "index.js",
      scripts: { start: "node index.js" },
      dependencies: {
        "@whiskeysockets/baileys": "^6.7.9",
        "pino": "^8.17.0",
        "dotenv": "^16.0.3",
        "qrcode-terminal": "^0.12.0"
      }
    }, null, 2));

    write("index.js", `require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const SESSION_ID = process.env.SESSION_ID;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: !SESSION_ID,
    browser: ['BeraPanel Bot', 'Chrome', '110.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !SESSION_ID) {
      console.log('Scan this QR code with WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) setTimeout(connectToWhatsApp, 3000);
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Bot connected!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message) continue;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const from = msg.key.remoteJid;

      if (text.toLowerCase() === '!ping') {
        await sock.sendMessage(from, { text: '🏓 Pong! Bot is online on BeraPanel.' });
      } else if (text.toLowerCase() === '!help') {
        await sock.sendMessage(from, {
          text: '🤖 *BeraPanel WhatsApp Bot*\\n\\n!ping - Check status\\n!help - Show commands\\n!time - Server time\\n!info - Bot info'
        });
      } else if (text.toLowerCase() === '!time') {
        await sock.sendMessage(from, { text: \`🕐 Server time: \${new Date().toLocaleString()}\` });
      } else if (text.toLowerCase() === '!info') {
        await sock.sendMessage(from, { text: '🤖 Running on BeraPanel\\n🛡️ Powered by @whiskeysockets/baileys' });
      }
    }
  });

  return sock;
}

connectToWhatsApp();
`);
  }

  // ── Python Flask API ────────────────────────────────────────────────────────
  else if (templateId === "a321bf28-6c5c-49a6-a40e-a693b70a5cb5") {
    write("requirements.txt", [
      "flask==3.0.0",
      "flask-jwt-extended==4.6.0",
      "flask-cors==4.0.0",
      "python-dotenv==1.0.0",
      "gunicorn==21.2.0",
    ].join("\n"));

    write(".env.example", "SECRET_KEY=change-me-to-a-random-secret\nPORT=3000\n");

    write("app.py", `import os
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)
CORS(app)

# In-memory "database" — replace with real DB in production
USERS = {'admin': 'password123'}

@app.route('/')
def index():
    return jsonify({
        'name': 'BeraPanel Flask API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': ['/login', '/api/me', '/api/hello', '/api/time']
    })

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '')
    password = data.get('password', '')
    if USERS.get(username) == password:
        token = create_access_token(identity=username)
        return jsonify(access_token=token, message='Login successful')
    return jsonify(error='Invalid credentials'), 401

@app.route('/api/me')
@jwt_required()
def me():
    return jsonify(username=get_jwt_identity(), platform='BeraPanel')

@app.route('/api/hello')
def hello():
    name = request.args.get('name', 'World')
    return jsonify(message=f'Hello, {name}!', platform='BeraPanel')

@app.route('/api/time')
def current_time():
    from datetime import datetime
    return jsonify(time=datetime.utcnow().isoformat(), timezone='UTC')

@app.route('/api/echo', methods=['POST'])
def echo():
    return jsonify(echo=request.get_json())

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f'🐍 Flask API running on port {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
`);

    write("Procfile", "web: gunicorn app:app\n");
  }

  // ── Group Management Bot ────────────────────────────────────────────────────
  else if (templateId === "0b0a32e8-88cc-4b0f-a99a-7a7ed8f50034") {
    write("package.json", JSON.stringify({
      name: "telegram-group-manager",
      version: "1.0.0",
      main: "index.js",
      scripts: { start: "node index.js" },
      dependencies: { telegraf: "^4.15.6", dotenv: "^16.0.3" }
    }, null, 2));

    write("index.js", `require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const warns = new Map();

const isAdmin = async (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') return true;
  const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
  return ['administrator', 'creator'].includes(member.status);
};

bot.start((ctx) => ctx.reply(
  '👮 *Group Management Bot*\\n\\nAdd me to a group and make me admin!\\n\\n' +
  '*Admin Commands:*\\n/ban - Ban user\\n/kick - Kick user\\n/mute - Mute user\\n/warn - Warn user\\n/warns - Check warnings\\n/pin - Pin message\\n/welcome - Set welcome message',
  { parse_mode: 'Markdown' }
));

bot.command('ban', async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Admin only');
  if (!ctx.message.reply_to_message) return ctx.reply('Reply to a user to ban them.');
  const user = ctx.message.reply_to_message.from;
  await ctx.telegram.banChatMember(ctx.chat.id, user.id);
  ctx.reply(\`🚫 \${user.first_name} has been banned.\`);
});

bot.command('kick', async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Admin only');
  if (!ctx.message.reply_to_message) return ctx.reply('Reply to a user to kick them.');
  const user = ctx.message.reply_to_message.from;
  await ctx.telegram.banChatMember(ctx.chat.id, user.id);
  await ctx.telegram.unbanChatMember(ctx.chat.id, user.id);
  ctx.reply(\`👢 \${user.first_name} has been kicked.\`);
});

bot.command('mute', async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Admin only');
  if (!ctx.message.reply_to_message) return ctx.reply('Reply to a user to mute them.');
  const user = ctx.message.reply_to_message.from;
  const until = Math.floor(Date.now() / 1000) + 3600;
  await ctx.telegram.restrictChatMember(ctx.chat.id, user.id, {
    permissions: { can_send_messages: false }, until_date: until
  });
  ctx.reply(\`🔇 \${user.first_name} muted for 1 hour.\`);
});

bot.command('warn', async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Admin only');
  if (!ctx.message.reply_to_message) return ctx.reply('Reply to a user to warn them.');
  const user = ctx.message.reply_to_message.from;
  const key = \`\${ctx.chat.id}:\${user.id}\`;
  const count = (warns.get(key) || 0) + 1;
  warns.set(key, count);
  ctx.reply(\`⚠️ \${user.first_name} warned! (\${count}/3)\`);
  if (count >= 3) {
    await ctx.telegram.banChatMember(ctx.chat.id, user.id);
    ctx.reply(\`🚫 \${user.first_name} auto-banned after 3 warnings.\`);
    warns.delete(key);
  }
});

bot.command('warns', async (ctx) => {
  if (!ctx.message.reply_to_message) return ctx.reply('Reply to check warns.');
  const user = ctx.message.reply_to_message.from;
  const count = warns.get(\`\${ctx.chat.id}:\${user.id}\`) || 0;
  ctx.reply(\`⚠️ \${user.first_name} has \${count}/3 warnings.\`);
});

bot.command('pin', async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Admin only');
  if (!ctx.message.reply_to_message) return ctx.reply('Reply to a message to pin it.');
  await ctx.telegram.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
  ctx.reply('📌 Message pinned!');
});

bot.on('new_chat_members', (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (!member.is_bot) {
      ctx.reply(\`👋 Welcome to the group, \${member.first_name}! Please read the rules.\`);
    }
  }
});

bot.on('left_chat_member', (ctx) => {
  const member = ctx.message.left_chat_member;
  if (!member.is_bot) ctx.reply(\`👋 \${member.first_name} has left the group.\`);
});

bot.launch({ dropPendingUpdates: true });
console.log('👮 Group Management Bot started!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`);
  }
}

// ── Language / Runtime Detection ───────────────────────────────────────────────
export function detectRuntime(dir: string): {
  runtime: string;
  installCommand: string;
  startCommand: string;
  buildCommand: string | null;
} {
  const has = (f: string) => fs.existsSync(path.join(dir, f));
  const read = (f: string): any => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; }
  };

  // Node.js
  if (has("package.json")) {
    const pkg = read("package.json");
    const rawStart = pkg?.scripts?.start || pkg?.scripts?.["start:prod"] || null;
    const build = pkg?.scripts?.build || null;
    const isNextJs = !!pkg?.dependencies?.next || !!pkg?.devDependencies?.next;
    const isVite = !!pkg?.dependencies?.vite || !!pkg?.devDependencies?.vite;
    const usesPM = has("pnpm-lock.yaml") ? "pnpm" : has("yarn.lock") ? "yarn" : "npm";
    let installCmd = `${usesPM} install`;

    // Replace process managers (pm2, forever, nodemon) with direct node invocation
    // pm2/forever/nodemon are not installed in the BeraPanel runtime environment
    let startCmd = rawStart;
    if (startCmd && /^(pm2|forever|nodemon)\s/.test(startCmd)) {
      // Extract the target script from the pm2/forever/nodemon command
      // e.g. "pm2 start index.js --name foo" → "node index.js"
      // e.g. "nodemon server.js" → "node server.js"
      const scriptMatch = startCmd.match(/(?:pm2\s+start|forever\s+start|nodemon)\s+([^\s]+\.(?:js|cjs|mjs|ts))/);
      const mainFile = scriptMatch?.[1] || pkg?.main || "index.js";
      startCmd = `node ${mainFile}`;
    }

    startCmd = startCmd || (isNextJs ? "node .next/standalone/server.js" : `node ${pkg?.main || "index.js"}`);
    let buildCmd = build || (isNextJs ? `${usesPM} run build` : null);
    return { runtime: "node", installCommand: installCmd, startCommand: startCmd, buildCommand: buildCmd };
  }

  // Python
  if (has("requirements.txt") || has("pyproject.toml") || has("Pipfile")) {
    const mainFile = has("main.py") ? "main.py" : has("app.py") ? "app.py" : has("server.py") ? "server.py" : has("run.py") ? "run.py" : "main.py";
    const installCmd = has("Pipfile") ? "pip install pipenv && pipenv install" : has("pyproject.toml") ? "pip install ." : "pip install -r requirements.txt";
    return { runtime: "python", installCommand: installCmd, startCommand: `python ${mainFile}`, buildCommand: null };
  }

  // Go
  if (has("go.mod")) {
    return { runtime: "go", installCommand: "go mod download", startCommand: "go run .", buildCommand: "go build -o app . && ./app" };
  }

  // Bun
  if (has("bun.lockb")) {
    const pkg = read("package.json");
    const start = pkg?.scripts?.start || null;
    return { runtime: "bun", installCommand: "bun install", startCommand: start || "bun index.ts", buildCommand: pkg?.scripts?.build ? "bun run build" : null };
  }

  // PHP
  if (has("composer.json") || has("index.php")) {
    return { runtime: "php", installCommand: has("composer.json") ? "composer install" : "echo 'no deps'", startCommand: "php -S 0.0.0.0:$PORT", buildCommand: null };
  }

  // Ruby
  if (has("Gemfile")) {
    const mainFile = has("config.ru") ? "config.ru" : "app.rb";
    return { runtime: "ruby", installCommand: "bundle install", startCommand: has("config.ru") ? "bundle exec rackup -p $PORT" : `ruby ${mainFile}`, buildCommand: null };
  }

  // Static sites (HTML only)
  if (has("index.html") || has("public/index.html")) {
    return { runtime: "static", installCommand: "echo 'Static site - no install needed'", startCommand: "npx serve . -p $PORT", buildCommand: null };
  }

  // Deno
  if (has("deno.json") || has("deno.jsonc") || has("mod.ts")) {
    return { runtime: "deno", installCommand: "echo 'Deno - no install step'", startCommand: "deno run --allow-all mod.ts", buildCommand: null };
  }

  // Fallback: Node
  return { runtime: "node", installCommand: "npm install", startCommand: "node index.js", buildCommand: null };
}

// ── Auto-detect start command from package.json after clone ────────────────────
export function detectStartCommand(dir: string): string | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    return pkg?.scripts?.start || pkg?.scripts?.["start:prod"] || null;
  } catch {
    return null;
  }
}

export async function startProcess(project: { id: string; startCommand: string; envVars: Record<string, string> | null; port: number; autoRestart: boolean }): Promise<void> {
  // Do not start if a deploy is currently in progress for this project
  if (deployingProjects.has(project.id)) {
    console.log(`[pm] Skipping startProcess for ${project.id} — deploy in progress`);
    return;
  }

  const dir = path.join(PROJECTS_DIR, project.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  stopProcess(project.id);

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    ...(project.envVars || {}),
    PORT: String(project.port),
  };

  const proc = spawn("sh", ["-c", project.startCommand], {
    cwd: dir,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  processes.set(project.id, proc);
  broadcastLog(project.id, `[BeraPanel] Starting: ${project.startCommand}\n`);

  proc.stdout?.on("data", (d: Buffer) => broadcastLog(project.id, d.toString()));
  proc.stderr?.on("data", (d: Buffer) => broadcastLog(project.id, d.toString()));

  proc.on("exit", async (code) => {
    broadcastLog(project.id, `[BeraPanel] Process exited with code ${code}\n`);
    processes.delete(project.id);

    await db.update(projectsTable)
      .set({ status: code === 0 ? "stopped" : "error", crashCount: ((project as any).crashCount ?? 0) + 1 })
      .where(eq(projectsTable.id, project.id));

    if (project.autoRestart && code !== 0 && !deployingProjects.has(project.id)) {
      const crashCount = ((project as any).crashCount ?? 0) + 1;
      if (crashCount <= 5) {
        broadcastLog(project.id, `[BeraPanel] Auto-restarting in 3s... (attempt ${crashCount}/5)\n`);
        setTimeout(() => {
          if (!deployingProjects.has(project.id)) {
            startProcess({ ...project, ...({ crashCount } as any) });
          }
        }, 3000);
      } else {
        broadcastLog(project.id, `[BeraPanel] Too many crashes — stopping auto-restart. Please redeploy.\n`);
        await db.update(projectsTable).set({ status: "error" }).where(eq(projectsTable.id, project.id));
      }
    }
  });

  await db.update(projectsTable).set({ status: "running", port: project.port }).where(eq(projectsTable.id, project.id));
}

export function stopProcess(projectId: string): void {
  const proc = processes.get(projectId);
  if (proc) {
    proc.kill("SIGTERM");
    setTimeout(() => {
      if (!proc.killed) proc.kill("SIGKILL");
    }, 5000);
    processes.delete(projectId);
  }
}

export function isRunning(projectId: string): boolean {
  return processes.has(projectId);
}

export async function deployFromGit(
  project: { id: string; repoUrl: string | null; branch: string; installCommand: string; startCommand: string; buildCommand: string | null; envVars: Record<string, string> | null; port: number | null; autoRestart: boolean; runtime?: string; templateId?: string | null },
  userId?: string
): Promise<string> {
  const dir = path.join(PROJECTS_DIR, project.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const port = project.port || assignPort();
  const startTime = Date.now();
  let buildLog = "";

  const log = (msg: string) => {
    buildLog += msg;
    broadcastLog(project.id, msg);
  };

  const deployId = (await db.insert(deployHistoryTable).values({
    projectId: project.id,
    userId,
    source: "git",
    status: "building",
  }).returning({ id: deployHistoryTable.id }))[0].id;

  await db.update(projectsTable).set({ status: "building", port }).where(eq(projectsTable.id, project.id));

  try {
    const repoUrl = project.repoUrl || "";
    const hasRepo = repoUrl.trim().length > 0;

    log(`[BeraPanel] ════════════════════════════════════════\n`);
    if (hasRepo) {
      log(`[BeraPanel] Deploying from: ${repoUrl}\n`);
      log(`[BeraPanel] Branch: ${project.branch}\n`);
    } else {
      log(`[BeraPanel] Generating template files...\n`);
    }
    log(`[BeraPanel] ════════════════════════════════════════\n`);

    // Mark this project as deploying to prevent race-condition auto-restarts
    deployingProjects.add(project.id);
    stopProcess(project.id); // Stop any running instance before deploying

    const runCmd = (cmd: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        log(`[BeraPanel] $ ${cmd}\n`);
        // Clear Replit git credential helper — not available in production environment
        const cmdEnv = { ...process.env as Record<string, string> };
        delete cmdEnv.GIT_ASKPASS;
        delete cmdEnv.GIT_CREDENTIAL_HELPER;
        cmdEnv.GIT_TERMINAL_PROMPT = "0";
        const proc = spawn("sh", ["-c", cmd], { cwd: dir, env: cmdEnv, stdio: ["pipe", "pipe", "pipe"] });
        proc.stdout?.on("data", (d: Buffer) => log(d.toString()));
        proc.stderr?.on("data", (d: Buffer) => log(d.toString()));
        proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
      });
    };

    // Clone / pull — or generate from built-in template when no repoUrl
    if (!hasRepo && project.templateId) {
      // No repo URL — generate bot files from built-in template
      const existing = fs.readdirSync(dir);
      if (existing.length > 0) {
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
      }
      log(`[BeraPanel] Writing template files for template: ${project.templateId}\n`);
      generateTemplateFiles(dir, project.templateId, project.envVars || {});
      log(`[BeraPanel] ✅ Template files generated\n`);
    } else if (hasRepo) {
      // Clone / pull — handle all directory states robustly
      if (fs.existsSync(path.join(dir, ".git"))) {
        // Has git history — clean reset to avoid local changes blocking pull
        await runCmd(`git fetch origin && git reset --hard origin/${project.branch}`);
      } else {
        // No .git folder — clear any stale files from a previous failed clone, then clone fresh
        const existing = fs.readdirSync(dir);
        if (existing.length > 0) {
          log(`[BeraPanel] Clearing stale directory (${existing.length} items) for fresh clone...\n`);
          fs.rmSync(dir, { recursive: true, force: true });
          fs.mkdirSync(dir, { recursive: true });
        }
        await runCmd(`git clone --depth 1 --branch ${project.branch} ${repoUrl} .`);
      }
    } else {
      throw new Error("No repository URL or template ID provided — cannot deploy.");
    }

    // Auto-detect runtime and commands after clone/extract
    const detected = detectRuntime(dir);
    let installCommand = project.installCommand || detected.installCommand;
    let startCommand = project.startCommand;
    let buildCommand = project.buildCommand;

    // If start command is the generic default, upgrade it using detectRuntime's sanitized result
    // (detectRuntime already strips pm2/forever/nodemon → node)
    if (startCommand === "node index.js" && detected.runtime === "node" && detected.startCommand !== "node index.js") {
      startCommand = detected.startCommand;
      log(`[BeraPanel] Auto-detected start command: ${startCommand}\n`);
    }

    // If runtime mismatch, use all detected values
    if (project.runtime !== detected.runtime && project.runtime === "node" && detected.runtime !== "node") {
      installCommand = detected.installCommand;
      startCommand = detected.startCommand;
      buildCommand = detected.buildCommand;
      log(`[BeraPanel] Auto-detected runtime: ${detected.runtime}\n`);
    }

    log(`[BeraPanel] Runtime: ${detected.runtime}\n`);
    log(`[BeraPanel] Install: ${installCommand}\n`);
    log(`[BeraPanel] Start:   ${startCommand}\n`);
    if (buildCommand) log(`[BeraPanel] Build:   ${buildCommand}\n`);

    // Install
    log(`[BeraPanel] ── Installing dependencies ──\n`);
    await runCmd(installCommand);

    // Build
    if (buildCommand) {
      log(`[BeraPanel] ── Building ──\n`);
      await runCmd(buildCommand);
    }

    const liveUrl = getLiveUrl(project.id);
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update project with detected runtime/commands
    await db.update(projectsTable).set({
      status: "running",
      port,
      liveUrl,
      lastDeployedAt: new Date(),
      deployCount: (project as any).deployCount ? (project as any).deployCount + 1 : 1,
      startCommand,
      installCommand,
      ...(buildCommand !== undefined ? { buildCommand } : {}),
      runtime: detected.runtime,
    }).where(eq(projectsTable.id, project.id));

    await db.update(deployHistoryTable).set({ status: "success", buildLog, durationSeconds: duration }).where(eq(deployHistoryTable.id, deployId));

    // Release the deploy lock BEFORE starting the process — startProcess checks this lock
    deployingProjects.delete(project.id);

    // Start the process
    await startProcess({ ...project, startCommand, port, autoRestart: project.autoRestart, envVars: project.envVars });

    // Log the live URL prominently at the end
    log(`[BeraPanel] ════════════════════════════════════════\n`);
    log(`[BeraPanel] ✅ DEPLOY SUCCESSFUL in ${duration}s\n`);
    log(`[BeraPanel] 🌐 Live URL: ${liveUrl}\n`);
    log(`[BeraPanel] ════════════════════════════════════════\n`);

    return liveUrl;
  } catch (err: any) {
    deployingProjects.delete(project.id); // Release deploy lock on failure too
    const duration = Math.floor((Date.now() - startTime) / 1000);
    log(`[BeraPanel] ❌ DEPLOY FAILED after ${duration}s: ${err.message}\n`);
    await db.update(projectsTable).set({ status: "error" }).where(eq(projectsTable.id, project.id));
    await db.update(deployHistoryTable).set({ status: "failed", buildLog, durationSeconds: duration }).where(eq(deployHistoryTable.id, deployId));
    throw err;
  }
}

export function getProjectDir(projectId: string): string {
  return path.join(PROJECTS_DIR, projectId);
}

export { PROJECTS_DIR };
