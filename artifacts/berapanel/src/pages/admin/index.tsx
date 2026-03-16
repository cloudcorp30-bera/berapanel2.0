import { useState, useEffect } from "react";
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
  Lock, ChevronRight, MessageSquare, Send, ExternalLink, Eye
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
  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [role, setRole] = useState(user.role || "user");
  const { toast } = useToast();
  const qc = useQueryClient();

  const invalidate = () => { onRefresh(); qc.invalidateQueries(); };

  const adjustCoins = async (sign: 1 | -1) => {
    const n = parseInt(coinAmount);
    if (!n || n <= 0) { toast({ title: "Enter a valid positive number", variant: "destructive" }); return; }
    try {
      await apiFetch(`/admin/users/${user.id}/coins`, {
        method: "POST",
        body: JSON.stringify({ amount: n * sign, reason: coinReason || (sign > 0 ? "Admin gift" : "Admin deduction") }),
      });
      toast({ title: sign > 0 ? `+${n} coins added` : `-${n} coins deducted` });
      setCoinAmount(""); setCoinReason(""); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setUserRole = async () => {
    try {
      await apiFetch(`/admin/users/${user.id}/role`, { method: "POST", body: JSON.stringify({ role }) });
      toast({ title: `Role set to ${role}` }); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleBan = async () => {
    const newBanned = !user.banned;
    try {
      await apiFetch(`/admin/users/${user.id}/ban`, { method: "POST", body: JSON.stringify({ banned: newBanned, reason: newBanned ? "Banned by admin" : null }) });
      toast({ title: newBanned ? "User banned" : "User unbanned" }); invalidate(); onClose();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleVerified = async () => {
    try {
      await apiFetch(`/admin/users/${user.id}/verify`, { method: "POST" });
      toast({ title: user.emailVerified ? "Badge removed" : "Blue badge granted ✅" }); invalidate();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border flex items-center justify-center font-bold text-sm">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{user.username}</span>
                {user.emailVerified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                {user.banned && <Ban className="w-4 h-4 text-destructive" />}
              </div>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="glass-panel rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
              <p className="font-mono font-bold text-yellow-400">{(user.coins || 0).toLocaleString()}</p>
            </div>
            <div className="glass-panel rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-0.5">Streak</p>
              <p className="font-mono font-bold text-orange-400">{user.streakDays || 0}d 🔥</p>
            </div>
            <div className="glass-panel rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
              <p className="text-xs font-medium">{ago(user.createdAt)}</p>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 border border-border">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-400" /> Adjust Coins</p>
            <div className="flex gap-2 mb-2">
              <input
                type="number" min="1" placeholder="Amount"
                value={coinAmount} onChange={e => setCoinAmount(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button className="gap-1 bg-green-600 hover:bg-green-500 border-none text-white px-3" onClick={() => adjustCoins(1)} title="Add coins">
                <ArrowUpCircle className="w-4 h-4" /> Add
              </Button>
              <Button className="gap-1 bg-red-600 hover:bg-red-500 border-none text-white px-3" onClick={() => adjustCoins(-1)} title="Deduct coins">
                <ArrowDownCircle className="w-4 h-4" /> Deduct
              </Button>
            </div>
            <input
              type="text" placeholder="Reason (optional)"
              value={coinReason} onChange={e => setCoinReason(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="glass-panel rounded-xl p-4 border border-border">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-purple-400" /> Role</p>
            <div className="flex gap-2">
              <select value={role} onChange={e => setRole(e.target.value)} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <Button onClick={setUserRole} className="px-4">Set</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={toggleVerified} className="gap-2 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30">
              <BadgeCheck className="w-4 h-4" />{user.emailVerified ? "Remove Badge" : "Grant Badge"}
            </Button>
            <Button variant="outline" onClick={toggleBan} className={cn("gap-2", user.banned ? "text-green-400 hover:bg-green-500/10" : "text-destructive hover:bg-destructive/10 hover:border-destructive/30")}>
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
function BroadcastModal({ onClose }: { onClose: () => void }) {
  const notifMut = useAdminSendNotification();
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notifMut.mutate({ data: { ...form, broadcast: true } }, {
      onSuccess: () => { toast({ title: "Broadcast sent to all users!" }); onClose(); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Broadcast Notification</h3>
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
            <textarea required rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
              {["info", "success", "warning", "error"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full" isLoading={notifMut.isPending}>Send to All Users</Button>
        </form>
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
function PlatformTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch("/admin/platform").then(d => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/admin/platform", { method: "PUT", body: JSON.stringify(settings) });
      toast({ title: "Platform settings saved!" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse text-center text-muted-foreground py-12">Loading settings...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-panel rounded-2xl border border-border p-6 flex flex-col gap-4">
        <h3 className="font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Platform Config</h3>
        {settings && Object.entries(settings).map(([key, val]) => {
          if (typeof val === "boolean") {
            return (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <div className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer", val ? "bg-primary" : "bg-secondary border border-border")}
                  onClick={() => setSettings((p: any) => ({ ...p, [key]: !p[key] }))}>
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow", val ? "translate-x-5" : "translate-x-1")} />
                </div>
              </label>
            );
          }
          if (typeof val === "number" || typeof val === "string") {
            return (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                <input type={typeof val === "number" ? "number" : "text"} value={val as any}
                  onChange={e => setSettings((p: any) => ({ ...p, [key]: typeof val === "number" ? +e.target.value : e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            );
          }
          return null;
        })}
        <Button onClick={save} isLoading={saving} className="mt-2 w-full"><Settings className="w-4 h-4 mr-2" />Save Settings</Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass-panel rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h3 className="font-bold flex items-center gap-2 text-red-400 mb-4"><AlertOctagon className="w-4 h-4" /> Emergency Controls</h3>
          <div className="flex flex-col gap-3">
            <Button onClick={async () => { if (!confirm("Stop ALL running projects?")) return; try { await apiFetch("/admin/emergency/stop-all", { method: "POST" }); toast({ title: "All projects stopped" }); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } }}
              className="w-full bg-red-600 hover:bg-red-500 border-none text-white gap-2">
              <Power className="w-4 h-4" /> Stop All Projects
            </Button>
            <Button onClick={async () => { if (!confirm("Restart ALL running projects?")) return; try { await apiFetch("/admin/emergency/restart-all", { method: "POST" }); toast({ title: "All projects restarting..." }); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } }}
              variant="outline" className="w-full gap-2 hover:text-orange-400 hover:border-orange-400/30">
              <RefreshCw className="w-4 h-4" /> Restart All Projects
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-border p-6">
          <h3 className="font-bold flex items-center gap-2 mb-4"><Database className="w-4 h-4 text-accent" /> Referral Config</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Referral Bonus (coins)</label>
              <input type="number" placeholder="e.g. 50" className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" id="ref-bonus" />
            </div>
            <Button onClick={async () => {
              const bonus = parseInt((document.getElementById("ref-bonus") as HTMLInputElement).value);
              if (!bonus) return;
              try { await apiFetch("/admin/referrals/config", { method: "PUT", body: JSON.stringify({ referralBonus: bonus }) }); toast({ title: "Referral config updated" }); }
              catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
            }} className="w-full" variant="outline">Update Referral Bonus</Button>
          </div>
        </div>
      </div>
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
type AdminTab = "overview" | "users" | "packages" | "airdrops" | "announcements" | "tickets" | "economy" | "analytics" | "audit" | "platform" | "projects";

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
    { id: "economy", label: "Economy", icon: DollarSign },
    { id: "packages", label: "Packages", icon: Package },
    { id: "airdrops", label: "Airdrops", icon: Gift },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "tickets", label: "Support", icon: LifeBuoy },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "audit", label: "Audit Log", icon: ClipboardList },
    { id: "platform", label: "Platform", icon: Settings },
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
    </div>
  );
}
