import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Layers, Rocket, Search, Filter, Star, Download,
  Globe, Bot, Zap, Code2, Database, MessageSquare,
  Terminal, GitBranch, Package, Play, CheckCircle2, Clock
} from "lucide-react";

const BASE = "/api/brucepanel";
function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) },
  }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText); return r.json(); });
}

const TEMPLATES = [
  {
    id: "node-express",
    name: "Express REST API",
    description: "A production-ready Express.js REST API with authentication, logging, and error handling baked in.",
    runtime: "node",
    icon: "🟢",
    tags: ["node", "express", "api", "rest"],
    stars: 482,
    deploys: 1240,
    difficulty: "Easy",
    envVars: [],
    startCommand: "node index.js",
    installCommand: "npm install",
    featured: true,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "python-flask",
    name: "Flask Web App",
    description: "Python Flask web application with SQLAlchemy ORM, Jinja2 templates, and session management.",
    runtime: "python",
    icon: "🐍",
    tags: ["python", "flask", "web", "orm"],
    stars: 317,
    deploys: 890,
    difficulty: "Easy",
    envVars: ["DATABASE_URL", "SECRET_KEY"],
    startCommand: "python app.py",
    installCommand: "pip install -r requirements.txt",
    featured: true,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    description: "Full-featured Telegram bot with command routing, inline keyboards, and webhook support.",
    runtime: "node",
    icon: "✈️",
    tags: ["telegram", "bot", "node"],
    stars: 621,
    deploys: 2100,
    difficulty: "Easy",
    envVars: ["BOT_TOKEN"],
    startCommand: "node bot.js",
    installCommand: "npm install",
    featured: true,
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "discord-bot",
    name: "Discord Bot",
    description: "Discord.js slash command bot with event handlers, permission checks, and MongoDB integration.",
    runtime: "node",
    icon: "🎮",
    tags: ["discord", "bot", "node"],
    stars: 534,
    deploys: 1870,
    difficulty: "Medium",
    envVars: ["DISCORD_TOKEN", "CLIENT_ID"],
    startCommand: "node index.js",
    installCommand: "npm install",
    featured: false,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "next-app",
    name: "Next.js App",
    description: "Next.js 14 with App Router, TypeScript, Tailwind CSS, and SEO optimization included.",
    runtime: "node",
    icon: "⚡",
    tags: ["react", "next", "frontend", "typescript"],
    stars: 713,
    deploys: 3200,
    difficulty: "Medium",
    envVars: ["NEXTAUTH_SECRET"],
    startCommand: "npm start",
    installCommand: "npm install",
    featured: true,
    color: "from-gray-700 to-gray-900",
  },
  {
    id: "fastapi",
    name: "FastAPI Backend",
    description: "Modern async Python REST API with FastAPI, Pydantic v2 validation, and Swagger docs auto-generated.",
    runtime: "python",
    icon: "⚡",
    tags: ["python", "fastapi", "async", "api"],
    stars: 289,
    deploys: 670,
    difficulty: "Medium",
    envVars: ["DATABASE_URL"],
    startCommand: "uvicorn main:app --host 0.0.0.0",
    installCommand: "pip install -r requirements.txt",
    featured: false,
    color: "from-teal-500 to-cyan-600",
  },
  {
    id: "whatsapp-bot",
    name: "WhatsApp Bot",
    description: "WhatsApp bot using Baileys library with multi-session support and command handler system.",
    runtime: "node",
    icon: "📱",
    tags: ["whatsapp", "bot", "node", "baileys"],
    stars: 876,
    deploys: 4300,
    difficulty: "Hard",
    envVars: [],
    startCommand: "node index.js",
    installCommand: "npm install",
    featured: true,
    color: "from-green-600 to-lime-600",
  },
  {
    id: "static-site",
    name: "Static Website",
    description: "Simple HTML/CSS/JS static website served with Node.js. Perfect for portfolios and landing pages.",
    runtime: "node",
    icon: "🌐",
    tags: ["html", "css", "js", "static"],
    stars: 156,
    deploys: 820,
    difficulty: "Easy",
    envVars: [],
    startCommand: "node server.js",
    installCommand: "npm install",
    featured: false,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "minecraft-bot",
    name: "Minecraft Bot",
    description: "Mineflayer-based Minecraft bot with pathfinding, auto-farm, and chat command support.",
    runtime: "node",
    icon: "⛏️",
    tags: ["minecraft", "bot", "mineflayer", "node"],
    stars: 432,
    deploys: 1560,
    difficulty: "Medium",
    envVars: ["MC_HOST", "MC_PORT", "MC_USERNAME"],
    startCommand: "node bot.js",
    installCommand: "npm install",
    featured: false,
    color: "from-brown-600 to-green-700",
  },
  {
    id: "strapi-cms",
    name: "Strapi CMS",
    description: "Headless CMS built with Strapi for managing content with a beautiful admin UI and REST/GraphQL API.",
    runtime: "node",
    icon: "📝",
    tags: ["cms", "strapi", "node", "api"],
    stars: 198,
    deploys: 430,
    difficulty: "Hard",
    envVars: ["DATABASE_URL", "JWT_SECRET", "ADMIN_JWT_SECRET"],
    startCommand: "npm start",
    installCommand: "npm install",
    featured: false,
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "redis-worker",
    name: "Background Worker",
    description: "Node.js background job processor using Bull queues and Redis. Ideal for async task processing.",
    runtime: "node",
    icon: "⚙️",
    tags: ["worker", "redis", "bull", "node"],
    stars: 124,
    deploys: 280,
    difficulty: "Medium",
    envVars: ["REDIS_URL"],
    startCommand: "node worker.js",
    installCommand: "npm install",
    featured: false,
    color: "from-red-600 to-pink-600",
  },
  {
    id: "go-api",
    name: "Go REST API",
    description: "High-performance Go REST API with Gin framework, JWT authentication, and PostgreSQL.",
    runtime: "go",
    icon: "🐹",
    tags: ["go", "gin", "api", "rest"],
    stars: 211,
    deploys: 340,
    difficulty: "Hard",
    envVars: ["DATABASE_URL", "JWT_SECRET"],
    startCommand: "./app",
    installCommand: "go build -o app",
    featured: false,
    color: "from-cyan-500 to-blue-600",
  },
];

