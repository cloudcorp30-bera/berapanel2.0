import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useListProjects, useDeleteProject, useStartProject, useStopProject, useRestartProject, useDeployProject } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Play, Square, Trash2, ExternalLink, Globe, Server, Clock, RotateCw,
  Copy, Check, Moon, Sun, Rocket, Zap, Activity, AlertTriangle, Coins,
  GitBranch, TrendingUp, ChevronRight, Eye, WifiOff, Wifi
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

const BASE = "/api/brucepanel";
function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) },
  }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText); return r.json(); });
}

type HealthState = { healthy: boolean; latencyMs: number | null; checking: boolean };

function useProjectHealth(projectId: string, liveUrl: string | null, status: string) {
  const [health, setHealth] = useState<HealthState>({ healthy: false, latencyMs: null, checking: false });

  const check = useCallback(async () => {
    if (status !== "running" || !liveUrl) return;
    setHealth(h => ({ ...h, checking: true }));
    try {
      const data = await apiFetch(`/projects/${projectId}/health`);
      setHealth({ healthy: data.healthy, latencyMs: data.latencyMs, checking: false });
    } catch {
      setHealth({ healthy: false, latencyMs: null, checking: false });
    }
  }, [projectId, liveUrl, status]);

  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [check]);

  return health;
}

