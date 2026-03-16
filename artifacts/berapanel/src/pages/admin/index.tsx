import { useState, useEffect, useCallback } from "react";
import {
  useGetAdminDashboard, useAdminListUsers, useAdminListCoinPackages,
  useAdminCreateCoinPackage, useAdminUpdateCoinPackage, useAdminDeleteCoinPackage,
  useAdminListAirdrops, useAdminCreateAirdrop, useAdminListAnnouncements,
  useAdminCreateAnnouncement, useAdminListTickets, useAdminSendNotification,
  useGetSystemInfo,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users, Server, DollarSign, Activity, Shield, Coins, BadgeCheck, Ban,
  Trash2, Edit, Plus, Package, Search, X,
  ArrowUpCircle, ArrowDownCircle, Crown, Megaphone, LifeBuoy, Zap,
  CheckCircle2, Gift, Bell, Settings, TrendingUp, Cpu, BarChart2,
  ClipboardList, Tag, AlertOctagon, RefreshCw, Database, Globe, Power,
  Lock, ChevronRight, MessageSquare, Send, ExternalLink, Eye,
  Bot, Star, CheckSquare, XSquare, Clock, FolderOpen, ToggleLeft, ToggleRight,
  GitBranch, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

const BASE = "/api/brucepanel";
function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) },
  }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText); return r.json(); });
}

