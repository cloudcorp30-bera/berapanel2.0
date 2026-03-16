import { useListProjects, useGetMe, useGetSubscriptionPlans, useInitiatePayment, useGetPaymentStatus } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Server, Plus, Activity, Cpu, Code2, Globe, Coins, ShoppingCart, Crown, X, Megaphone, ExternalLink } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const BASE = "/api/brucepanel";
function apiFetch(path: string) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

// ─── STK Push Modal ────────────────────────────────────────────────────────────
function BuyCoinsModal({ pkg, onClose, onSuccess }: { pkg: any; onClose: () => void; onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const initiateMut = useInitiatePayment();
  const { data: status } = useGetPaymentStatus(checkoutId || "", {
    query: { enabled: !!checkoutId && polling, refetchInterval: 3000 } as any
  });
  const { toast } = useToast();

  useEffect(() => {
    if (status?.status === "completed") {
      setPolling(false);
      toast({ title: "✅ Payment Successful!", description: `${status.coins} coins added!` });
      onSuccess(); onClose();
    } else if (status?.status === "failed") {
      setPolling(false);
      toast({ title: "Payment Failed", description: "Payment was not completed.", variant: "destructive" });
    }
  }, [status?.status]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^(?:254|\+254|0)?([71]\d{8})$/)) {
      toast({ title: "Invalid phone", description: "Enter a valid Kenyan number (e.g. 0712345678)", variant: "destructive" }); return;
    }
    initiateMut.mutate({ data: { packageId: pkg.id, phone: phone.replace(/^0/, "254") } }, {
      onSuccess: (res: any) => { setCheckoutId(res.checkoutRequestId); setPolling(true); toast({ title: "📱 STK Push Sent!", description: "Enter your M-Pesa PIN to confirm." }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-sm border border-green-500/30">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">{pkg.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              <span className="text-2xl font-mono font-bold text-yellow-400">{(pkg.coins + (pkg.bonusCoins || 0)).toLocaleString()}</span> coins
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {polling ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full border-4 border-green-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="font-semibold">Waiting for M-Pesa...</p>
            <p className="text-sm text-muted-foreground mt-2">Enter your PIN on your phone</p>
            <button onClick={() => setPolling(false)} className="mt-4 text-xs text-muted-foreground underline">Cancel</button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">M-Pesa Phone Number</label>
              <input required type="tel"
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-green-500 font-mono text-lg"
                placeholder="0712 345 678" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 border-none text-white" isLoading={initiateMut.isPending}>
              Pay KSH {pkg.priceKsh} via M-Pesa
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading } = useListProjects();
  const { data: user } = useGetMe();
  const { data: plans } = useGetSubscriptionPlans();
  const [buyPkg, setBuyPkg] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch("/announcements").then(d => setAnnouncements(d.announcements || d || [])).catch(() => {});
  }, []);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'running': return 'success';
      case 'error': return 'destructive';
      case 'building': return 'warning';
      default: return 'outline';
    }
  };

  const runningCount = projects?.filter(p => p.status === 'running').length || 0;
  const activeAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a.id));

  const annTypeStyle: Record<string, string> = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
    success: "bg-green-500/10 border-green-500/30 text-green-300",
    danger: "bg-red-500/10 border-red-500/30 text-red-300",
  };

  if (isLoading) return <div className="animate-pulse flex gap-4"><div className="h-32 w-full bg-card rounded-xl"></div></div>;

  return (
    <div className="space-y-8">
      {buyPkg && <BuyCoinsModal pkg={buyPkg} onClose={() => setBuyPkg(null)} onSuccess={() => {}} />}

      {/* Announcements Banner */}
      {activeAnnouncements.filter(a => a.pinned).map(a => (
        <div key={a.id} className={`rounded-2xl px-5 py-4 border flex items-start gap-3 ${annTypeStyle[a.type] || annTypeStyle.info}`}>
          <Megaphone className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{a.title}</p>
            <p className="text-sm opacity-80 mt-0.5">{a.body || a.content}</p>
          </div>
          <button onClick={() => setDismissedAnnouncements(p => new Set([...p, a.id]))} className="p-1 rounded opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      ))}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Total Projects</p>
            <h3 className="text-3xl font-bold">{projects?.length || 0}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center border border-success/30">
            <Activity className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Running</p>
            <h3 className="text-3xl font-bold">{runningCount}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
            <Coins className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Coin Balance</p>
            <h3 className="text-3xl font-bold font-mono">{(user?.coins || 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
            <Cpu className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Plan Level</p>
            <h3 className="text-3xl font-bold uppercase">{user?.role}</h3>
          </div>
        </div>
      </div>

      {/* Buy Coins Section */}
      {plans && plans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-yellow-500" /> Top Up Coins
            </h2>
            <Button variant="outline" size="sm" onClick={() => setLocation("/coins")} className="gap-1 text-xs">
              View All <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {plans.slice(0, 4).map((pkg: any) => (
              <div key={pkg.id}
                onClick={() => setBuyPkg(pkg)}
                className={`glass-panel rounded-2xl p-5 border cursor-pointer transition-all hover:scale-105 hover:shadow-lg flex flex-col gap-2 ${pkg.badge === "popular" ? "border-primary/50 shadow-primary/10" : "border-border hover:border-primary/30"}`}>
                {pkg.badge && (
                  <div className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] font-bold text-yellow-400 uppercase">{pkg.badge}</span>
                  </div>
                )}
                <h4 className="font-bold text-sm">{pkg.name}</h4>
                <div>
                  <p className="text-2xl font-mono font-bold text-yellow-400">{pkg.coins.toLocaleString()}</p>
                  {pkg.bonusCoins > 0 && <p className="text-[10px] text-green-400">+{pkg.bonusCoins} bonus</p>}
                </div>
                <div className="mt-auto pt-3 border-t border-border">
                  <span className="text-sm font-bold text-green-400">KSH {pkg.priceKsh}</span>
                  <p className="text-[10px] text-muted-foreground">via M-Pesa</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-pinned announcements */}
      {activeAnnouncements.filter(a => !a.pinned).slice(0, 2).map(a => (
        <div key={a.id} className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${annTypeStyle[a.type] || annTypeStyle.info}`}>
          <Megaphone className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1"><span className="font-semibold text-sm mr-2">{a.title}:</span><span className="text-sm opacity-80">{a.body || a.content}</span></div>
          <button onClick={() => setDismissedAnnouncements(p => new Set([...p, a.id]))}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
        </div>
      ))}

      {/* Projects */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <Button onClick={() => setLocation("/projects/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {projects?.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center border-dashed">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Code2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No projects deployed yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">Deploy your first app in seconds. We support Node.js, Python, Go, and static sites.</p>
          <Button onClick={() => setLocation("/projects/new")} size="lg">Deploy from Github</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div key={project.id} className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col h-full cursor-pointer" onClick={() => setLocation(`/projects/${project.id}`)}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {project.name}
                    {project.pinned && <span className="text-accent text-xs bg-accent/10 px-2 py-0.5 rounded">Pinned</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{project.runtime} • {project.branch}</p>
                </div>
                <Badge variant={getStatusColor(project.status) as any}>{project.status}</Badge>
              </div>

              <div className="mt-auto space-y-4">
                {project.liveUrl && (
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    <Globe className="w-4 h-4" />
                    <a href={project.liveUrl.startsWith('http') ? project.liveUrl : `http://${project.liveUrl}`} target="_blank" rel="noreferrer" className="truncate">
                      {project.liveUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                  <span>Deploys: {project.deployCount}</span>
                  <span>{project.lastDeployedAt ? formatTimeAgo(project.lastDeployedAt) : 'Never deployed'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
