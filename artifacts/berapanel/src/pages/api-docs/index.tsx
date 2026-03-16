import { useState } from "react";
import { Copy, Check, ExternalLink, ChevronDown, ChevronRight, BookOpen, Terminal, Key, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ApiDocsPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["auth", "projects"]));
  const token = localStorage.getItem("token") || "your_jwt_token";
  const BASE_URL = "https://bruce-panel-1.replit.app/api/brucepanel";

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(null), 2000);
  };

  const toggle = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const Code = ({ children, id }: { children: string; id?: string }) => (
    <div className="relative group">
      <pre className="bg-black/60 rounded-xl border border-border px-4 py-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
      {id && (
        <button onClick={() => copy(children, id)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-all">
          {copied === id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );

  interface Endpoint { method: string; path: string; desc: string; auth?: boolean; body?: string; response?: string; example?: string; }

  const Badge = ({ label, color }: { label: string; color: string }) => (
    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${color}`}>{label}</span>
  );

  const methodColor: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    POST: "bg-green-500/20 text-green-300 border border-green-500/30",
    PATCH: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    DELETE: "bg-red-500/20 text-red-300 border border-red-500/30",
    PUT: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  };

  const Section = ({ id, title, icon, endpoints }: { id: string; title: string; icon: React.ReactNode; endpoints: Endpoint[] }) => {
    const open = openSections.has(id);
    return (
      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        <button onClick={() => toggle(id)} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
          <span className="text-primary">{icon}</span>
          <h2 className="font-bold text-base flex-1 text-left">{title}</h2>
          <span className="text-muted-foreground text-xs mr-2">{endpoints.length} endpoints</span>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {open && (
          <div className="border-t border-border divide-y divide-border/50">
            {endpoints.map((ep, i) => (
              <div key={i} className="px-6 py-5 space-y-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <Badge label={ep.method} color={methodColor[ep.method] || "bg-gray-500/20 text-gray-300"} />
                  <code className="text-sm font-mono text-accent">{ep.path}</code>
                  {ep.auth && <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">🔑 Auth required</span>}
                </div>
                <p className="text-sm text-muted-foreground">{ep.desc}</p>
                {ep.body && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Request Body</p>
                    <Code id={`body-${id}-${i}`}>{ep.body}</Code>
                  </div>
                )}
                {ep.response && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Response</p>
                    <Code id={`resp-${id}-${i}`}>{ep.response}</Code>
                  </div>
                )}
                {ep.example && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">cURL Example</p>
                    <Code id={`ex-${id}-${i}`}>{ep.example}</Code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const authHeader = `-H "Authorization: Bearer ${token}"`;

  const sections = [
    {
      id: "auth",
      title: "Authentication",
      icon: <Key className="w-4 h-4" />,
      endpoints: [
        {
          method: "POST", path: "/auth/register", auth: false,
          desc: "Register a new user account. Optionally pass a referral code to earn bonus coins for the referrer.",
          body: `{\n  "username": "alice",\n  "password": "secret123",\n  "email": "alice@example.com",\n  "referralCode": "BERA-ABC123"  // optional\n}`,
          response: `{ "token": "eyJhbGci...", "user": { "id": 1, "username": "alice", "coins": 50 } }`,
          example: `curl -X POST ${BASE_URL}/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"alice","password":"secret123"}'`
        },
        {
          method: "POST", path: "/auth/login", auth: false,
          desc: "Login and get a JWT token. Store this token and include it in the Authorization header for all protected endpoints.",
          body: `{\n  "username": "alice",\n  "password": "secret123"\n}`,
          response: `{ "token": "eyJhbGci...", "user": { "id": 1, "username": "alice", "role": "user", "coins": 200 } }`,
          example: `curl -X POST ${BASE_URL}/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"alice","password":"secret123"}'`
        },
        {
          method: "GET", path: "/auth/me", auth: true,
          desc: "Get the currently authenticated user's profile, including coin balance, role, and referral code.",
          response: `{\n  "id": 1, "username": "alice", "email": "alice@example.com",\n  "coins": 500, "role": "user", "referralCode": "BERA-ABC123",\n  "emailVerified": false, "createdAt": "2026-01-01T00:00:00Z"\n}`,
          example: `curl ${BASE_URL}/auth/me \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/auth/change-password", auth: true,
          desc: "Change your account password.",
          body: `{ "currentPassword": "old", "newPassword": "new123" }`,
          example: `curl -X POST ${BASE_URL}/auth/change-password \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{"currentPassword":"old","newPassword":"new123"}'`
        },
      ]
    },
    {
      id: "projects",
      title: "Projects",
      icon: <Terminal className="w-4 h-4" />,
      endpoints: [
        {
          method: "GET", path: "/projects", auth: true,
          desc: "List all projects owned by the authenticated user.",
          response: `[\n  {\n    "id": "uuid", "name": "my-api", "status": "running",\n    "port": 3100, "runtime": "node", "liveUrl": "https://bruce-panel-1.replit.app/app/uuid/",\n    "repoUrl": "https://github.com/user/repo", "branch": "main"\n  }\n]`,
          example: `curl ${BASE_URL}/projects \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects", auth: true,
          desc: "Create a new project. The platform automatically assigns a port.",
          body: `{\n  "name": "my-telegram-bot",\n  "repoUrl": "https://github.com/user/bot",\n  "branch": "main",\n  "runtime": "node",\n  "startCommand": "node bot.js",\n  "installCommand": "npm install",\n  "buildCommand": ""\n}`,
          response: `{ "id": "uuid", "name": "my-telegram-bot", "port": 3101, "status": "idle", ... }`,
          example: `curl -X POST ${BASE_URL}/projects \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"my-bot","repoUrl":"https://github.com/user/bot"}'`
        },
        {
          method: "GET", path: "/projects/:id", auth: true,
          desc: "Get detailed info about a single project including live URL, env vars count, and runtime.",
          example: `curl ${BASE_URL}/projects/uuid \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/deploy", auth: true,
          desc: "Deploy the project by cloning/pulling from Git, running install & build commands, then starting the process.",
          example: `curl -X POST ${BASE_URL}/projects/uuid/deploy \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/start", auth: true,
          desc: "Start a stopped or idle project process.",
          example: `curl -X POST ${BASE_URL}/projects/uuid/start \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/stop", auth: true,
          desc: "Stop a running project process.",
          example: `curl -X POST ${BASE_URL}/projects/uuid/stop \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/restart", auth: true,
          desc: "Restart a project (stop then start).",
          example: `curl -X POST ${BASE_URL}/projects/uuid/restart \\\n  ${authHeader}`
        },
        {
          method: "GET", path: "/projects/:id/logs", auth: true,
          desc: "Retrieve recent stdout/stderr logs. Optional query param: ?lines=500",
          response: `{ "logs": "> node index.js\\nServer running on port 3100\\n..." }`,
          example: `curl "${BASE_URL}/projects/uuid/logs?lines=200" \\\n  ${authHeader}`
        },
        {
          method: "GET", path: "/projects/:id/metrics", auth: true,
          desc: "Get real-time CPU %, memory usage MB, uptime, and process restarts.",
          response: `{ "cpu": 1.2, "memory": 48, "uptime": 3600, "restarts": 0, "pid": 12345 }`,
          example: `curl ${BASE_URL}/projects/uuid/metrics \\\n  ${authHeader}`
        },
        {
          method: "PATCH", path: "/projects/:id/settings", auth: true,
          desc: "Update project settings: name, startCommand, installCommand, buildCommand, branch, runtime, memoryLimitMb, autoRestart, webhookSecret.",
          body: `{\n  "startCommand": "node server.js",\n  "installCommand": "npm install",\n  "buildCommand": "npm run build",\n  "runtime": "node",\n  "autoRestart": true\n}`,
          example: `curl -X PATCH ${BASE_URL}/projects/uuid/settings \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{"startCommand":"node server.js"}'`
        },
        {
          method: "GET", path: "/projects/:id/detect-commands", auth: true,
          desc: "Auto-detect the runtime, install, build, and start commands from the deployed project files.",
          response: `{\n  "detected": true, "runtime": "node",\n  "installCommand": "npm install", "startCommand": "node index.js",\n  "buildCommand": "", "availableScripts": { "start": "node index.js", "test": "jest" },\n  "files": ["index.js", "package.json", ...]\n}`,
          example: `curl ${BASE_URL}/projects/uuid/detect-commands \\\n  ${authHeader}`
        },
        {
          method: "DELETE", path: "/projects/:id", auth: true,
          desc: "Permanently delete a project, its files, and all associated resources.",
          example: `curl -X DELETE ${BASE_URL}/projects/uuid \\\n  ${authHeader}`
        },
      ]
    },
    {
      id: "env",
      title: "Environment Variables",
      icon: <span className="text-sm">⚙️</span>,
      endpoints: [
        {
          method: "GET", path: "/projects/:id/env", auth: true,
          desc: "Get all environment variables for a project.",
          response: `{ "env": { "PORT": "3100", "DATABASE_URL": "postgres://...", "BOT_TOKEN": "..." } }`,
          example: `curl ${BASE_URL}/projects/uuid/env \\\n  ${authHeader}`
        },
        {
          method: "PUT", path: "/projects/:id/env", auth: true,
          desc: "Replace all environment variables for a project. Pass a flat key-value object.",
          body: `{\n  "BOT_TOKEN": "123456:ABC-DEF",\n  "NODE_ENV": "production",\n  "DATABASE_URL": "postgres://..."\n}`,
          example: `curl -X PUT ${BASE_URL}/projects/uuid/env \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{"BOT_TOKEN":"...","NODE_ENV":"production"}'`
        },
        {
          method: "GET", path: "/projects/:id/env/detect", auth: true,
          desc: "Scan project files to detect commonly-needed environment variables (e.g. BOT_TOKEN, DATABASE_URL, PORT).",
          response: `[\n  { "key": "BOT_TOKEN", "defaultValue": "", "source": "bot.js:5", "description": "Telegram Bot Token" },\n  { "key": "DATABASE_URL", "defaultValue": "postgres://localhost/db", "source": "package.json" }\n]`,
          example: `curl ${BASE_URL}/projects/uuid/env/detect \\\n  ${authHeader}`
        },
      ]
    },
    {
      id: "economy",
      title: "Coins & Economy",
      icon: <span className="text-sm">🪙</span>,
      endpoints: [
        {
          method: "GET", path: "/economy/balance", auth: true,
          desc: "Get current coin balance and total earned.",
          response: `{ "coins": 500, "totalEarned": 750 }`,
          example: `curl ${BASE_URL}/economy/balance \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/economy/topup", auth: true,
          desc: "Initiate a M-Pesa payment via PayHero to top up coins. Amount is in KES.",
          body: `{ "phone": "0712345678", "amount": 100 }`,
          response: `{ "message": "Payment initiated", "reference": "BERA-xyz..." }`,
          example: `curl -X POST ${BASE_URL}/economy/topup \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{"phone":"0712345678","amount":100}'`
        },
        {
          method: "GET", path: "/economy/transactions", auth: true,
          desc: "Get coin transaction history.",
          response: `[{ "id": 1, "amount": 100, "type": "topup", "description": "M-Pesa top-up", "createdAt": "..." }]`,
          example: `curl ${BASE_URL}/economy/transactions \\\n  ${authHeader}`
        },
        {
          method: "GET", path: "/economy/referral/info", auth: true,
          desc: "Get referral stats: your code, how many you've referred, referees, and coins earned.",
          response: `{\n  "referralCode": "BERA-ABC123",\n  "totalReferrals": 3,\n  "totalEarned": 30,\n  "bonusPerReferral": 10,\n  "referees": [{ "username": "bob", "joinedAt": "..." }]\n}`,
          example: `curl ${BASE_URL}/economy/referral/info \\\n  ${authHeader}`
        },
        {
          method: "GET", path: "/economy/referral/leaderboard", auth: false,
          desc: "Get the top 10 referrers leaderboard.",
          response: `[{ "username": "alice", "referrals": 25, "coinsEarned": 250 }]`,
          example: `curl ${BASE_URL}/economy/referral/leaderboard`
        },
      ]
    },
    {
      id: "webhooks",
      title: "Webhooks & Auto-Deploy",
      icon: <Zap className="w-4 h-4" />,
      endpoints: [
        {
          method: "POST", path: "/projects/:id/webhook", auth: false,
          desc: "GitHub webhook endpoint. Add this to your repo's webhook settings to auto-deploy on every push. Optionally verify with ?secret=yourSecret.",
          example: `# GitHub will POST to:\nhttps://bruce-panel-1.replit.app/api/brucepanel/projects/uuid/webhook?secret=mySecret`
        },
        {
          method: "GET", path: "/projects/:id/health", auth: true,
          desc: "Ping the project's live URL and return latency and status code.",
          response: `{ "status": 200, "latencyMs": 42, "url": "https://bruce-panel-1.replit.app/app/uuid/", "alive": true }`,
          example: `curl ${BASE_URL}/projects/uuid/health \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/sleep", auth: true,
          desc: "Put a project to sleep (stops it and pauses coin deduction).",
          example: `curl -X POST ${BASE_URL}/projects/uuid/sleep \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/wake", auth: true,
          desc: "Wake a sleeping project (restart it and resume coin deduction).",
          example: `curl -X POST ${BASE_URL}/projects/uuid/wake \\\n  ${authHeader}`
        },
      ]
    },
    {
      id: "crons",
      title: "Cron Jobs",
      icon: <span className="text-sm">⏰</span>,
      endpoints: [
        {
          method: "GET", path: "/projects/:id/crons", auth: true,
          desc: "List all cron jobs for a project.",
          response: `[{ "id": "uuid", "name": "cleanup", "schedule": "0 * * * *", "command": "node cleanup.js", "enabled": true }]`,
          example: `curl ${BASE_URL}/projects/uuid/crons \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/crons", auth: true,
          desc: "Create a new cron job. Schedule uses standard cron syntax.",
          body: `{\n  "name": "cleanup",\n  "schedule": "0 * * * *",\n  "command": "node cleanup.js"\n}`,
          example: `curl -X POST ${BASE_URL}/projects/uuid/crons \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"cleanup","schedule":"0 * * * *","command":"node cleanup.js"}'`
        },
        {
          method: "PATCH", path: "/projects/:id/crons/:cronId", auth: true,
          desc: "Update a cron job's schedule, command, or enabled status.",
          body: `{ "enabled": false }`,
          example: `curl -X PATCH ${BASE_URL}/projects/uuid/crons/cron-uuid \\\n  ${authHeader} \\\n  -d '{"enabled":false}'`
        },
        {
          method: "DELETE", path: "/projects/:id/crons/:cronId", auth: true,
          desc: "Delete a cron job.",
          example: `curl -X DELETE ${BASE_URL}/projects/uuid/crons/cron-uuid \\\n  ${authHeader}`
        },
      ]
    },
    {
      id: "team",
      title: "Team Collaboration",
      icon: <span className="text-sm">👥</span>,
      endpoints: [
        {
          method: "GET", path: "/projects/:id/team", auth: true,
          desc: "Get team members for a project.",
          response: `{ "owner": {...}, "members": [{ "id": "...", "username": "bob", "role": "developer" }] }`,
          example: `curl ${BASE_URL}/projects/uuid/team \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/projects/:id/team", auth: true,
          desc: "Invite a user to the project team.",
          body: `{ "username": "bob", "role": "developer" }`,
          example: `curl -X POST ${BASE_URL}/projects/uuid/team \\\n  ${authHeader} \\\n  -d '{"username":"bob","role":"developer"}'`
        },
        {
          method: "DELETE", path: "/projects/:id/team/:memberId", auth: true,
          desc: "Remove a team member from the project.",
          example: `curl -X DELETE ${BASE_URL}/projects/uuid/team/member-uuid \\\n  ${authHeader}`
        },
      ]
    },
    {
      id: "community",
      title: "Community Chat",
      icon: <span className="text-sm">💬</span>,
      endpoints: [
        {
          method: "GET", path: "/chat/messages", auth: true,
          desc: "Get recent chat messages (up to 100).",
          response: `[{ "id": 1, "content": "Hello!", "username": "alice", "createdAt": "..." }]`,
          example: `curl ${BASE_URL}/chat/messages \\\n  ${authHeader}`
        },
        {
          method: "POST", path: "/chat/messages", auth: true,
          desc: "Send a chat message to the community.",
          body: `{ "content": "Hello BeraPanel!" }`,
          example: `curl -X POST ${BASE_URL}/chat/messages \\\n  ${authHeader} \\\n  -d '{"content":"Hello BeraPanel!"}'`
        },
        {
          method: "GET", path: "/chat/stream", auth: true,
          desc: "Server-sent events stream for live chat messages. Use ?token=JWT since EventSource can't set headers.",
          example: `const es = new EventSource(\`${BASE_URL}/chat/stream?token=\${token}\`);\nes.onmessage = (e) => console.log(JSON.parse(e.data));`
        },
      ]
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="glass-panel rounded-2xl border border-border p-6 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">BeraPanel API Reference</h1>
            <p className="text-muted-foreground mt-1">REST API documentation for BeraPanel 2.0. All endpoints are prefixed with <code className="text-accent text-sm">/api/brucepanel</code>.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">Base URL: {BASE_URL}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300">JSON API</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300">JWT Auth</span>
            </div>
          </div>
          <a href="https://github.com/cloudcorp30-bera/berapanel2.0" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-white/20">
            <ExternalLink className="w-3.5 h-3.5" /> GitHub
          </a>
        </div>
      </div>

      {/* Auth header usage */}
      <div className="glass-panel rounded-2xl border border-border p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Key className="w-4 h-4 text-orange-400" /> Authentication</h2>
        <p className="text-sm text-muted-foreground">All protected endpoints require a <code className="text-accent">Bearer</code> token in the Authorization header. Log in to get your token.</p>
        <div className="relative group">
          <pre className="bg-black/60 rounded-xl border border-border px-4 py-3 text-xs font-mono text-gray-300">
{`Authorization: Bearer ${token}`}
          </pre>
          <button onClick={() => copy(`Authorization: Bearer ${token}`, "auth-header")}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-all">
            {copied === "auth-header" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">💡 This page automatically uses your current session token in all examples.</p>
      </div>

      {/* Sections */}
      {sections.map(s => (
        <Section key={s.id} id={s.id} title={s.title} icon={s.icon} endpoints={s.endpoints} />
      ))}

      {/* Error codes */}
      <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold">HTTP Status Codes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { code: "200", desc: "Success", color: "text-green-400" },
            { code: "201", desc: "Created", color: "text-green-400" },
            { code: "400", desc: "Bad Request — invalid input", color: "text-yellow-400" },
            { code: "401", desc: "Unauthorized — missing or invalid token", color: "text-orange-400" },
            { code: "403", desc: "Forbidden — insufficient permissions", color: "text-orange-400" },
            { code: "404", desc: "Not Found", color: "text-red-400" },
            { code: "409", desc: "Conflict — resource already exists", color: "text-red-400" },
            { code: "500", desc: "Internal Server Error", color: "text-red-500" },
          ].map(({ code, desc, color }) => (
            <div key={code} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-2.5">
              <code className={`text-sm font-bold font-mono ${color}`}>{code}</code>
              <span className="text-sm text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