function HealthBadge({ projectId, liveUrl, status }: { projectId: string; liveUrl: string | null; status: string }) {
  const health = useProjectHealth(projectId, liveUrl, status);
  if (status !== "running" || !liveUrl) return null;
  if (health.checking) return <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />Checking</span>;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${health.healthy ? "text-green-400" : "text-red-400"}`}>
      {health.healthy ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
      {health.healthy ? (health.latencyMs ? `${health.latencyMs}ms` : "Online") : "Unreachable"}
    </span>
  );
}

function StatsBar({ projects }: { projects: any[] }) {
  const running = projects.filter(p => p.status === "running").length;
  const sleeping = projects.filter(p => p.status === "sleeping").length;
  const error = projects.filter(p => p.status === "error").length;
  const building = projects.filter(p => p.status === "building").length;
  const coinBurn = projects.filter(p => p.status === "running").reduce((s, p) => s + (p.coinCostPerHour || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {[
        { label: "Total", value: projects.length, icon: Server, color: "text-muted-foreground", bg: "bg-secondary/60" },
        { label: "Running", value: running, icon: Activity, color: "text-green-400", bg: "bg-green-500/10 border border-green-500/20" },
        { label: "Sleeping", value: sleeping, icon: Moon, color: "text-blue-400", bg: "bg-blue-500/10 border border-blue-500/20" },
        { label: "Building", value: building, icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10 border border-yellow-500/20" },
        { label: "Coins/hr", value: coinBurn, icon: Coins, color: "text-yellow-300", bg: "bg-yellow-500/10 border border-yellow-500/20" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`glass-panel rounded-xl p-3 flex items-center gap-3 ${bg}`}>
          <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
          <div>
            <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Copy URL"
      className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ProjectCard({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const startMut = useStartProject();
  const stopMut = useStopProject();
  const restartMut = useRestartProject();
  const deployMut = useDeployProject();
  const deleteMut = useDeleteProject();
  const [sleeping, setSleeping] = useState(false);
  const [waking, setWaking] = useState(false);

  const liveUrl = project.liveUrl
    ? (project.liveUrl.startsWith("http") ? project.liveUrl : `https://${project.liveUrl}`)
    : null;

  const action = (mut: any, name: string, id: string) => {
    mut.mutate({ id }, {
      onSuccess: () => { toast({ title: `${name} done` }); onRefresh(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handleSleep = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSleeping(true);
    try { await apiFetch(`/projects/${project.id}/sleep`, { method: "POST" }); toast({ title: "💤 Sleeping" }); onRefresh(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSleeping(false); }
  };

  const handleWake = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setWaking(true);
    try { await apiFetch(`/projects/${project.id}/wake`, { method: "POST" }); toast({ title: "☀️ Waking up..." }); onRefresh(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setWaking(false); }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    deleteMut.mutate({ id: project.id }, {
      onSuccess: () => { toast({ title: "Deleted" }); onRefresh(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
    running:  { color: "text-green-400 border-green-500/30 bg-green-500/10", dot: "bg-green-400 animate-pulse", label: "RUNNING" },
    sleeping: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10", dot: "bg-blue-400", label: "SLEEPING" },
    building: { color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", dot: "bg-yellow-400 animate-pulse", label: "BUILDING" },
    error:    { color: "text-red-400 border-red-500/30 bg-red-500/10", dot: "bg-red-400", label: "ERROR" },
    stopped:  { color: "text-muted-foreground border-border bg-secondary/30", dot: "bg-muted-foreground", label: "STOPPED" },
  };
  const sc = statusConfig[project.status] || statusConfig.stopped;

  return (
    <div className="glass-panel rounded-2xl border border-border hover:border-primary/40 transition-all duration-200 group overflow-hidden">
      {/* Main row */}
      <div className="p-4 flex items-center gap-4">
        {/* Status dot + icon */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${sc.dot}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/projects/${project.id}`}>
              <span className="font-bold text-base hover:text-primary transition-colors cursor-pointer">{project.name}</span>
            </Link>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>{sc.label}</span>
            <HealthBadge projectId={project.id} liveUrl={liveUrl} status={project.status} />
          </div>

          {/* Live URL row — always visible when there's a URL */}
          {liveUrl && (
            <div className="flex items-center gap-1.5 mt-1">
              <Globe className="w-3 h-3 text-green-400 flex-shrink-0" />
              <code className="text-xs text-green-300 font-mono truncate max-w-xs">{liveUrl}</code>
              <CopyButton text={liveUrl} />
            </div>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="font-mono bg-secondary/60 px-1.5 py-0.5 rounded">{project.runtime}</span>
            {project.branch && <span className="flex items-center gap-0.5"><GitBranch className="w-2.5 h-2.5" />{project.branch}</span>}
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{formatTimeAgo(project.updatedAt)}</span>
            {project.deployCount > 0 && <span className="flex items-center gap-0.5"><Rocket className="w-2.5 h-2.5" />{project.deployCount} deploy{project.deployCount !== 1 ? "s" : ""}</span>}
            {project.status === "running" && <span className="flex items-center gap-0.5 text-yellow-400"><Coins className="w-2.5 h-2.5" />{project.coinCostPerHour}/hr</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* OPEN LIVE URL — big green button, always visible when running */}
          {liveUrl && project.status === "running" && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-green-900/30">
              <Globe className="w-3.5 h-3.5" /> Open App
            </a>
          )}

          {/* Sleep/Wake */}
          {project.status === "sleeping" ? (
            <button onClick={handleWake} disabled={waking}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs transition-colors disabled:opacity-50">
              {waking ? <span className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" /> : <Sun className="w-3 h-3" />}
              Wake
            </button>
          ) : project.status === "running" ? (
            <button onClick={handleSleep} disabled={sleeping}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-400/30 text-xs transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50">
              {sleeping ? <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Moon className="w-3 h-3" />}
              Sleep
            </button>
          ) : null}

          {/* Start/Stop */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
            {project.status === "running" ? (
              <button onClick={(e) => { e.preventDefault(); action(stopMut, "Stopped", project.id); }}
                className="p-1.5 rounded-lg border border-border hover:text-red-400 hover:border-red-400/30 text-muted-foreground transition-colors" title="Stop">
                <Square className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={(e) => { e.preventDefault(); action(startMut, "Started", project.id); }}
                className="p-1.5 rounded-lg border border-border hover:text-green-400 hover:border-green-400/30 text-muted-foreground transition-colors" title="Start">
                <Play className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={(e) => { e.preventDefault(); action(restartMut, "Restarted", project.id); }}
              className="p-1.5 rounded-lg border border-border hover:text-primary hover:border-primary/30 text-muted-foreground transition-colors" title="Restart">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.preventDefault(); action(deployMut, "Deploy started", project.id); }}
              className="p-1.5 rounded-lg border border-border hover:text-accent hover:border-accent/30 text-muted-foreground transition-colors" title="Deploy">
              <Rocket className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete}
              className="p-1.5 rounded-lg border border-border hover:text-red-400 hover:border-red-400/30 text-muted-foreground transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <Link href={`/projects/${project.id}`}>
              <button className="p-1.5 rounded-lg border border-border hover:text-foreground hover:border-border text-muted-foreground transition-colors" title="Manage">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Deploy status bar — shows when building */}
      {project.status === "building" && (
        <div className="h-0.5 w-full bg-secondary overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent animate-[progress_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
      )}
    </div>
  );
}

export function ProjectsList() {
  const { data: projects, isLoading, refetch } = useListProjects();
  useEffect(() => { const t = setInterval(() => refetch(), 6000); return () => clearInterval(t); }, [refetch]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass-panel rounded-2xl h-24 animate-pulse" />)}
      </div>
    );
  }

  const allProjects = projects || [];
  const filtered = allProjects
    .filter(p => filter === "all" || p.status === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.runtime?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {allProjects.length} project{allProjects.length !== 1 ? "s" : ""}
            {allProjects.filter(p => p.status === "running").length > 0 && (
              <span className="ml-2 text-green-400">• {allProjects.filter(p => p.status === "running").length} running</span>
            )}
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent border-none text-white shadow-lg">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {allProjects.length > 0 && <StatsBar projects={allProjects} />}

      {/* Filter + Search */}
      {allProjects.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-secondary/60 rounded-xl p-1">
            {["all", "running", "sleeping", "stopped", "error"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <input
            type="text" placeholder="Search projects..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-xs bg-secondary border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      )}

      {/* Empty state */}
      {allProjects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <Server className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-6">Deploy your first project and earn 100 bonus coins!</p>
          <Link href="/projects/new">
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent border-none text-white">
              <Plus className="w-4 h-4" /> Create First Project
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No projects match your filter.</p>
          <button onClick={() => { setFilter("all"); setSearch(""); }} className="text-primary text-sm mt-2 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} onRefresh={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
