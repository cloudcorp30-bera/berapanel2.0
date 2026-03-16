import { useState } from "react";
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
  CheckCircle2, Gift, Bell, Settings, TrendingUp, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/api/brucepanel";
function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) },
  }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText); return r.json(); });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: n * sign, reason: coinReason || (sign > 0 ? "Admin gift" : "Admin deduction") }),
      });
      toast({ title: sign > 0 ? `+${n} coins added` : `-${n} coins deducted` });
      setCoinAmount(""); setCoinReason(""); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setUserRole = async () => {
    try {
      await apiFetch(`/admin/users/${user.id}/role`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      toast({ title: `Role set to ${role}` }); invalidate();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const toggleBan = async () => {
    const newBanned = !user.banned;
    try {
      await apiFetch(`/admin/users/${user.id}/ban`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: newBanned, reason: newBanned ? "Banned by admin" : null }),
      });
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
      await apiFetch(`/admin/users/${user.id}/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: pw }),
      });
      toast({ title: "Password reset successfully" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const sendNotif = async () => {
    const msg = prompt("Notification message for " + user.username + ":");
    if (!msg) return;
    try {
      await apiFetch(`/admin/notifications`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Admin Message", message: msg, type: "info", userIds: [user.id] }),
      });
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
              <div className="flex items-center gap-2"><RoleBadge role={user.role} /></div>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Info */}
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

          {/* Coin Adjustment */}
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
              <Button variant="destructive" className="gap-1 px-3" onClick={() => adjustCoins(-1)} title="Deduct coins">
                <ArrowDownCircle className="w-4 h-4" /> Deduct
              </Button>
            </div>
            <input
              placeholder="Reason (optional)"
              value={coinReason} onChange={e => setCoinReason(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Role */}
          <div className="glass-panel rounded-xl p-4 border border-border">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-purple-400" /> Role & Permissions</p>
            <div className="flex gap-2">
              <select
                value={role} onChange={e => setRole(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <Button onClick={setUserRole} className="bg-purple-600 hover:bg-purple-500 border-none text-white px-4">
                Set Role
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleVerified}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                user.emailVerified
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                  : "bg-secondary border-border text-muted-foreground hover:border-blue-500/30 hover:text-blue-400"
              )}
            >
              <BadgeCheck className="w-4 h-4" />
              {user.emailVerified ? "Revoke Blue Badge" : "Grant Blue Badge ✓"}
            </button>
            <button
              onClick={toggleBan}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                user.banned
                  ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  : "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
              )}
            >
              <Ban className="w-4 h-4" />
              {user.banned ? "Unban User" : "Ban User"}
            </button>
            <button
              onClick={sendNotif}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <Bell className="w-4 h-4" /> Send Notification
            </button>
            <button
              onClick={resetPassword}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-yellow-500/30 transition-all"
            >
              <Settings className="w-4 h-4" /> Reset Password
            </button>
          </div>

          <button
            onClick={deleteUser}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Permanently Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coin Package Modal ───────────────────────────────────────────────────────
function PackageModal({ pkg, onClose, onRefresh }: { pkg?: any; onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState({ name: pkg?.name || "", description: pkg?.description || "", priceKsh: pkg?.priceKsh || "", coins: pkg?.coins || "", bonusCoins: pkg?.bonusCoins || 0, badge: pkg?.badge || "", enabled: pkg?.enabled !== false });
  const { toast } = useToast();
  const createMut = useAdminCreateCoinPackage();
  const updateMut = useAdminUpdateCoinPackage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, priceKsh: Number(form.priceKsh), coins: Number(form.coins), bonusCoins: Number(form.bonusCoins) };
    const mut = pkg ? updateMut : createMut;
    const args = pkg ? { pkgId: pkg.id, data } : { data };
    (mut as any).mutate(args, {
      onSuccess: () => { toast({ title: pkg ? "Package updated" : "Package created" }); onRefresh(); onClose(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> {pkg ? "Edit Package" : "New Coin Package"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {[
            { label: "Package Name", key: "name", placeholder: "Pro Pack" },
            { label: "Description", key: "description", placeholder: "Great value for active builders" },
            { label: "Price (KSH)", key: "priceKsh", placeholder: "200", type: "number" },
            { label: "Coins", key: "coins", placeholder: "500", type: "number" },
            { label: "Bonus Coins", key: "bonusCoins", placeholder: "50", type: "number" },
            { label: "Badge Label", key: "badge", placeholder: "Popular" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
              <input
                type={type || "text"} placeholder={placeholder} required={["name", "priceKsh", "coins"].includes(key)}
                value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} className="accent-primary" />
            <span className="text-sm">Enabled (visible to users)</span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 border-none text-white" isLoading={(createMut as any).isPending || (updateMut as any).isPending}>
              {pkg ? "Save Changes" : "Create Package"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Airdrop Modal ────────────────────────────────────────────────────────────
function AirdropModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", coins: "", maxClaims: "" });
  const createMut = useAdminCreateAirdrop();
  const { toast } = useToast();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Create Airdrop</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          createMut.mutate({ data: { ...form, coins: Number(form.coins), maxClaims: form.maxClaims ? Number(form.maxClaims) : undefined, target: "all" } }, {
            onSuccess: () => { toast({ title: "Airdrop created!" }); onRefresh(); onClose(); },
            onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
          });
        }} className="p-5 flex flex-col gap-4">
          {[
            { label: "Title", key: "title", placeholder: "Weekend Bonus" },
            { label: "Description", key: "description", placeholder: "Claim your free coins!" },
            { label: "Coins per claim", key: "coins", placeholder: "50", type: "number" },
            { label: "Max Claims (blank = unlimited)", key: "maxClaims", placeholder: "1000", type: "number" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
              <input type={type || "text"} placeholder={placeholder} required={["title", "coins"].includes(key)}
                value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 border-none text-white" isLoading={createMut.isPending}>Create Airdrop</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Announcement Modal ───────────────────────────────────────────────────────
function AnnouncementModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState({ title: "", content: "", type: "info", pinned: false });
  const createMut = useAdminCreateAnnouncement();
  const { toast } = useToast();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> New Announcement</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          createMut.mutate({ data: { ...form, body: form.content } }, {
            onSuccess: () => { toast({ title: "Announcement published!" }); onRefresh(); onClose(); },
            onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
          });
        }} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Platform Maintenance Notice"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Content</label>
            <textarea required rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement here..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="danger">Danger</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="accent-primary" />
              <span className="text-sm">Pinned</span>
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 border-none text-white" isLoading={createMut.isPending}>Publish</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Broadcast Notification Modal ─────────────────────────────────────────────
function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const sendMut = useAdminSendNotification();
  const { toast } = useToast();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Broadcast Notification</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          sendMut.mutate({ data: { title, message, type, target: "all" } }, {
            onSuccess: () => { toast({ title: "Notification sent to all users!" }); onClose(); },
            onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
          });
        }} className="p-5 flex flex-col gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement Title"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea required rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Message to all users..."
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="info">ℹ️ Info</option>
            <option value="success">✅ Success</option>
            <option value="warning">⚠️ Warning</option>
            <option value="error">❌ Alert</option>
          </select>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 border-none text-white" isLoading={sendMut.isPending}>
              <Bell className="w-4 h-4 mr-1.5" /> Send to All
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
type AdminTab = "overview" | "users" | "packages" | "airdrops" | "announcements" | "tickets";

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [showNewPkg, setShowNewPkg] = useState(false);
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetAdminDashboard();
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
    { id: "packages", label: "Coin Packages", icon: Package },
    { id: "airdrops", label: "Airdrops", icon: Gift },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "tickets", label: "Support", icon: LifeBuoy },
  ];

  return (
    <div className="flex flex-col gap-6">
      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onRefresh={() => { refetchUsers(); refetchStats(); }} />}
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

      {/* Tab Bar */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto">
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
            {[
              { icon: Users, label: "Total Users", value: stats?.totalUsers || 0, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
              { icon: Server, label: "Running Projects", value: stats?.runningProjects || 0, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
              { icon: DollarSign, label: "Revenue (KSH)", value: `KSH ${(stats?.totalRevenue || 0).toLocaleString()}`, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
              { icon: Coins, label: "Coins in Circulation", value: (stats?.coinsInCirculation || 0).toLocaleString(), color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
              { icon: TrendingUp, label: "Today Signups", value: stats?.todaySignups || 0, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { icon: Zap, label: "Today Deploys", value: stats?.todayDeploys || 0, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              { icon: LifeBuoy, label: "Open Tickets", value: stats?.activeTickets || 0, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
              { icon: Cpu, label: "CPU Usage", value: `${Math.round(sysInfo?.cpuPercent || 0)}%`, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
            ].map(({ icon: Icon, label, value, color, bg, border }) => (
              <div key={label} className="glass-panel rounded-2xl p-4 border border-border flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center border ${border} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                  <p className="font-bold text-lg leading-tight">{value}</p>
                </div>
              </div>
            ))}
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
                      <span>{label}</span>
                      <span>{used}/{total} {unit}</span>
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
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Search users by username..."
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["User", "Role", "Coins", "Status", "Joined", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {usersLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-secondary rounded animate-pulse w-full" /></td></tr>
                    ))
                  ) : (usersObj?.users || []).map((u: any) => (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm">{u.username}</span>
                              {u.emailVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" aria-label="Verified" />}
                            </div>
                            {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3 font-mono text-yellow-400 text-sm">{(u.coins || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {u.banned
                          ? <span className="text-xs text-destructive flex items-center gap-1"><Ban className="w-3 h-3" /> Banned</span>
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
            {usersObj && (
              <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                Showing {usersObj.users?.length} of {usersObj.total} users
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Coin Packages Tab ── */}
      {tab === "packages" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewPkg(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white">
              <Plus className="w-4 h-4" /> New Package
            </Button>
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
                    <button onClick={() => {
                      if (!confirm(`Delete "${pkg.name}"?`)) return;
                      delPkgMut.mutate({ pkgId: pkg.id }, { onSuccess: () => { toast({ title: "Package deleted" }); refetchPkgs(); }, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
                    }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
            <Button onClick={() => setShowAirdropModal(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white">
              <Plus className="w-4 h-4" /> New Airdrop
            </Button>
          </div>
          <div className="glass-panel rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="border-b border-border bg-secondary/30">{["Title", "Coins", "Claims", "Created", "Actions"].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border/50">
                {(airdrops as any[] || []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-yellow-400 font-bold">{a.coins}</td>
                    <td className="px-4 py-3 text-sm">{a.claimCount || 0}{a.maxClaims ? `/${a.maxClaims}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ago(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => {
                        if (!confirm("Delete this airdrop?")) return;
                        try { await apiFetch(`/admin/airdrops/${a.id}`, { method: "DELETE" }); toast({ title: "Airdrop deleted" }); refetchAirdrops(); } catch { toast({ title: "Error", variant: "destructive" }); }
                      }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
            <Button onClick={() => setShowAnnouncementModal(true)} className="gap-2 bg-primary hover:bg-primary/90 border-none text-white">
              <Plus className="w-4 h-4" /> New Announcement
            </Button>
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
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{ago(a.createdAt)}</p>
                </div>
                <button onClick={async () => {
                  try { await apiFetch(`/admin/announcements/${a.id}`, { method: "DELETE" }); toast({ title: "Deleted" }); refetchAnnouncements(); } catch { toast({ title: "Error", variant: "destructive" }); }
                }} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {(!announcements || (announcements as any[]).length === 0) && (
              <div className="text-center py-10 text-muted-foreground text-sm">No announcements yet. Create one to notify your users.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Support Tickets Tab ── */}
      {tab === "tickets" && (
        <div className="glass-panel rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border bg-secondary/30">{["Subject", "User", "Status", "Priority", "Created"].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/50">
              {(tickets as any[] || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-secondary/30">
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
                </tr>
              ))}
              {(!tickets || (tickets as any[]).length === 0) && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No support tickets yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