function ago(d: string | Date | null | undefined) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    superadmin: "bg-red-500/20 text-red-400 border-red-500/30",
    admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    user: "bg-secondary text-muted-foreground border-border",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg[role] || cfg.user}`}>{role}</span>;
}

function StatCard({ icon: Icon, label, value, color, bg, border }: any) {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-border flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center border ${border} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-bold text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── User Management Modal ────────────────────────────────────────────────────
function UserModal({ user, onClose, onRefresh }: { user: any; onClose: () => void; onRefresh: () => void }) {
  const [modalTab, setModalTab] = useState<"info" | "projects" | "actions">("info");
  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [role, setRole] = useState(user.role || "user");
  const [banReason, setBanReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const invalidate = () => { onRefresh(); qc.invalidateQueries(); };

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const data = await apiFetch(`/admin/users/${user.id}`);
      setUserProjects(data.projects || []);
    } catch { setUserProjects([]); }
    finally { setProjectsLoading(false); }
  }, [user.id]);

  useEffect(() => { if (modalTab === "projects") loadProjects(); }, [modalTab, loadProjects]);

  const adjustCoins = async (sign: 1 | -1) => {
    const n = parseInt(coinAmount);
    if (!n || n <= 0) { toast({ title: "Enter a valid positive number", variant: "destructive" }); return; }
    try {
      await apiFetch(`/admin/users/${user.id}/coins`, {
        method: "POST",
        body: JSON.stringify({ amount: n * sign, reason: coinReason || (sign > 0 ? "Admin gift" : "Admin deduction") }),
      });
      toast({ title: sign > 0 ? `+${n} coins added ✅` : `-${n} coins deducted` });
      setCoinAmount(""); setCoinReason(""); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setUserRole = async () => {
    try {
      await apiFetch(`/admin/users/${user.id}/role`, { method: "POST", body: JSON.stringify({ role }) });
      toast({ title: `Role set to ${role}` }); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const executeBan = async (banned: boolean) => {
    try {
      await apiFetch(`/admin/users/${user.id}/ban`, { method: "POST", body: JSON.stringify({ banned, reason: banned ? (banReason || "Banned by admin") : null }) });
      toast({ title: banned ? "User banned" : "User unbanned" }); setShowBanDialog(false); invalidate(); onClose();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleVerified = async () => {
    try {
      await apiFetch(`/admin/users/${user.id}/verify`, { method: "POST" });
      toast({ title: user.emailVerified ? "Badge removed" : "✅ Blue badge granted!" }); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const deleteUser = async () => {
    if (!confirm(`Permanently delete "${user.username}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      toast({ title: "User deleted" }); invalidate(); onClose();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const resetPassword = async () => {
    const pw = prompt("New password for " + user.username + ":");
    if (!pw || pw.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
    try {
      await apiFetch(`/admin/users/${user.id}/reset-password`, { method: "POST", body: JSON.stringify({ newPassword: pw }) });
      toast({ title: "Password reset successfully" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const sendNotif = async () => {
    const msg = prompt("Notification message for " + user.username + ":");
    if (!msg) return;
    try {
      await apiFetch(`/admin/notifications`, { method: "POST", body: JSON.stringify({ title: "Admin Message", message: msg, type: "info", userIds: [user.id] }) });
      toast({ title: "Notification sent" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const forceStopProject = async (projectId: string) => {
    try {
      await apiFetch(`/admin/projects/${projectId}/stop`, { method: "POST" });
      toast({ title: "Project stopped" }); loadProjects();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const deleteProject = async (projectId: string, name: string) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/projects/${projectId}`, { method: "DELETE" });
      toast({ title: "Project deleted" }); loadProjects();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const modalTabs = [
    { id: "info" as const, label: "Info", icon: Users },
    { id: "projects" as const, label: "Projects", icon: FolderOpen },
    { id: "actions" as const, label: "Actions", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between flex-shrink-0 bg-card/80 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">{user.username}</span>
                {user.emailVerified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                {user.banned && <Ban className="w-4 h-4 text-destructive flex-shrink-0" />}
              </div>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {modalTabs.map(t => (
            <button key={t.id} onClick={() => setModalTab(t.id)}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors", modalTab === t.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5">

          {/* ── Info Tab ── */}
          {modalTab === "info" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass-panel rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                  <p className="font-mono font-bold text-yellow-400 text-sm">{(user.coins || 0).toLocaleString()}</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">Streak</p>
                  <p className="font-mono font-bold text-orange-400 text-sm">{user.streakDays || 0}d 🔥</p>
                </div>
                <div className="glass-panel rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
                  <p className="text-xs font-medium">{ago(user.createdAt)}</p>
                </div>
              </div>

              {user.banned && user.banReason && (
                <div className="glass-panel rounded-xl p-3 border border-destructive/30 bg-destructive/5">
                  <p className="text-xs font-semibold text-destructive mb-1">Ban Reason</p>
                  <p className="text-xs text-muted-foreground">{user.banReason}</p>
                </div>
              )}

              <div className="glass-panel rounded-xl p-4 border border-border">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-400" /> Adjust Coins</p>
                <div className="flex gap-2 mb-2">
                  <input type="number" min="1" placeholder="Amount" value={coinAmount} onChange={e => setCoinAmount(e.target.value)}
                    className="flex-1 min-w-0 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <Button className="gap-1 bg-green-600 hover:bg-green-500 border-none text-white px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0" onClick={() => adjustCoins(1)}>
                    <ArrowUpCircle className="w-4 h-4" /><span className="hidden sm:inline">Add</span>
                  </Button>
                  <Button className="gap-1 bg-red-600 hover:bg-red-500 border-none text-white px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0" onClick={() => adjustCoins(-1)}>
                    <ArrowDownCircle className="w-4 h-4" /><span className="hidden sm:inline">Deduct</span>
                  </Button>
                </div>
                <input type="text" placeholder="Reason (optional)" value={coinReason} onChange={e => setCoinReason(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div className="glass-panel rounded-xl p-4 border border-border">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-purple-400" /> Role</p>
                <div className="flex gap-2">
                  <select value={role} onChange={e => setRole(e.target.value)} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  <Button onClick={setUserRole} className="px-4 flex-shrink-0">Set</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Projects Tab ── */}
          {modalTab === "projects" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{user.username}'s Projects</p>
                <button onClick={loadProjects} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" /></div>
              ) : userProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No projects found.</div>
              ) : (
                userProjects.map((p: any) => (
                  <div key={p.id} className="glass-panel rounded-xl border border-border p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", {
                            "bg-green-500/10 border-green-500/30 text-green-400": p.status === "running",
                            "bg-yellow-500/10 border-yellow-500/30 text-yellow-400": p.status === "building",
                            "bg-secondary border-border text-muted-foreground": p.status === "stopped",
                            "bg-red-500/10 border-red-500/30 text-red-400": p.status === "error",
                          })}>{p.status}</span>
                          {p.runtime && <span className="text-[10px] text-muted-foreground">{p.runtime}</span>}
                          {p.port && <span className="text-[10px] text-muted-foreground font-mono">:{p.port}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {p.status === "running" && (
                          <button onClick={() => forceStopProject(p.id)} className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Force stop">
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => deleteProject(p.id, p.name)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Created {ago(p.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Actions Tab ── */}
          {modalTab === "actions" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={toggleVerified} className={cn("gap-2", user.emailVerified ? "text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30" : "text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30")}>
                  <BadgeCheck className="w-4 h-4" />{user.emailVerified ? "Remove Badge" : "Grant Badge"}
                </Button>
                <Button variant="outline" onClick={() => { if (user.banned) executeBan(false); else setShowBanDialog(true); }}
                  className={cn("gap-2", user.banned ? "text-green-400 hover:bg-green-500/10" : "text-destructive hover:bg-destructive/10 hover:border-destructive/30")}>
                  <Ban className="w-4 h-4" />{user.banned ? "Unban" : "Ban User"}
                </Button>
                <Button variant="outline" onClick={sendNotif} className="gap-2">
                  <Bell className="w-4 h-4" />Notify
                </Button>
                <Button variant="outline" onClick={resetPassword} className="gap-2">
                  <Lock className="w-4 h-4" />Reset PW
                </Button>
                <Button variant="outline" onClick={deleteUser} className="gap-2 text-destructive hover:bg-destructive/10 col-span-2">
                  <Trash2 className="w-4 h-4" />Delete Account Permanently
                </Button>
              </div>

              {showBanDialog && (
                <div className="glass-panel rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-destructive">Ban {user.username}</p>
                  <textarea
                    placeholder="Reason for ban (shown to user)..."
                    value={banReason} onChange={e => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-destructive hover:bg-destructive/90 border-none text-white" onClick={() => executeBan(true)}>Confirm Ban</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowBanDialog(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Package Modal ─────────────────────────────────────────────────────────────
function PackageModal({ pkg, onClose, onRefresh }: { pkg: any; onClose: () => void; onRefresh: () => void }) {
  const createMut = useAdminCreateCoinPackage();
  const updateMut = useAdminUpdateCoinPackage();
  const [form, setForm] = useState({ name: pkg?.name || "", description: pkg?.description || "", coins: pkg?.coins || 100, bonusCoins: pkg?.bonusCoins || 0, priceKsh: pkg?.priceKsh || 100, badge: pkg?.badge || "", enabled: pkg?.enabled !== false });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mut = pkg ? updateMut : createMut;
    const args = pkg ? { pkgId: pkg.id, data: form } : { data: form };
    (mut as any).mutate(args, {
      onSuccess: () => { toast({ title: pkg ? "Package updated" : "Package created" }); onRefresh(); onClose(); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">{pkg ? "Edit Package" : "New Coin Package"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {[
            { label: "Name", key: "name", type: "text" },
            { label: "Description", key: "description", type: "text" },
            { label: "Coins", key: "coins", type: "number" },
            { label: "Bonus Coins", key: "bonusCoins", type: "number" },
            { label: "Price (KSH)", key: "priceKsh", type: "number" },
            { label: "Badge (e.g. 'popular')", key: "badge", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
              <input required={key !== "badge" && key !== "description"} type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: type === "number" ? +e.target.value : e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(p => ({ ...p, enabled: e.target.checked }))} className="rounded" />
            Enabled (visible to users)
          </label>
          <Button type="submit" className="w-full" isLoading={(createMut as any).isPending || (updateMut as any).isPending}>{pkg ? "Save Changes" : "Create Package"}</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Airdrop Modal ─────────────────────────────────────────────────────────────
function AirdropModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const createMut = useAdminCreateAirdrop();
  const [form, setForm] = useState({ title: "", description: "", coins: 50, maxClaims: 100, expiresAt: "" });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: { ...form, expiresAt: form.expiresAt || undefined } }, {
      onSuccess: () => { toast({ title: "Airdrop created!" }); onRefresh(); onClose(); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">Create Airdrop</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {[
            { label: "Title", key: "title", type: "text" },
            { label: "Description", key: "description", type: "text" },
            { label: "Coins per Claim", key: "coins", type: "number" },
            { label: "Max Claims", key: "maxClaims", type: "number" },
            { label: "Expires At (optional)", key: "expiresAt", type: "datetime-local" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
              <input required={key !== "expiresAt"} type={type} value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: type === "number" ? +e.target.value : e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          ))}
          <Button type="submit" className="w-full" isLoading={createMut.isPending}>Create Airdrop</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Bot Modal ─────────────────────────────────────────────────────────────────
function BotModal({ bot, onClose, onRefresh }: { bot?: any; onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState({
    name: bot?.name || "",
    description: bot?.description || "",
    category: bot?.category || "utility",
    repoUrl: bot?.repoUrl || "",
    branch: bot?.branch || "main",
    startCommand: bot?.startCommand || "node index.js",
    installCommand: bot?.installCommand || "npm install",
    runtime: bot?.runtime || "node",
    coinCost: bot?.coinCost || 0,
    featured: bot?.featured || false,
    verified: bot?.verified || false,
    enabled: bot?.enabled !== false,
    previewImage: bot?.previewImage || "",
    readme: bot?.readme || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (bot) {
        await apiFetch(`/admin/bots/${bot.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast({ title: "Bot updated!" });
      } else {
        await apiFetch(`/admin/bots`, { method: "POST", body: JSON.stringify(form) });
        toast({ title: "Bot added to marketplace! 🤖" });
      }
      onRefresh(); onClose();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const categories = ["utility", "trading", "gaming", "productivity", "ai", "crypto", "social", "other"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-accent" />{bot ? "Edit Bot" : "Add Bot to Marketplace"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bot Name *</label>
              <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Telegram Trading Bot"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="What does this bot do?"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Runtime</label>
              <select value={form.runtime} onChange={e => setForm(p => ({ ...p, runtime: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                {["node", "python", "bun", "deno"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">GitHub Repo URL *</label>
              <input required type="url" value={form.repoUrl} onChange={e => setForm(p => ({ ...p, repoUrl: e.target.value }))}
                placeholder="https://github.com/user/repo"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Branch</label>
              <input type="text" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Coin Cost</label>
              <input type="number" min="0" value={form.coinCost} onChange={e => setForm(p => ({ ...p, coinCost: +e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Install Command</label>
              <input type="text" value={form.installCommand} onChange={e => setForm(p => ({ ...p, installCommand: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Command</label>
              <input type="text" value={form.startCommand} onChange={e => setForm(p => ({ ...p, startCommand: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Preview Image URL (optional)</label>
              <input type="url" value={form.previewImage} onChange={e => setForm(p => ({ ...p, previewImage: e.target.value }))}
                placeholder="https://example.com/preview.png"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Visibility & Status</p>
            {[
              { key: "enabled", label: "Enabled (visible to users)" },
              { key: "featured", label: "Featured (shown in featured section)" },
              { key: "verified", label: "Verified (show verified badge)" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>{bot ? "Save Changes" : "Add Bot to Marketplace"}</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Badge Requests Tab ────────────────────────────────────────────────────────
function BadgeRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [noteModal, setNoteModal] = useState<{ id: string; action: "approve" | "deny" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [acting, setActing] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/badge-requests?status=${filter}`);
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const executeAction = async () => {
    if (!noteModal) return;
    setActing(true);
    try {
      await apiFetch(`/admin/badge-requests/${noteModal.id}/${noteModal.action}`, {
        method: "POST",
        body: JSON.stringify({ adminNote }),
      });
      toast({ title: noteModal.action === "approve" ? "Badge approved! ✅" : "Request denied" });
      setNoteModal(null); setAdminNote(""); load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setActing(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setNoteModal(null); }}>
          <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl p-5 flex flex-col gap-4">
            <h3 className="font-bold flex items-center gap-2">
              {noteModal.action === "approve" ? <CheckSquare className="w-5 h-5 text-green-400" /> : <XSquare className="w-5 h-5 text-destructive" />}
              {noteModal.action === "approve" ? "Approve Badge" : "Deny Request"}
            </h3>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
              placeholder="Admin note (optional — sent to user)..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
            <div className="flex gap-2">
              <Button className={cn("flex-1 border-none text-white", noteModal.action === "approve" ? "bg-green-600 hover:bg-green-500" : "bg-destructive hover:bg-destructive/90")}
                onClick={executeAction} isLoading={acting}>
                {noteModal.action === "approve" ? "Approve & Grant Badge" : "Deny Request"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setNoteModal(null); setAdminNote(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-bold flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-blue-400" /> Verification Badge Requests</h2>
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
          {["pending", "approved", "denied"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors", filter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BadgeCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No {filter} badge requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r: any) => (
            <div key={r.id} className="glass-panel rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-primary/30 border border-border flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(r.username || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.username}</span>
                    {r.emailVerified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0", {
                      "bg-yellow-500/10 border-yellow-500/30 text-yellow-400": r.status === "pending",
                      "bg-green-500/10 border-green-500/30 text-green-400": r.status === "approved",
                      "bg-red-500/10 border-red-500/30 text-red-400": r.status === "denied",
                    })}>{r.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-words">{r.reason}</p>
                  {r.adminNote && <p className="text-xs text-primary/70 mt-1 italic">Note: {r.adminNote}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{ago(r.createdAt)}
                    <span className="text-muted-foreground/50">·</span>
                    {(r.coins || 0).toLocaleString()} coins
                  </p>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 sm:flex-col sm:w-auto w-full">
                  <Button size="sm" className="flex-1 sm:flex-none gap-1 bg-green-600 hover:bg-green-500 border-none text-white text-xs"
                    onClick={() => setNoteModal({ id: r.id, action: "approve" })}>
                    <CheckSquare className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none gap-1 text-destructive hover:bg-destructive/10 text-xs"
                    onClick={() => setNoteModal({ id: r.id, action: "deny" })}>
                    <XSquare className="w-3.5 h-3.5" /> Deny
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bots Management Tab ───────────────────────────────────────────────────────
function BotsTab() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBot, setShowAddBot] = useState(false);
  const [editBot, setEditBot] = useState<any>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/bots");
      setBots(Array.isArray(data) ? data : []);
    } catch { setBots([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteBot = async (id: string, name: string) => {
    if (!confirm(`Delete bot "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/bots/${id}`, { method: "DELETE" });
      toast({ title: "Bot deleted" }); load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleField = async (id: string, field: string, value: boolean) => {
    try {
      await apiFetch(`/admin/bots/${id}`, { method: "PUT", body: JSON.stringify({ [field]: value }) });
      toast({ title: "Updated!" }); load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const filtered = bots.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      {(showAddBot || editBot) && <BotModal bot={editBot} onClose={() => { setShowAddBot(false); setEditBot(null); }} onRefresh={load} />}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Search bots..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowAddBot(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Bot
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{search ? "No bots match your search." : "No bots yet. Add the first one!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b: any) => (
            <div key={b.id} className={cn("glass-panel rounded-2xl border p-4 flex flex-col gap-3", b.enabled ? "border-border" : "border-border/40 opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">{b.name}</h3>
                    {b.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                    {b.featured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    {!b.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground font-bold">HIDDEN</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">{b.category}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{b.runtime}</span>
                    {b.coinCost > 0 && <span className="text-[10px] text-yellow-400 font-mono">{b.coinCost} coins</span>}
                    <span className="text-[10px] text-muted-foreground">{b.deployCount || 0} deploys</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditBot(b)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteBot(b.id, b.name)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 border-t border-border/50 pt-2">
                <button onClick={() => toggleField(b.id, "enabled", !b.enabled)}
                  className={cn("flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-colors", b.enabled ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-muted-foreground bg-secondary hover:bg-secondary/80")}>
                  {b.enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {b.enabled ? "Enabled" : "Disabled"}
                </button>
                <button onClick={() => toggleField(b.id, "featured", !b.featured)}
                  className={cn("flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-colors", b.featured ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20" : "text-muted-foreground bg-secondary hover:bg-secondary/80")}>
                  <Star className="w-3.5 h-3.5" />{b.featured ? "Featured" : "Not Featured"}
                </button>
                <button onClick={() => toggleField(b.id, "verified", !b.verified)}
                  className={cn("flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-colors", b.verified ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "text-muted-foreground bg-secondary hover:bg-secondary/80")}>
                  <BadgeCheck className="w-3.5 h-3.5" />{b.verified ? "Verified" : "Unverified"}
                </button>
              </div>
              {b.repoUrl && (
                <a href={b.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />{b.repoUrl}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Announcement Modal ────────────────────────────────────────────────────────
function AnnouncementModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const createMut = useAdminCreateAnnouncement();
  const [form, setForm] = useState({ title: "", body: "", type: "info", pinned: false });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: form }, {
      onSuccess: () => { toast({ title: "Announcement published!" }); onRefresh(); onClose(); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">New Announcement</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
            <textarea required rows={4} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                {["info", "warning", "success", "danger"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} />
                Pin to top
              </label>
            </div>
          </div>
          <Button type="submit" className="w-full" isLoading={createMut.isPending}>Publish Announcement</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Broadcast Modal ───────────────────────────────────────────────────────────
const NOTIF_TEMPLATES = [
  { label: "🔧 Maintenance", title: "Scheduled Maintenance", message: "We'll be performing scheduled maintenance. Expect brief downtime. Thank you for your patience!", type: "warning" },
  { label: "🚀 New Feature", title: "New Feature Released!", message: "We just shipped something awesome. Check it out now and let us know what you think!", type: "success" },
  { label: "🎁 Free Coins", title: "You've Got Free Coins!", message: "As a thank you for being part of BeraPanel, we've added bonus coins to your account. Enjoy!", type: "success" },
  { label: "⚠️ Downtime", title: "Service Disruption", message: "We're experiencing an issue and our team is working on it. We'll update you as soon as it's resolved.", type: "error" },
  { label: "💰 Promo", title: "Limited-Time Offer!", message: "Get double coins on your next purchase for the next 24 hours. Don't miss out!", type: "info" },
  { label: "👋 Welcome", title: "Welcome to BeraPanel!", message: "Thanks for joining! Deploy your first project in minutes and explore the marketplace.", type: "info" },
];

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", message: "", type: "info", target: "all" });
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const applyTemplate = (t: typeof NOTIF_TEMPLATES[0]) => {
    setForm(p => ({ ...p, title: t.title, message: t.message, type: t.type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiFetch("/admin/notifications/targeted", { method: "POST", body: JSON.stringify(form) });
      toast({ title: `✅ Sent to ${res.sent} user${res.sent !== 1 ? "s" : ""}!`, description: form.title });
      onClose();
    } catch (err: any) {
      toast({ title: "Error sending", description: err.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Send Notification</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Quick Templates</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTIF_TEMPLATES.map(t => (
                <button key={t.label} onClick={() => applyTemplate(t)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-secondary border border-border hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Target */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Send To</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "all", label: "All Users", icon: "👥" },
                  { value: "premium", label: "Premium (>500 coins)", icon: "💎" },
                  { value: "new", label: "New (last 7 days)", icon: "🌱" },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, target: opt.value }))}
                    className={`text-center p-2 rounded-lg border text-xs font-medium transition-all ${form.target === opt.value ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-border/80"}`}>
                    <div>{opt.icon}</div>
                    <div className="text-[10px] mt-0.5">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <div className="flex gap-2">
                {[
                  { v: "info", label: "ℹ️ Info", cls: "text-blue-400 border-blue-400/30 bg-blue-500/10" },
                  { v: "success", label: "✅ Success", cls: "text-green-400 border-green-400/30 bg-green-500/10" },
                  { v: "warning", label: "⚠️ Warning", cls: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10" },
                  { v: "error", label: "🚨 Alert", cls: "text-red-400 border-red-400/30 bg-red-500/10" },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setForm(p => ({ ...p, type: opt.v }))}
                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${form.type === opt.v ? opt.cls : "border-border bg-secondary text-muted-foreground"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
              <textarea required rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your message..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>

            {/* Preview */}
            {preview && form.title && (
              <div className={`rounded-xl border p-3 text-sm ${form.type === "success" ? "border-green-500/30 bg-green-500/5" : form.type === "warning" ? "border-yellow-500/30 bg-yellow-500/5" : form.type === "error" ? "border-red-500/30 bg-red-500/5" : "border-blue-500/30 bg-blue-500/5"}`}>
                <p className="font-bold text-xs mb-0.5">Preview</p>
                <p className="font-semibold text-sm">{form.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{form.message}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setPreview(p => !p)}
                className="px-3 py-2 rounded-lg border border-border bg-secondary text-xs hover:bg-secondary/80 transition-colors">
                {preview ? "Hide" : "Preview"}
              </button>
              <Button type="submit" isLoading={sending} className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent border-none text-white">
                <Bell className="w-4 h-4" /> Send to {form.target === "all" ? "All Users" : form.target === "premium" ? "Premium Users" : "New Users"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Detail Modal ───────────────────────────────────────────────────────
function TicketDetailModal({ ticket, onClose, onRefresh }: { ticket: any; onClose: () => void; onRefresh: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch(`/admin/support/tickets/${ticket.id}/messages`).then(d => { setMessages(d.messages || []); setLoading(false); }).catch(() => setLoading(false));
  }, [ticket.id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await apiFetch(`/admin/support/tickets/${ticket.id}/messages`, { method: "POST", body: JSON.stringify({ message: reply }) });
      setReply(""); toast({ title: "Reply sent" });
      const d = await apiFetch(`/admin/support/tickets/${ticket.id}/messages`);
      setMessages(d.messages || []);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const updateStatus = async (status: string) => {
    try {
      await apiFetch(`/admin/support/tickets/${ticket.id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      toast({ title: `Ticket marked as ${status}` }); onRefresh(); onClose();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold">{ticket.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
              <span className="text-xs capitalize text-muted-foreground">• {ticket.priority} priority</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", {
                "bg-yellow-500/10 border-yellow-500/30 text-yellow-400": ticket.status === "open",
                "bg-blue-500/10 border-blue-500/30 text-blue-400": ticket.status === "in_progress",
                "bg-green-500/10 border-green-500/30 text-green-400": ticket.status === "resolved",
              })}>{ticket.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select onChange={e => updateStatus(e.target.value)} value={ticket.status}
              className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none">
              {["open", "in_progress", "resolved", "closed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? <div className="animate-pulse text-center text-muted-foreground py-8">Loading messages...</div> :
            messages.length === 0 ? <div className="text-center text-muted-foreground py-8 text-sm">No messages yet.</div> :
              messages.map((m: any) => (
                <div key={m.id} className={cn("flex gap-3", m.isAdmin && "flex-row-reverse")}>
                  <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border", m.isAdmin ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border")}>
                    {m.isAdmin ? "A" : "U"}
                  </div>
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", m.isAdmin ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border")}>
                    <p>{m.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{ago(m.createdAt)}</p>
                  </div>
                </div>
              ))
          }
        </div>

        <form onSubmit={sendReply} className="p-5 border-t border-border flex gap-3 flex-shrink-0">
          <input
            value={reply} onChange={e => setReply(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button type="submit" className="gap-2 px-4"><Send className="w-4 h-4" /> Send</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Promo Code Modal ──────────────────────────────────────────────────────────
function PromoModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState({ code: "", coins: 100, maxUses: 10, description: "", expiresAt: "" });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/admin/promo", { method: "POST", body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined }) });
      toast({ title: "Promo code created!" }); onRefresh(); onClose();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">Create Promo Code</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {[
            { label: "Code (e.g. BERA2026)", key: "code", type: "text" },
            { label: "Coins Reward", key: "coins", type: "number" },
            { label: "Max Uses", key: "maxUses", type: "number" },
            { label: "Description", key: "description", type: "text" },
            { label: "Expires At (optional)", key: "expiresAt", type: "datetime-local" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
              <input required={key !== "expiresAt" && key !== "description"} type={type} value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: type === "number" ? +e.target.value : e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
            </div>
          ))}
          <Button type="submit" className="w-full">Create Promo Code</Button>
        </form>
      </div>
    </div>
  );
}

// ─── Platform Settings Tab ─────────────────────────────────────────────────────
type PlatformSection = "general" | "limits" | "economy" | "integrations" | "security" | "emergency";

function PlatformTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [section, setSection] = useState<PlatformSection>("general");
  const { toast } = useToast();

  useEffect(() => {
    apiFetch("/admin/platform").then(d => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k: string, v: any) => setSettings((p: any) => ({ ...p, [k]: v }));

  const save = async (label: string) => {
    setSaving(label);
    try {
      await apiFetch("/admin/platform", { method: "PUT", body: JSON.stringify(settings) });
      toast({ title: `✅ ${label} saved!` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(null);
  };

  if (loading) return <div className="animate-pulse text-center text-muted-foreground py-20">Loading platform config...</div>;
  if (!settings) return null;

  const sections: { id: PlatformSection; label: string; icon: string }[] = [
    { id: "general", label: "General", icon: "🌐" },
    { id: "integrations", label: "Integrations", icon: "🔌" },
    { id: "limits", label: "Limits", icon: "📊" },
    { id: "economy", label: "Economy", icon: "💰" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "emergency", label: "Emergency", icon: "🚨" },
  ];

  const Field = ({ label, k, type = "text", placeholder = "", secret = false }: { label: string; k: string; type?: string; placeholder?: string; secret?: boolean }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input type={secret ? "password" : type} value={settings[k] ?? ""} onChange={e => set(k, type === "number" ? +e.target.value : e.target.value)}
        placeholder={placeholder} autoComplete="off"
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );

  const Toggle = ({ label, k, desc }: { label: string; k: string; desc?: string }) => (
    <label className="flex items-center justify-between cursor-pointer py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className={cn("w-11 h-6 rounded-full transition-colors relative flex-shrink-0", settings[k] ? "bg-primary" : "bg-secondary border border-border")}
        onClick={() => set(k, !settings[k])}>
        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm", settings[k] ? "translate-x-6" : "translate-x-1")} />
      </div>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all", section === s.id ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === "general" && (
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> General Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Platform Name" k="platformName" placeholder="BeraPanel" />
            <Field label="Support Email" k="supportEmail" placeholder="support@yourdomain.com" />
            <Field label="Logo URL" k="logoUrl" placeholder="https://..." />
            <Field label="Favicon URL" k="faviconUrl" placeholder="https://..." />
            <Field label="Maintenance Message" k="maintenanceMessage" placeholder="We'll be back soon!" />
          </div>
          <div className="divide-y divide-border/40">
            <Toggle label="Maintenance Mode" k="maintenanceMode" desc="Shows maintenance page to all non-admin users" />
            <Toggle label="Registration Open" k="registrationOpen" desc="Allow new users to register" />
            <Toggle label="Require Email Verification" k="requireEmailVerification" desc="New users must verify their email before accessing the platform" />
          </div>
          <Button onClick={() => save("General Settings")} isLoading={saving === "General Settings"} className="w-full gap-2">
            <Save className="w-4 h-4" /> Save General Settings
          </Button>
        </div>
      )}

      {section === "integrations" && (
        <div className="space-y-4">
          {/* Telegram */}
          <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-blue-400">
              <span className="text-lg">✈️</span> Telegram Bot
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Bot Token" k="telegramBotToken" placeholder="123456789:AAF..." secret />
              <Field label="Bot Username" k="telegramBotUsername" placeholder="@YourBotName" />
              <Field label="Admin Chat ID" k="telegramAdminChatId" placeholder="Your personal chat ID for alerts" />
            </div>
            <div className="divide-y divide-border/40">
              <Toggle label="Notify on Deployments" k="telegramNotifyDeploys" desc="Send Telegram message when users deploy projects" />
              <Toggle label="Notify on New Signups" k="telegramNotifySignups" desc="Get notified when new users register" />
              <Toggle label="Notify on Payments" k="telegramNotifyPayments" desc="Get notified when users purchase coins" />
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 space-y-1">
              <p className="font-semibold">Setup: Create a bot via @BotFather → copy the token above → get your chat ID from @userinfobot</p>
            </div>
            <Button onClick={() => save("Telegram Config")} isLoading={saving === "Telegram Config"} className="gap-2 bg-blue-600 hover:bg-blue-500 border-none text-white">
              Save Telegram Config
            </Button>
          </div>

          {/* Discord */}
          <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-indigo-400">
              <span className="text-lg">🎮</span> Discord Webhook
            </h3>
            <Field label="Webhook URL" k="discordWebhookUrl" placeholder="https://discord.com/api/webhooks/..." />
            <div className="divide-y divide-border/40">
              <Toggle label="Notify on Deployments" k="discordNotifyDeploys" />
              <Toggle label="Notify on Signups" k="discordNotifySignups" />
            </div>
            <Button onClick={() => save("Discord Config")} isLoading={saving === "Discord Config"} className="gap-2 bg-indigo-600 hover:bg-indigo-500 border-none text-white">
              Save Discord Config
            </Button>
          </div>

          {/* SMTP */}
          <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-yellow-400">
              <span className="text-lg">📧</span> Email / SMTP
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SMTP Host" k="smtpHost" placeholder="smtp.gmail.com" />
              <Field label="SMTP Port" k="smtpPort" type="number" placeholder="587" />
              <Field label="SMTP Username" k="smtpUser" placeholder="you@gmail.com" />
              <Field label="SMTP Password" k="smtpPass" placeholder="App password" secret />
              <Field label="From Address" k="smtpFrom" placeholder="noreply@yourdomain.com" />
            </div>
            <Toggle label="Use SSL/TLS" k="smtpSsl" desc="Enable for port 465, leave off for 587 (STARTTLS)" />
            <Button onClick={() => save("SMTP Config")} isLoading={saving === "SMTP Config"} className="gap-2 bg-yellow-600 hover:bg-yellow-500 border-none text-white">
              Save SMTP Config
            </Button>
          </div>

          {/* GitHub */}
          <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><GitBranch className="w-4 h-4 text-foreground" /> GitHub Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="GitHub App ID" k="githubAppId" placeholder="12345" />
              <Field label="Webhook Secret" k="githubWebhookSecret" placeholder="Shared webhook secret" secret />
            </div>
            <Button onClick={() => save("GitHub Config")} isLoading={saving === "GitHub Config"} variant="outline" className="gap-2">
              Save GitHub Config
            </Button>
          </div>

          {/* PayHero */}
          <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-green-400">
              <span className="text-lg">💳</span> PayHero (M-Pesa)
            </h3>
            <Field label="PayHero Channel ID" k="payheroChannelId" placeholder="3762" />
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-xs text-green-300">
              <p>PayHero Auth key is stored as a server secret (PAYHERO_AUTH environment variable). Only update Channel ID here.</p>
            </div>
            <Button onClick={() => save("PayHero Config")} isLoading={saving === "PayHero Config"} className="gap-2 bg-green-600 hover:bg-green-500 border-none text-white">
              Save PayHero Config
            </Button>
          </div>
        </div>
      )}

      {section === "limits" && (
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Server className="w-4 h-4 text-accent" /> Resource Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Max Projects (Free)" k="maxProjectsFree" type="number" />
            <Field label="Max Projects (Pro)" k="maxProjectsPro" type="number" />
            <Field label="Max Domains Per Project" k="maxDomainsPerProject" type="number" />
            <Field label="Max Team Members Per Project" k="maxTeamMembersPerProject" type="number" />
            <Field label="Max Log Lines Shown" k="maxLogLines" type="number" />
          </div>
          <Button onClick={() => save("Limits")} isLoading={saving === "Limits"} className="w-full gap-2">
            <Save className="w-4 h-4" /> Save Limits
          </Button>
        </div>
      )}

      {section === "economy" && (
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-400" /> Economy Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Default Coins on Signup" k="defaultCoinsOnSignup" type="number" />
            <Field label="Coin Value (KSH)" k="coinValueKsh" type="number" />
            <Field label="Referral Bonus (coins)" k="referralBonus" type="number" />
          </div>
          <div className="divide-y divide-border/40">
            <Toggle label="Enable Payments" k="enablePayments" desc="Allow users to buy coins via M-Pesa" />
            <Toggle label="Enable Referrals" k="enableReferrals" desc="Users can earn coins by inviting friends" />
            <Toggle label="Enable Airdrops" k="enableAirdrops" desc="Allow admins to create and users to claim airdrops" />
            <Toggle label="Enable Bot Marketplace" k="enableBotMarket" desc="Show the bot marketplace to users" />
          </div>
          <Button onClick={() => save("Economy")} isLoading={saving === "Economy"} className="w-full gap-2 bg-gradient-to-r from-yellow-600 to-orange-500 border-none text-white">
            <Coins className="w-4 h-4" /> Save Economy Settings
          </Button>
        </div>
      )}

      {section === "security" && (
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-green-400" /> Security Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="JWT Expires In" k="jwtExpiresIn" placeholder="7d" />
            <Field label="Max Login Attempts" k="maxLoginAttempts" type="number" />
            <Field label="Session Timeout (minutes)" k="sessionTimeoutMinutes" type="number" />
            <Field label="Allowed IP Whitelist (comma-separated)" k="allowedIpWhitelist" placeholder="Leave blank to allow all" />
          </div>
          <Toggle label="Enable Two-Factor Auth (2FA)" k="enableTwoFactor" desc="Require TOTP 2FA for admin accounts" />
          <Button onClick={() => save("Security")} isLoading={saving === "Security"} className="w-full gap-2 bg-green-600 hover:bg-green-500 border-none text-white">
            <Shield className="w-4 h-4" /> Save Security Settings
          </Button>
        </div>
      )}

      {section === "emergency" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-red-400"><AlertOctagon className="w-4 h-4" /> Emergency Controls</h3>
            <p className="text-sm text-muted-foreground">These actions are immediate and affect all users. Use with caution.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "🛑 Stop All Projects", desc: "Immediately stop every running project", action: async () => { if (!confirm("Stop ALL projects?")) return; await apiFetch("/admin/emergency/stop-all", { method: "POST" }); toast({ title: "All projects stopped" }); }, danger: true },
                { label: "🔄 Restart All Projects", desc: "Restart every running project", action: async () => { if (!confirm("Restart ALL projects?")) return; await apiFetch("/admin/emergency/restart-all", { method: "POST" }); toast({ title: "Restarting all projects..." }); }, danger: false },
                { label: "🔒 Lock Platform", desc: "Enable maintenance mode instantly", action: async () => { set("maintenanceMode", true); await apiFetch("/admin/platform", { method: "PUT", body: JSON.stringify({ ...settings, maintenanceMode: true }) }); toast({ title: "Platform locked — maintenance mode ON" }); }, danger: true },
                { label: "🔓 Unlock Platform", desc: "Disable maintenance mode", action: async () => { set("maintenanceMode", false); await apiFetch("/admin/platform", { method: "PUT", body: JSON.stringify({ ...settings, maintenanceMode: false }) }); toast({ title: "Platform unlocked" }); }, danger: false },
              ].map(({ label, desc, action, danger }) => (
                <button key={label} onClick={action}
                  className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${danger ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : "border-border bg-secondary hover:bg-secondary/80"}`}>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/analytics").then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-center text-muted-foreground py-12">Loading analytics...</div>;
  if (!data) return <div className="text-center text-muted-foreground py-12">No analytics data available.</div>;

  const chartStyle = { backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Signups (30d)", value: data.totalSignups30d || 0, color: "text-blue-400" },
          { label: "Total Deploys (30d)", value: data.totalDeploys30d || 0, color: "text-green-400" },
          { label: "Active Users (7d)", value: data.activeUsers7d || 0, color: "text-purple-400" },
          { label: "Avg Revenue/Day", value: `KSH ${(data.avgRevenuePerDay || 0).toFixed(0)}`, color: "text-yellow-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel rounded-2xl p-4 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {data.signupsByDay && (
        <div className="glass-panel rounded-2xl border border-border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Signups (Last 30 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.signupsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="count" name="Signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.deploysByDay && (
        <div className="glass-panel rounded-2xl border border-border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-accent" /> Deploys (Last 30 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.deploysByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <Line type="monotone" dataKey="count" name="Deploys" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ─────────────────────────────────────────────────────────────
function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/audit?limit=100").then(d => { setLogs(d.logs || d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-center text-muted-foreground py-12">Loading audit log...</div>;

  return (
    <div className="glass-panel rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Audit Log — {logs.length} entries</span>
      </div>
      <div className="max-h-[600px] overflow-y-auto divide-y divide-border/50">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No audit entries yet.</div>
        ) : logs.map((log: any, i: number) => (
          <div key={i} className="px-4 py-3 hover:bg-secondary/30 flex items-start gap-3 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {log.actorUsername?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{log.actorUsername || "System"}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">{log.action}</span>
                {log.targetType && <span className="text-xs text-muted-foreground">on {log.targetType}</span>}
              </div>
              {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</p>}
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-1">{ago(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Economy Tab ───────────────────────────────────────────────────────────────
function EconomyTab() {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [ov, tx, pr] = await Promise.all([
        apiFetch("/admin/economy/overview"),
        apiFetch("/admin/transactions?limit=50"),
        apiFetch("/admin/promo"),
      ]);
      setOverview(ov); setTransactions(tx.transactions || tx || []); setPromos(pr.codes || pr || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deletePromo = async (code: string) => {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    try { await apiFetch(`/admin/promo/${code}`, { method: "DELETE" }); toast({ title: "Promo deleted" }); load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const bulkCoins = async () => {
    const amt = prompt("Coins to give ALL users:");
    const reason = prompt("Reason:");
    if (!amt || !reason) return;
    try { await apiFetch("/admin/coins/bulk", { method: "POST", body: JSON.stringify({ amount: +amt, reason }) }); toast({ title: `+${amt} coins sent to all users!` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="animate-pulse text-center text-muted-foreground py-12">Loading economy data...</div>;

  return (
    <div className="flex flex-col gap-6">
      {showPromoModal && <PromoModal onClose={() => setShowPromoModal(false)} onRefresh={load} />}

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Coins in Circulation", value: (overview.totalCoins || 0).toLocaleString(), color: "text-yellow-400" },
            { label: "Total Revenue (KSH)", value: `KSH ${(overview.totalRevenue || 0).toLocaleString()}`, color: "text-green-400" },
            { label: "Coins Spent", value: (overview.totalSpent || 0).toLocaleString(), color: "text-red-400" },
            { label: "Coins Given Out", value: (overview.totalGiven || 0).toLocaleString(), color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-panel rounded-2xl p-4 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={bulkCoins} variant="outline" className="gap-2"><Coins className="w-4 h-4" /> Bulk Gift Coins</Button>
        <Button onClick={() => setShowPromoModal(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white"><Plus className="w-4 h-4" /> New Promo Code</Button>
      </div>

      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Promo Codes ({promos.length})</span>
        </div>
        <table className="w-full text-left">
          <thead><tr className="border-b border-border">{["Code", "Coins", "Uses", "Max", "Expires", ""].map(h => <th key={h} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border/50">
            {promos.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No promo codes yet.</td></tr>
            ) : promos.map((p: any) => (
              <tr key={p.code} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-mono font-bold text-accent text-sm">{p.code}</td>
                <td className="px-4 py-3 text-yellow-400 font-mono font-bold">{p.coins}</td>
                <td className="px-4 py-3 text-sm">{p.usedCount || 0}</td>
                <td className="px-4 py-3 text-sm">{p.maxUses || "∞"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "Never"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deletePromo(p.code)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Recent Transactions ({transactions.length})</span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-card"><tr className="border-b border-border">{["User", "Type", "Amount", "Description", "Date"].map(h => <th key={h} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/50">
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No transactions yet.</td></tr>
              ) : transactions.map((tx: any, i: number) => (
                <tr key={i} className="hover:bg-secondary/30">
                  <td className="px-4 py-2 text-sm font-medium">{tx.username || tx.userId?.slice(0, 8) || "—"}</td>
                  <td className="px-4 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary border border-border">{tx.type || "—"}</span></td>
                  <td className={cn("px-4 py-2 font-mono font-bold text-sm", (tx.coins || 0) > 0 ? "text-green-400" : "text-red-400")}>
                    {(tx.coins || 0) > 0 ? "+" : ""}{tx.coins}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{tx.description}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{ago(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Projects Tab ────────────────────────────────────────────────────────
function AdminProjectsTab() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = () => {
    apiFetch("/admin/projects?limit=100").then(d => { setProjects(d.projects || d || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const forceStop = async (id: string, name: string) => {
    if (!confirm(`Force stop "${name}"?`)) return;
    try { await apiFetch(`/admin/projects/${id}/force-stop`, { method: "POST" }); toast({ title: `${name} stopped` }); load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"?`)) return;
    try { await apiFetch(`/admin/projects/${id}`, { method: "DELETE" }); toast({ title: `${name} deleted` }); load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="animate-pulse text-center text-muted-foreground py-12">Loading projects...</div>;

  return (
    <div className="glass-panel rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
        <Server className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">All Projects ({projects.length})</span>
      </div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-card"><tr className="border-b border-border">{["Project", "Owner", "Runtime", "Status", "Port", "Actions"].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border/50">
            {projects.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No projects yet.</td></tr>
            ) : projects.map((p: any) => (
              <tr key={p.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{p.userId?.slice(0, 8)}…</td>
                <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded bg-secondary border border-border font-mono">{p.runtime}</span></td>
                <td className="px-4 py-3">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", {
                    "bg-green-500/10 border-green-500/30 text-green-400": p.status === "running",
                    "bg-yellow-500/10 border-yellow-500/30 text-yellow-400": p.status === "building",
                    "bg-red-500/10 border-red-500/30 text-red-400": p.status === "error",
                    "bg-secondary border-border text-muted-foreground": p.status === "stopped" || p.status === "sleeping",
                  })}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{p.port || "—"}</td>
                <td className="px-4 py-3 flex items-center gap-1">
                  {p.liveUrl && (
                    <a href={p.liveUrl} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {p.status === "running" && (
                    <button onClick={() => forceStop(p.id, p.name)} className="p-1.5 text-muted-foreground hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors" title="Force stop">
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteProject(p.id, p.name)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
type AdminTab = "overview" | "users" | "projects" | "bots" | "badge-requests" | "packages" | "airdrops" | "announcements" | "tickets" | "economy" | "analytics" | "audit" | "platform" | "feature-flags" | "health" | "referrals" | "superadmin";

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [showNewPkg, setShowNewPkg] = useState(false);
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();

  const { data: stats, refetch: refetchStats } = useGetAdminDashboard();
  const { data: sysInfo } = useGetSystemInfo();
  const { data: usersObj, isLoading: usersLoading, refetch: refetchUsers } = useAdminListUsers({ q: userSearch });
  const { data: packages, refetch: refetchPkgs } = useAdminListCoinPackages();
  const { data: airdrops, refetch: refetchAirdrops } = useAdminListAirdrops();
  const { data: announcements, refetch: refetchAnnouncements } = useAdminListAnnouncements();
  const { data: tickets, refetch: refetchTickets } = useAdminListTickets();

  const delPkgMut = useAdminDeleteCoinPackage();

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "projects", label: "Projects", icon: Server },
    { id: "bots", label: "Bots", icon: Bot },
    { id: "badge-requests", label: "Badges", icon: BadgeCheck },
    { id: "economy", label: "Economy", icon: DollarSign },
    { id: "packages", label: "Packages", icon: Package },
    { id: "airdrops", label: "Airdrops", icon: Gift },
    { id: "announcements", label: "Posts", icon: Megaphone },
    { id: "tickets", label: "Support", icon: LifeBuoy },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "audit", label: "Audit", icon: ClipboardList },
    { id: "platform", label: "Platform", icon: Settings },
    { id: "feature-flags", label: "Features", icon: Zap },
    { id: "health", label: "Health", icon: Cpu },
    { id: "referrals", label: "Referrals", icon: Users },
    { id: "superadmin", label: "⚡ Superadmin", icon: Crown },
  ];

  return (
    <div className="flex flex-col gap-6">
      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onRefresh={() => { refetchUsers(); refetchStats(); }} />}
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onRefresh={refetchTickets} />}
      {(showNewPkg || editPkg) && <PackageModal pkg={editPkg} onClose={() => { setShowNewPkg(false); setEditPkg(null); }} onRefresh={refetchPkgs} />}
      {showAirdropModal && <AirdropModal onClose={() => setShowAirdropModal(false)} onRefresh={refetchAirdrops} />}
      {showAnnouncementModal && <AnnouncementModal onClose={() => setShowAnnouncementModal(false)} onRefresh={refetchAnnouncements} />}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-accent" /> Admin Control Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users, economy, and platform settings.</p>
        </div>
        <Button onClick={() => setShowBroadcast(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white">
          <Bell className="w-4 h-4" /> Broadcast
        </Button>
      </div>

      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all", tab === t.id ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="text-primary" bg="bg-primary/10" border="border-primary/20" />
            <StatCard icon={Server} label="Running Projects" value={stats?.runningProjects || 0} color="text-green-400" bg="bg-green-500/10" border="border-green-500/20" />
            <StatCard icon={DollarSign} label="Revenue (KSH)" value={`KSH ${(stats?.totalRevenue || 0).toLocaleString()}`} color="text-yellow-400" bg="bg-yellow-500/10" border="border-yellow-500/20" />
            <StatCard icon={Coins} label="Coins in Circulation" value={(stats?.coinsInCirculation || 0).toLocaleString()} color="text-accent" bg="bg-accent/10" border="border-accent/20" />
            <StatCard icon={TrendingUp} label="Today Signups" value={stats?.todaySignups || 0} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
            <StatCard icon={Zap} label="Today Deploys" value={stats?.todayDeploys || 0} color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" />
            <StatCard icon={LifeBuoy} label="Open Tickets" value={stats?.activeTickets || 0} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
            <StatCard icon={Cpu} label="CPU Usage" value={`${Math.round(sysInfo?.cpuPercent || 0)}%`} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" />
          </div>

          {sysInfo && (
            <div className="glass-panel rounded-2xl border border-border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-accent" /> System Resources</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Memory", used: sysInfo.memoryMb, total: sysInfo.memoryTotalMb, unit: "MB", color: "bg-blue-500" },
                  { label: "Disk", used: sysInfo.diskGb, total: sysInfo.diskTotalGb, unit: "GB", color: "bg-purple-500" },
                  { label: "CPU", used: Math.round(sysInfo.cpuPercent), total: 100, unit: "%", color: "bg-red-500" },
                ].map(({ label, used, total, unit, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{label}</span><span>{used}/{total} {unit}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, (used / total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Users Tab ── */}
      {tab === "users" && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div className="glass-panel rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-border bg-secondary/30">{["User", "Role", "Coins", "Status", "Joined", "Actions"].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border/50">
                  {usersLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-secondary rounded animate-pulse w-full" /></td></tr>) :
                    (usersObj?.users || []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {u.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{u.username}</span>
                                {u.emailVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                              </div>
                              {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-4 py-3 font-mono text-yellow-400 text-sm">{(u.coins || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {u.banned ? <span className="text-xs text-destructive flex items-center gap-1"><Ban className="w-3 h-3" /> Banned</span>
                            : <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{ago(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedUser(u)}>
                            <Edit className="w-3 h-3 mr-1" /> Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {usersObj && <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">Showing {usersObj.users?.length} of {usersObj.total} users</div>}
          </div>
        </div>
      )}

      {tab === "projects" && <AdminProjectsTab />}
      {tab === "bots" && <BotsTab />}
      {tab === "badge-requests" && <BadgeRequestsTab />}
      {tab === "economy" && <EconomyTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "platform" && <PlatformTab />}

      {/* ── Coin Packages Tab ── */}
      {tab === "packages" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewPkg(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white"><Plus className="w-4 h-4" /> New Package</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(packages as any[] || []).map((pkg: any) => (
              <div key={pkg.id} className={cn("glass-panel rounded-2xl border p-5 flex flex-col gap-3", pkg.enabled ? "border-border" : "border-border/40 opacity-60")}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{pkg.name}</h3>
                      {pkg.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">{pkg.badge}</span>}
                      {!pkg.enabled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">Hidden</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditPkg(pkg)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (!confirm(`Delete "${pkg.name}"?`)) return; delPkgMut.mutate({ pkgId: pkg.id }, { onSuccess: () => { toast({ title: "Package deleted" }); refetchPkgs(); } }); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-mono font-bold text-yellow-400">{(pkg.coins || 0).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground ml-1">coins</span>
                    {pkg.bonusCoins > 0 && <p className="text-xs text-green-400">+{pkg.bonusCoins} bonus</p>}
                  </div>
                  <span className="font-bold text-lg text-foreground">KSH {pkg.priceKsh}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Airdrops Tab ── */}
      {tab === "airdrops" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAirdropModal(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white"><Plus className="w-4 h-4" /> New Airdrop</Button>
          </div>
          <div className="glass-panel rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="border-b border-border bg-secondary/30">{["Title", "Coins", "Claims", "Created", ""].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border/50">
                {(airdrops as any[] || []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3"><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.description}</p></td>
                    <td className="px-4 py-3 font-mono text-yellow-400 font-bold">{a.coins}</td>
                    <td className="px-4 py-3 text-sm">{a.claimCount || 0}{a.maxClaims ? `/${a.maxClaims}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ago(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => { if (!confirm("Delete this airdrop?")) return; try { await apiFetch(`/admin/airdrops/${a.id}`, { method: "DELETE" }); refetchAirdrops(); } catch { toast({ title: "Error", variant: "destructive" }); } }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Announcements Tab ── */}
      {tab === "announcements" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAnnouncementModal(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white"><Plus className="w-4 h-4" /> New Announcement</Button>
          </div>
          <div className="flex flex-col gap-3">
            {(announcements as any[] || []).map((a: any) => (
              <div key={a.id} className={cn("glass-panel rounded-xl border p-4 flex gap-3", {
                "border-blue-500/30 bg-blue-500/5": a.type === "info",
                "border-yellow-500/30 bg-yellow-500/5": a.type === "warning",
                "border-green-500/30 bg-green-500/5": a.type === "success",
                "border-red-500/30 bg-red-500/5": a.type === "danger",
              })}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{a.title}</span>
                    {a.pinned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">PINNED</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.body || a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{ago(a.createdAt)}</p>
                </div>
                <button onClick={async () => { try { await apiFetch(`/admin/announcements/${a.id}`, { method: "DELETE" }); refetchAnnouncements(); } catch { toast({ title: "Error", variant: "destructive" }); } }}
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {(!announcements || (announcements as any[]).length === 0) && (
              <div className="text-center py-10 text-muted-foreground text-sm">No announcements yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Support Tickets Tab ── */}
      {tab === "tickets" && (
        <div className="glass-panel rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border bg-secondary/30">{["Subject", "User", "Status", "Priority", "Created", ""].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/50">
              {(tickets as any[] || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                  <td className="px-4 py-3 font-medium text-sm max-w-[200px] truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.userId?.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", {
                      "bg-yellow-500/10 border-yellow-500/30 text-yellow-400": t.status === "open",
                      "bg-blue-500/10 border-blue-500/30 text-blue-400": t.status === "in_progress",
                      "bg-green-500/10 border-green-500/30 text-green-400": t.status === "resolved",
                      "bg-secondary border-border text-muted-foreground": t.status === "closed",
                    })}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{t.priority}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{ago(t.createdAt)}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
              {(!tickets || (tickets as any[]).length === 0) && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No support tickets yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "feature-flags" && <FeatureFlagsTab />}
      {tab === "health" && <SystemHealthTab />}
      {tab === "referrals" && <ReferralConfigTab />}
      {tab === "superadmin" && <SuperadminTab />}
    </div>
  );
}

// ─── Feature Flags Tab ────────────────────────────────────────────────────────
function FeatureFlagsTab() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch("/admin/feature-flags").then(d => { setFlags(d.flags || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (key: string, enabled: boolean) => {
    await apiFetch(`/admin/feature-flags/${key}`, { method: "PUT", body: JSON.stringify({ enabled }) });
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
    toast({ title: `Feature ${enabled ? "enabled" : "disabled"}`, description: key });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg">Feature Flags</h3>
        <p className="text-sm text-muted-foreground">Toggle platform features on/off without code changes.</p>
      </div>
      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {flags.map(flag => (
            <div key={flag.key} className={`glass-panel rounded-xl border p-4 flex items-center gap-4 transition-all ${flag.enabled ? "border-border" : "border-border/40 opacity-70"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${flag.enabled ? "bg-green-500/10 border border-green-500/30" : "bg-secondary border border-border"}`}>
                <Zap className={`w-5 h-5 ${flag.enabled ? "text-green-400" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{flag.label}</p>
                <p className="text-xs text-muted-foreground truncate">{flag.description}</p>
              </div>
              <button
                onClick={() => toggle(flag.key, !flag.enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${flag.enabled ? "bg-green-500" : "bg-secondary border border-border"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${flag.enabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── System Health Tab ────────────────────────────────────────────────────────
function SystemHealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => apiFetch("/admin/health").then(setHealth).catch(() => {}).finally(() => setLoading(false));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div>;

  const pct = (v: number, max: number) => Math.min(100, Math.round(v / max * 100));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">System Health</h3>
          <p className="text-sm text-muted-foreground">Live server metrics — refreshes every 5 seconds.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CPU Load", value: `${health?.cpu?.load ?? 0}%`, sub: `${health?.cpu?.cores ?? 1} cores`, color: "text-red-400", bg: "bg-red-500/10", pct: parseFloat(health?.cpu?.load ?? 0) },
          { label: "Memory", value: `${health?.memory?.used ?? 0} MB`, sub: `of ${health?.memory?.total ?? 0} MB`, color: "text-blue-400", bg: "bg-blue-500/10", pct: health?.memory?.percent ?? 0 },
          { label: "Disk", value: `${health?.disk?.used ?? 0} GB`, sub: `of ${health?.disk?.total ?? 0} GB`, color: "text-yellow-400", bg: "bg-yellow-500/10", pct: health?.disk?.percent ?? 0 },
          { label: "Uptime", value: `${Math.floor((health?.uptime ?? 0) / 3600)}h`, sub: `${Math.floor(((health?.uptime ?? 0) % 3600) / 60)}m`, color: "text-green-400", bg: "bg-green-500/10", pct: 100 },
        ].map(m => (
          <div key={m.label} className="glass-panel rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{m.label}</p>
            <p className={`text-2xl font-mono font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground mb-2">{m.sub}</p>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${m.pct > 80 ? "bg-red-400" : m.pct > 60 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl border border-border p-4">
          <h4 className="font-bold text-sm mb-3">Platform Info</h4>
          {[
            { label: "OS", value: `${health?.platform?.os || "Unknown"} ${health?.platform?.version || ""}` },
            { label: "Node.js", value: health?.nodeVersion || "Unknown" },
            { label: "Total Users", value: health?.stats?.totalUsers?.toString() || "0" },
            { label: "Running Projects", value: health?.stats?.runningProjects?.toString() || "0" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono font-medium">{value}</span>
            </div>
          ))}
        </div>
        <div className="glass-panel rounded-xl border border-border p-4">
          <h4 className="font-bold text-sm mb-3">Quick Actions</h4>
          <div className="space-y-2">
            {[
              { label: "🛑 Stop All Projects", action: () => apiFetch("/admin/emergency/stop-all", { method: "POST" }), danger: true },
              { label: "📢 Emergency Broadcast", action: () => { const msg = prompt("Broadcast message:"); if (msg) apiFetch("/admin/emergency/broadcast", { method: "POST", body: JSON.stringify({ title: "System Alert", message: msg, type: "warning" }) }); }, danger: false },
            ].map(({ label, action, danger }) => (
              <button key={label} onClick={action}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${danger ? "border-destructive/30 text-destructive hover:bg-destructive/10" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Config Tab ──────────────────────────────────────────────────────
function ReferralConfigTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState({ signupCoins: 50, firstDeployCoins: 100, firstPaymentCoins: 200 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/admin/referrals/config").then(d => { setConfig(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/admin/referrals/config", { method: "PUT", body: JSON.stringify(config) });
      toast({ title: "✅ Referral config saved!" });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h3 className="font-bold text-lg">Referral Config</h3>
        <p className="text-sm text-muted-foreground">Control how many coins referrals earn at each milestone.</p>
      </div>
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <form onSubmit={save} className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          {[
            { key: "signupCoins" as const, label: "Signup Coins", desc: "Coins given to referrer when someone they invited signs up" },
            { key: "firstDeployCoins" as const, label: "First Deploy Coins", desc: "Coins given when referred user deploys their first project" },
            { key: "firstPaymentCoins" as const, label: "First Payment Coins", desc: "Coins given when referred user makes their first coin purchase" },
          ].map(({ key, label, desc }) => (
            <div key={key}>
              <label className="text-sm font-bold block mb-0.5">{label}</label>
              <p className="text-xs text-muted-foreground mb-1.5">{desc}</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} value={config[key]} onChange={e => setConfig(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <span className="text-sm text-yellow-400 font-mono">coins</span>
              </div>
            </div>
          ))}
          <Button type="submit" isLoading={saving} className="w-full bg-gradient-to-r from-primary to-accent border-none text-white">Save Referral Config</Button>
        </form>
      )}
    </div>
  );
}

// ─── Superadmin Tab ───────────────────────────────────────────────────────────
function SuperadminTab() {
  const { toast } = useToast();
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [selfAmount, setSelfAmount] = useState(500);
  const [selfReason, setSelfReason] = useState("Superadmin grant");
  const [givingToSelf, setGivingToSelf] = useState(false);
  const [giveUser, setGiveUser] = useState({ username: "", amount: 500, reason: "Admin gift" });
  const [givingToUser, setGivingToUser] = useState(false);
  const [massAmount, setMassAmount] = useState(100);
  const [massReason, setMassReason] = useState("Platform gift");
  const [massSending, setMassSending] = useState(false);
  const [quickNotif, setQuickNotif] = useState({ title: "", message: "", type: "info", target: "all" });
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    apiFetch("/auth/me").then((u: any) => setMyBalance(u.coins));
  }, []);

  const giveSelf = async () => {
    if (!selfAmount) return;
    setGivingToSelf(true);
    try {
      const r = await apiFetch("/admin/coins/give-self", { method: "POST", body: JSON.stringify({ amount: selfAmount, reason: selfReason }) });
      setMyBalance(r.newBalance);
      toast({ title: `✅ +${selfAmount} coins added to your account!`, description: `New balance: ${r.newBalance?.toLocaleString()} coins` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setGivingToSelf(false);
  };

  const giveToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giveUser.username || !giveUser.amount) return;
    setGivingToUser(true);
    try {
      const r = await apiFetch("/admin/coins/give", { method: "POST", body: JSON.stringify(giveUser) });
      toast({ title: `✅ Sent ${giveUser.amount} coins to @${r.username}`, description: `Their new balance: ${r.newBalance?.toLocaleString()} coins` });
      setGiveUser(p => ({ ...p, username: "" }));
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setGivingToUser(false);
  };

  const sendMass = async () => {
    if (!massAmount) return;
    if (!confirm(`Send ${massAmount} coins to ALL active users?`)) return;
    setMassSending(true);
    try {
      const r = await apiFetch("/admin/coins/bulk", { method: "POST", body: JSON.stringify({ amount: massAmount, reason: massReason }) });
      toast({ title: `✅ Sent ${massAmount} coins to ${r.affectedUsers} users!` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setMassSending(false);
  };

  const sendQuickNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingNotif(true);
    try {
      const r = await apiFetch("/admin/notifications/targeted", { method: "POST", body: JSON.stringify(quickNotif) });
      toast({ title: `✅ Sent to ${r.sent} user${r.sent !== 1 ? "s" : ""}` });
      setQuickNotif(p => ({ ...p, title: "", message: "" }));
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSendingNotif(false);
  };

  const PRESETS = [100, 500, 1000, 5000, 10000];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 flex-shrink-0">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-display font-bold">Superadmin Controls</h2>
          <p className="text-sm text-muted-foreground">You built this platform. You have full authority — no restrictions.</p>
        </div>
        {myBalance !== null && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Your Balance</p>
            <p className="text-2xl font-mono font-bold text-yellow-400">{myBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">coins</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Give Myself Coins */}
        <div className="glass-panel rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="font-bold">Give Myself Coins</h3>
          </div>
          <p className="text-xs text-muted-foreground">Instantly add coins to your own account. No airdrop needed.</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setSelfAmount(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selfAmount === p ? "bg-yellow-500 border-yellow-500 text-black" : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-yellow-500/40"}`}>
                +{p.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="number" min={1} value={selfAmount} onChange={e => setSelfAmount(+e.target.value)}
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500/40" />
            <span className="flex items-center text-xs text-muted-foreground px-1">coins</span>
          </div>
          <input value={selfReason} onChange={e => setSelfReason(e.target.value)} placeholder="Reason (optional)"
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/40" />
          <Button onClick={giveSelf} isLoading={givingToSelf}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-500 border-none text-white font-bold gap-2">
            <Coins className="w-4 h-4" /> Add {selfAmount.toLocaleString()} Coins to My Account
          </Button>
        </div>

        {/* Give Coins to User */}
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold">Give Coins to Any User</h3>
          </div>
          <p className="text-xs text-muted-foreground">Send coins directly to any user by their username.</p>
          <form onSubmit={giveToUser} className="space-y-3">
            <input required value={giveUser.username} onChange={e => setGiveUser(p => ({ ...p, username: e.target.value }))} placeholder="Username (e.g. john_doe)"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div className="flex gap-2">
              <input required type="number" min={1} value={giveUser.amount} onChange={e => setGiveUser(p => ({ ...p, amount: +e.target.value }))}
                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <span className="flex items-center text-xs text-muted-foreground px-1">coins</span>
            </div>
            <input value={giveUser.reason} onChange={e => setGiveUser(p => ({ ...p, reason: e.target.value }))} placeholder="Reason"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Button type="submit" isLoading={givingToUser} className="w-full gap-2">
              <Send className="w-4 h-4" /> Send Coins to User
            </Button>
          </form>
        </div>

        {/* Mass Distribution */}
        <div className="glass-panel rounded-2xl border border-green-500/30 bg-green-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Gift className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="font-bold">Mass Coin Distribution</h3>
          </div>
          <p className="text-xs text-muted-foreground">Give coins to every active user simultaneously — great for platform rewards or celebrations.</p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="number" min={1} value={massAmount} onChange={e => setMassAmount(+e.target.value)}
                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/40" />
              <span className="flex items-center text-xs text-muted-foreground px-1">coins per user</span>
            </div>
            <input value={massReason} onChange={e => setMassReason(e.target.value)} placeholder="Reason shown in transaction history"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
          </div>
          <Button onClick={sendMass} isLoading={massSending}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 border-none text-white font-bold gap-2">
            <Gift className="w-4 h-4" /> Distribute {massAmount} Coins to All Users
          </Button>
        </div>

        {/* Quick Notification */}
        <div className="glass-panel rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-bold">Quick Notification</h3>
          </div>
          <p className="text-xs text-muted-foreground">Send an in-app notification instantly to any group of users.</p>
          <form onSubmit={sendQuickNotif} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "all", label: "👥 All Users" },
                { v: "premium", label: "💎 Premium" },
                { v: "new", label: "🌱 New Users" },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => setQuickNotif(p => ({ ...p, target: opt.v }))}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${quickNotif.target === opt.v ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>
                  {opt.label}
                </button>
              ))}
              <select value={quickNotif.type} onChange={e => setQuickNotif(p => ({ ...p, type: e.target.value }))}
                className="col-span-1 px-2 py-2 bg-secondary border border-border rounded-lg text-xs focus:outline-none">
                {["info", "success", "warning", "error"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input required value={quickNotif.title} onChange={e => setQuickNotif(p => ({ ...p, title: e.target.value }))} placeholder="Notification title"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <textarea required rows={2} value={quickNotif.message} onChange={e => setQuickNotif(p => ({ ...p, message: e.target.value }))} placeholder="Your message..."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Button type="submit" isLoading={sendingNotif} className="w-full gap-2 bg-blue-600 hover:bg-blue-500 border-none text-white">
              <Bell className="w-4 h-4" /> Send Notification
            </Button>
          </form>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-panel rounded-2xl border border-border p-5">
        <h3 className="font-bold text-sm mb-3">Other Admin Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Create Airdrop", desc: "Go to Airdrops tab", action: () => { document.querySelector('[data-tab="airdrops"]')?.dispatchEvent(new MouseEvent("click")); } },
            { label: "Manage Packages", desc: "Go to Packages tab" },
            { label: "View All Users", desc: "Go to Users tab" },
            { label: "Broadcast Message", desc: "Opens broadcast modal" },
          ].map(item => (
            <div key={item.label} className="px-3 py-2 bg-secondary rounded-lg border border-border text-sm">
              <p className="font-medium text-xs">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