const CATEGORIES = ["All", "Bot", "API", "Web", "CMS", "Worker"];
const RUNTIMES = ["All", "node", "python", "go"];

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Easy: "bg-green-500/10 border-green-500/30 text-green-400",
    Medium: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    Hard: "bg-red-500/10 border-red-500/30 text-red-400",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[level] || colors.Easy}`}>{level}</span>;
}

function TemplateCard({ tpl, onDeploy }: { tpl: typeof TEMPLATES[0]; onDeploy: (tpl: typeof TEMPLATES[0]) => void }) {
  return (
    <div className="glass-panel rounded-2xl border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col group">
      <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${tpl.color}`} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-xl shadow-md`}>
              {tpl.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm">{tpl.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">{tpl.runtime}</span>
                <DifficultyBadge level={tpl.difficulty} />
                {tpl.featured && <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded font-bold">⭐ FEATURED</span>}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">{tpl.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {tpl.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
          ))}
        </div>

        {tpl.envVars.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-[10px] text-yellow-400 font-semibold mb-1">Required env vars:</p>
            <div className="flex flex-wrap gap-1">
              {tpl.envVars.map(v => <code key={v} className="text-[9px] bg-yellow-500/10 text-yellow-300 px-1 py-0.5 rounded font-mono">{v}</code>)}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> {tpl.stars.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Rocket className="w-3 h-3 text-primary" /> {tpl.deploys.toLocaleString()} deploys</span>
        </div>

        <Button onClick={() => onDeploy(tpl)} className="w-full gap-2 bg-gradient-to-r from-primary to-accent border-none text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
          <Rocket className="w-4 h-4" /> Deploy Now
        </Button>
      </div>
    </div>
  );
}

function DeployModal({ tpl, onClose }: { tpl: typeof TEMPLATES[0]; onClose: () => void }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: tpl.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    startCommand: tpl.startCommand,
    installCommand: tpl.installCommand,
    runtime: tpl.runtime,
  });
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    try {
      const project = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          runtime: form.runtime,
          startCommand: form.startCommand,
          installCommand: form.installCommand,
          branch: "main",
          description: tpl.description,
        }),
      });
      toast({ title: "🚀 Project Created!", description: `${form.name} is being set up. Deploying now...` });
      navigate(`/projects/${project.id}`);
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${tpl.color}`} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-2xl`}>{tpl.icon}</div>
            <div>
              <h2 className="font-bold text-lg">Deploy {tpl.name}</h2>
              <p className="text-sm text-muted-foreground">{tpl.runtime} runtime</p>
            </div>
          </div>

          <form onSubmit={handleDeploy} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Project Name</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="my-awesome-project" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Command</label>
              <input required value={form.startCommand} onChange={e => setForm(p => ({ ...p, startCommand: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Install Command</label>
              <input value={form.installCommand} onChange={e => setForm(p => ({ ...p, installCommand: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            {tpl.envVars.length > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-xs font-semibold text-yellow-400 mb-1">⚠️ Add these env vars after deploying:</p>
                {tpl.envVars.map(v => <code key={v} className="block text-xs text-yellow-300 font-mono">{v}=your_value</code>)}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" isLoading={deploying} className="flex-1 bg-gradient-to-r from-primary to-accent border-none text-white gap-2">
                <Rocket className="w-4 h-4" /> Deploy Template
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [runtime, setRuntime] = useState("All");
  const [deployTpl, setDeployTpl] = useState<typeof TEMPLATES[0] | null>(null);

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase()));
    const matchCat = category === "All" || t.tags.some(tag => tag.toLowerCase() === category.toLowerCase()) || t.name.toLowerCase().includes(category.toLowerCase());
    const matchRuntime = runtime === "All" || t.runtime === runtime;
    return matchSearch && matchCat && matchRuntime;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Project Templates
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">One-click deploy from {TEMPLATES.length} production-ready starters</p>
        </div>
        <div className="flex items-center gap-2 text-sm glass-panel px-4 py-2 rounded-xl border border-border">
          <Rocket className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold text-primary">{TEMPLATES.reduce((a, t) => a + t.deploys, 0).toLocaleString()}</span>
          <span className="text-muted-foreground">total deployments</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${category === cat ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>
        <select value={runtime} onChange={e => setRuntime(e.target.value)}
          className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
          {RUNTIMES.map(r => <option key={r} value={r}>{r === "All" ? "All Runtimes" : r}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-dashed border-border">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No templates found</h3>
          <p className="text-muted-foreground text-sm">Try different search terms or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => <TemplateCard key={tpl.id} tpl={tpl} onDeploy={setDeployTpl} />)}
        </div>
      )}

      {deployTpl && <DeployModal tpl={deployTpl} onClose={() => setDeployTpl(null)} />}
    </div>
  );
}
