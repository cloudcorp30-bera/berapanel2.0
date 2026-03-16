import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetProject, useDeployProject, useStartProject, useStopProject, useRestartProject,
  useGetProjectEnv, useUpdateProjectEnv, useGetProjectLogs, useDeleteProject
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTerminal } from "@/hooks/use-terminal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { 
  Activity, Play, Square, RotateCw, TerminalSquare, FileCode, Settings, FileText, 
  Rocket, Trash2, Save, Globe, Moon, Sun, Copy, Link, ExternalLink, Check,
  GitBranch, Cpu, HardDrive, Clock, Shield, Bell
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQueryClient } from "@tanstack/react-query";

const BASE = "/api/brucepanel";
function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) },
  }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText); return r.json(); });
}

export function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, navigate] = useLocation();
  const projectId = params?.id || "";
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading, refetch } = useGetProject(projectId);
  useEffect(() => { const t = setInterval(() => refetch(), 5000); return () => clearInterval(t); }, [refetch]);
  
  const deployMut = useDeployProject();
  const startMut = useStartProject();
  const stopMut = useStopProject();
  const restartMut = useRestartProject();

  const handleAction = (mut: any, actionName: string) => {
    mut.mutate({ id: projectId }, {
      onSuccess: () => { toast({ title: "Success", description: `${actionName} initiated.` }); refetch(); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const handleSleep = async () => {
    try {
      await apiFetch(`/projects/${projectId}/sleep`, { method: "POST" });
      toast({ title: "💤 Project sleeping", description: "Coins paused while sleeping." });
      refetch();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleWake = async () => {
    try {
      await apiFetch(`/projects/${projectId}/wake`, { method: "POST" });
      toast({ title: "☀️ Project woke up!", description: "Project is starting back up." });
      refetch();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'running': return 'success';
      case 'error': return 'destructive';
      case 'building': return 'warning';
      case 'sleeping': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'running': return <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block mr-1" />;
      case 'sleeping': return <Moon className="w-3 h-3 inline mr-1 text-blue-400" />;
      case 'building': return <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block mr-1" />;
      case 'error': return <span className="w-2 h-2 rounded-full bg-red-400 inline-block mr-1" />;
      default: return null;
    }
  };

  if (isLoading || !project) return <div className="text-center p-12 animate-pulse font-mono">Loading container stats...</div>;

  const liveUrl = project.liveUrl?.startsWith('http') ? project.liveUrl : project.liveUrl ? `https://${project.liveUrl}` : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {project.name}
            <Badge variant={getStatusColor(project.status) as any} className="text-xs px-2 py-0.5 flex items-center gap-1">
              {getStatusIcon(project.status)}{project.status.toUpperCase()}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {project.runtime} • {project.branch} • <span className="text-yellow-400">{project.coinCostPerHour} coins/hr</span>
            {project.port && <span className="ml-2 text-muted-foreground">• Port {project.port}</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {liveUrl && (
            <Button variant="outline" className="gap-2 text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => window.open(liveUrl, '_blank')}>
              <Globe className="w-4 h-4"/> Visit Site
            </Button>
          )}
          {project.status === 'sleeping' ? (
            <Button variant="outline" onClick={handleWake} className="gap-2 hover:text-yellow-400 hover:border-yellow-400/30">
              <Sun className="w-4 h-4" /> Wake Up
            </Button>
          ) : project.status === 'running' ? (
            <>
              <Button variant="outline" onClick={handleSleep} className="gap-2 hover:text-blue-400 hover:border-blue-400/30">
                <Moon className="w-4 h-4" /> Sleep
              </Button>
              <Button variant="outline" onClick={() => handleAction(stopMut, 'Stop')} isLoading={stopMut.isPending} className="hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => handleAction(startMut, 'Start')} isLoading={startMut.isPending} className="hover:text-success hover:bg-success/10 hover:border-success/30">
              <Play className="w-4 h-4 mr-2" /> Start
            </Button>
          )}
          <Button variant="outline" onClick={() => handleAction(restartMut, 'Restart')} isLoading={restartMut.isPending}>
            <RotateCw className="w-4 h-4 mr-2" /> Restart
          </Button>
          <Button onClick={() => handleAction(deployMut, 'Deploy')} isLoading={deployMut.isPending} className="bg-gradient-to-r from-primary to-accent border-none text-white">
            <Rocket className="w-4 h-4 mr-2" /> Deploy
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'logs', label: 'Logs', icon: FileText },
          { id: 'terminal', label: 'Terminal', icon: TerminalSquare },
          { id: 'env', label: 'Variables', icon: Settings },
          { id: 'editor', label: 'Code', icon: FileCode },
          { id: 'settings', label: 'Settings', icon: Shield },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'overview' && <OverviewTab project={project} />}
        {activeTab === 'logs' && <LogsTab projectId={project.id} />}
        {activeTab === 'terminal' && <TerminalTab projectId={project.id} />}
        {activeTab === 'env' && <EnvTab projectId={project.id} />}
        {activeTab === 'editor' && <div className="glass-panel p-8 rounded-2xl flex items-center justify-center text-muted-foreground">File editor available via Terminal tab.</div>}
        {activeTab === 'settings' && <SettingsTab project={project} onRefresh={refetch} onDelete={() => navigate("/projects")} />}
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: any }) {
  const mockData = Array.from({length: 24}).map((_, i) => ({
    time: `${i}:00`,
    cpu: Math.random() * 30 + 10,
    ram: Math.random() * 100 + 200
  }));

  const liveUrl = project.liveUrl?.startsWith('http') ? project.liveUrl : project.liveUrl ? `https://${project.liveUrl}` : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Live URL Banner */}
        {liveUrl && (
          <div className="glass-panel p-4 rounded-2xl border border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live URL</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-green-300 flex-1 truncate font-mono">{liveUrl}</code>
              <button onClick={() => navigator.clipboard.writeText(liveUrl)} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors" title="Copy">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => window.open(liveUrl, '_blank')} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors" title="Open">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            {project.customDomain && (
              <div className="mt-2 pt-2 border-t border-green-500/20 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-green-400" />
                <code className="text-xs text-green-300 font-mono">{project.customDomain}</code>
                <span className="text-[10px] text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">Custom Domain</span>
              </div>
            )}
          </div>
        )}

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-6">Resource Usage (24h)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="cpu" name="CPU %" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="ram" name="RAM MB" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorRam)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4">Configuration</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <span className="text-muted-foreground block mb-1 text-xs">Start Command</span>
              <code className="text-primary text-xs break-all">{project.startCommand || "—"}</code>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <span className="text-muted-foreground block mb-1 text-xs">Install Command</span>
              <code className="text-accent text-xs break-all">{project.installCommand || "—"}</code>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <span className="text-muted-foreground block mb-1 text-xs">Repo URL</span>
              <code className="text-xs break-all">{project.repoUrl || "—"}</code>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <span className="text-muted-foreground block mb-1 text-xs">Branch</span>
              <code className="text-xs">{project.branch || "main"}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-base font-bold mb-4">Quick Stats</h3>
          <ul className="space-y-3 text-sm">
            {[
              { label: "Status", value: project.status },
              { label: "Runtime", value: project.runtime },
              { label: "Memory Limit", value: `${project.memoryLimitMb || 512} MB` },
              { label: "Port", value: project.port || "—" },
              { label: "Auto Restart", value: project.autoRestart ? "✅ On" : "❌ Off" },
              { label: "Cost", value: `${project.coinCostPerHour} coins/hr` },
              { label: "Created", value: formatTimeAgo(project.createdAt) },
              { label: "Last Deploy", value: project.lastDeployedAt ? formatTimeAgo(project.lastDeployedAt) : "Never" },
              { label: "Deploy Count", value: project.deployCount || 0 },
              { label: "Project ID", value: project.id.slice(0, 8) + "…" },
            ].map(({ label, value }) => (
              <li key={label} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-medium text-xs text-right">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ project, onRefresh, onDelete }: { project: any; onRefresh: () => void; onDelete: () => void }) {
  const { toast } = useToast();
  const [domain, setDomain] = useState(project.customDomain || "");
  const [webhookSecret, setWebhookSecret] = useState(project.webhookSecret || "");
  const [form, setForm] = useState({
    name: project.name || "",
    startCommand: project.startCommand || "",
    installCommand: project.installCommand || "",
    branch: project.branch || "main",
    memoryLimitMb: project.memoryLimitMb || 512,
    autoRestart: project.autoRestart ?? true,
  });
  const [copied, setCopied] = useState<string | null>(null);
  const deleteMut = useDeleteProject();

  const baseUrl = window.location.origin.replace(window.location.pathname, "");
  const webhookUrl = `${baseUrl}/api/brucepanel/projects/${project.id}/webhook${webhookSecret ? `?secret=${webhookSecret}` : ""}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const saveSettings = async () => {
    try {
      await apiFetch(`/projects/${project.id}/settings`, {
        method: "PATCH", body: JSON.stringify({ ...form, webhookSecret: webhookSecret || null }),
      });
      toast({ title: "✅ Settings saved" });
      onRefresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const saveDomain = async () => {
    try {
      await apiFetch(`/projects/${project.id}/domain`, {
        method: "PATCH", body: JSON.stringify({ customDomain: domain || null }),
      });
      toast({ title: "✅ Custom domain saved" });
      onRefresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = () => {
    if (!confirm(`Permanently delete "${project.name}"? All data will be lost.`)) return;
    deleteMut.mutate({ id: project.id }, {
      onSuccess: () => { toast({ title: "Project deleted" }); onDelete(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="overflow-y-auto pb-10 space-y-6">
      {/* Project Settings */}
      <div className="glass-panel rounded-2xl border border-border p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Project Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Project Name", key: "name", type: "text" },
            { label: "Branch", key: "branch", type: "text" },
            { label: "Start Command", key: "startCommand", type: "text" },
            { label: "Install Command", key: "installCommand", type: "text" },
            { label: "Memory Limit (MB)", key: "memoryLimitMb", type: "number" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="autoRestart" checked={form.autoRestart}
              onChange={e => setForm(f => ({ ...f, autoRestart: e.target.checked }))} className="accent-primary w-4 h-4" />
            <label htmlFor="autoRestart" className="text-sm cursor-pointer">Auto-restart on crash</label>
          </div>
        </div>
        <Button onClick={saveSettings} className="mt-4 bg-primary hover:bg-primary/90 border-none text-white gap-2">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>

      {/* GitHub Auto-Deploy Webhook */}
      <div className="glass-panel rounded-2xl border border-border p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><GitBranch className="w-4 h-4 text-green-400" /> GitHub Auto-Deploy</h3>
        <p className="text-sm text-muted-foreground mb-4">Add this URL as a webhook in your GitHub repository. Every push will automatically redeploy this project.</p>
        
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Webhook Secret (optional but recommended)</label>
          <input type="text" placeholder="mysecretkey123" value={webhookSecret}
            onChange={e => setWebhookSecret(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <p className="text-xs text-muted-foreground mt-1">Set this same secret in GitHub → Settings → Webhooks → Secret</p>
        </div>

        <div className="bg-secondary/60 rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">Your Webhook URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-green-300 font-mono break-all">{webhookUrl}</code>
            <button onClick={() => copy(webhookUrl, "webhook")}
              className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              {copied === "webhook" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs font-semibold text-blue-400 mb-2">📋 GitHub Setup Steps:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to your GitHub repo → <strong>Settings → Webhooks → Add webhook</strong></li>
            <li>Paste the webhook URL above into <strong>Payload URL</strong></li>
            <li>Set <strong>Content type</strong> to <code className="text-blue-300">application/json</code></li>
            <li>Enter your secret (if set above) into <strong>Secret</strong></li>
            <li>Select <strong>Just the push event</strong> and click <strong>Add webhook</strong></li>
            <li>✅ Every git push now auto-deploys your project!</li>
          </ol>
        </div>

        <Button onClick={saveSettings} className="mt-4 bg-green-600 hover:bg-green-500 border-none text-white gap-2">
          <Save className="w-4 h-4" /> Save Webhook Secret
        </Button>
      </div>

      {/* Custom Domain */}
      <div className="glass-panel rounded-2xl border border-border p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Custom Domain</h3>
        <p className="text-sm text-muted-foreground mb-4">Point your own domain to this project. Set a CNAME record pointing to your BeraPanel URL.</p>
        <div className="flex gap-3">
          <input type="text" placeholder="app.yourdomain.com" value={domain}
            onChange={e => setDomain(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <Button onClick={saveDomain} className="bg-accent hover:bg-accent/90 border-none text-white">
            <Save className="w-4 h-4 mr-2" /> Save Domain
          </Button>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">DNS Setup:</strong> Create a <code>CNAME</code> record in your DNS provider:<br />
            <code className="text-primary text-xs mt-1 block">
              {domain || "yourdomain.com"} → CNAME → {window.location.hostname}
            </code>
          </p>
        </div>
      </div>

      {/* Sleep / Wake */}
      <div className="glass-panel rounded-2xl border border-border p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Moon className="w-4 h-4 text-blue-400" /> Sleep Mode</h3>
        <p className="text-sm text-muted-foreground mb-4">Sleep your project to pause coin consumption. Wake it up anytime to bring it back online instantly.</p>
        <div className="flex gap-3">
          {project.status === 'sleeping' ? (
            <Button onClick={async () => { try { await apiFetch(`/projects/${project.id}/wake`, { method: "POST" }); onRefresh(); } catch {} }}
              className="bg-yellow-500 hover:bg-yellow-400 border-none text-black gap-2">
              <Sun className="w-4 h-4" /> Wake Project
            </Button>
          ) : (
            <Button onClick={async () => { try { await apiFetch(`/projects/${project.id}/sleep`, { method: "POST" }); onRefresh(); } catch {} }}
              variant="outline" className="gap-2 hover:text-blue-400 hover:border-blue-400/30">
              <Moon className="w-4 h-4" /> Sleep Project (pauses billing)
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Current status: <strong className="text-foreground">{project.status}</strong> 
          {project.status !== 'sleeping' ? ` — ${project.coinCostPerHour} coins/hr being consumed` : " — Billing paused ✅"}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-bold mb-1 text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">This will permanently stop and delete this project. All files, logs, and data will be gone. This cannot be undone.</p>
        <Button variant="destructive" onClick={handleDelete} isLoading={deleteMut.isPending} className="gap-2">
          <Trash2 className="w-4 h-4" /> Delete Project Permanently
        </Button>
      </div>
    </div>
  );
}

function LogsTab({ projectId }: { projectId: string }) {
  const { data, refetch } = useGetProjectLogs(projectId, { lines: 300 });
  useEffect(() => { const t = setInterval(() => refetch(), 3000); return () => clearInterval(t); }, [refetch]);
  
  return (
    <div className="h-full bg-black rounded-xl border border-border overflow-hidden flex flex-col">
      <div className="bg-secondary px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">stdout / stderr — live tail</span>
        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
        {data?.logs || "No logs yet. Deploy your project to see output here."}
      </div>
    </div>
  );
}

function TerminalTab({ projectId }: { projectId: string }) {
  const { terminalRef, isConnected } = useTerminal(projectId);
  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant={isConnected ? "success" : "destructive"}>
          {isConnected ? "Connected to PTY" : "Disconnected"}
        </Badge>
        <span className="text-xs text-muted-foreground">Interactive terminal — type commands directly</span>
      </div>
      <div className="flex-1 bg-black rounded-xl border border-border overflow-hidden p-2">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
}

function EnvTab({ projectId }: { projectId: string }) {
  const { data, isLoading, refetch } = useGetProjectEnv(projectId);
  const updateMut = useUpdateProjectEnv();
  const { toast } = useToast();
  const [envText, setEnvText] = useState("");

  useEffect(() => {
    if (data?.env) {
      setEnvText(Object.entries(data.env).map(([k,v]) => `${k}=${v}`).join('\n'));
    }
  }, [data]);

  const handleSave = () => {
    const newEnv: Record<string, string> = {};
    envText.split('\n').forEach(l => {
      const match = l.match(/^([^=]+)=(.*)$/);
      if (match) newEnv[match[1].trim()] = match[2].trim();
    });
    updateMut.mutate({ id: projectId, data: { env: newEnv } }, {
      onSuccess: () => { toast({ title: "Environment Updated", description: "Container will restart to apply changes." }); refetch(); }
    });
  };

  if (isLoading) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">Environment Variables</p>
          <p className="text-xs text-muted-foreground mt-0.5">One per line: KEY=value — changes take effect on next restart</p>
        </div>
        <Button onClick={handleSave} isLoading={updateMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white">
          <Save className="w-4 h-4"/> Save & Restart
        </Button>
      </div>
      <div className="flex-1 border border-border rounded-xl overflow-hidden">
        <Editor 
          height="100%" 
          defaultLanguage="ini" 
          theme="vs-dark"
          value={envText}
          onChange={(val) => setEnvText(val || '')}
          options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: 'JetBrains Mono', lineNumbers: 'on' }}
        />
      </div>
    </div>
  );
}
