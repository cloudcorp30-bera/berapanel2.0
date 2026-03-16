import {
  useGetCoinBalance, useGetEarnOptions, useTransferCoins,
  useClaimStreak, useGetStreakStatus, useGetSubscriptionPlans,
  useInitiatePayment, useGetPaymentStatus, useRedeemPromoCode,
  useListAirdrops, useClaimAirdrop, useGetCoinHistory
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import {
  Coins as CoinsIcon, Send, Trophy, CheckCircle2, Flame,
  ShoppingCart, Tag, Gift, History, RefreshCw, ArrowUpRight, ArrowDownLeft, Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "overview" | "buy" | "earn" | "transfer" | "history";

function PayHeroBuyModal({ pkg, onClose, onSuccess }: { pkg: any; onClose: () => void; onSuccess: () => void }) {
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
      toast({ title: "✅ Payment Successful!", description: `${status.coins} coins added to your balance!` });
      onSuccess();
      onClose();
    } else if (status?.status === "failed") {
      setPolling(false);
      toast({ title: "Payment Failed", description: "The M-Pesa payment was not completed.", variant: "destructive" });
    }
  }, [status?.status]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^(?:254|\+254|0)?([71]\d{8})$/)) {
      toast({ title: "Invalid phone", description: "Enter a valid Kenyan phone number (e.g. 0712345678)", variant: "destructive" });
      return;
    }
    initiateMut.mutate({ data: { packageId: pkg.id, phone: phone.replace(/^0/, "254") } }, {
      onSuccess: (res: any) => {
        setCheckoutId(res.checkoutRequestId);
        setPolling(true);
        toast({ title: "STK Push Sent", description: "Check your phone and enter your M-Pesa PIN" });
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md border border-primary/30">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{pkg.name}</h3>
          <p className="text-muted-foreground">
            <span className="text-3xl font-mono font-bold text-yellow-400">{(pkg.coins + (pkg.bonusCoins || 0)).toLocaleString()}</span> coins
          </p>
          <p className="text-xl font-bold mt-1">KSH {pkg.priceKsh}</p>
        </div>

        {polling ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="font-semibold">Waiting for M-Pesa confirmation...</p>
            <p className="text-sm text-muted-foreground mt-2">Check your phone and enter your PIN</p>
            <button onClick={() => setPolling(false)} className="mt-4 text-xs text-muted-foreground underline">Cancel</button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">M-Pesa Phone Number</label>
              <input
                required
                type="tel"
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary font-mono text-lg"
                placeholder="0712 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">You'll receive an M-Pesa STK push prompt</p>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 border-none text-white text-lg py-3" isLoading={initiateMut.isPending}>
              Pay KSH {pkg.priceKsh} via M-Pesa
            </Button>
            <button type="button" onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function CoinsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [buyPkg, setBuyPkg] = useState<any>(null);
  const [transferForm, setTransferForm] = useState({ toUsername: "", coins: 0, note: "" });
  const [promoCode, setPromoCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance, refetch: refetchBalance } = useGetCoinBalance();
  useEffect(() => { const t = setInterval(() => refetchBalance(), 15000); return () => clearInterval(t); }, [refetchBalance]);
  const { data: options } = useGetEarnOptions();
  const { data: streak, refetch: refetchStreak } = useGetStreakStatus();
  const { data: plans } = useGetSubscriptionPlans();
  const { data: airdrops, refetch: refetchAirdrops } = useListAirdrops();
  const { data: history } = useGetCoinHistory({ page: 1 }, { query: { enabled: activeTab === "history" } as any });

  const transferMut = useTransferCoins();
  const claimStreakMut = useClaimStreak();
  const redeemPromoMut = useRedeemPromoCode();
  const claimAirdropMut = useClaimAirdrop();

  const invalidateAll = () => {
    refetchBalance();
    refetchStreak();
    queryClient.invalidateQueries({ queryKey: ["/api/brucepanel/auth/me"] });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transferMut.mutate({ data: transferForm }, {
      onSuccess: () => {
        toast({ title: "✅ Transfer Successful" });
        invalidateAll();
        setTransferForm({ toUsername: "", coins: 0, note: "" });
      },
      onError: (e: any) => toast({ title: "Transfer Failed", description: e.message, variant: "destructive" })
    });
  };

  const handleStreakClaim = () => {
    claimStreakMut.mutate(undefined, {
      onSuccess: (res: any) => {
        toast({ title: `🔥 Day ${res.newStreak} Streak!`, description: `+${res.coinsAwarded} coins claimed!` });
        invalidateAll();
        refetchStreak();
      },
      onError: (e: any) => toast({ title: "Already claimed", description: e.message, variant: "destructive" })
    });
  };

  const handlePromoRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    redeemPromoMut.mutate({ data: { code: promoCode } }, {
      onSuccess: (res: any) => {
        toast({ title: "🎁 Promo Redeemed!", description: res.message });
        invalidateAll();
        setPromoCode("");
      },
      onError: (e: any) => toast({ title: "Invalid code", description: e.message, variant: "destructive" })
    });
  };

  const handleAirdropClaim = (id: string, coins: number) => {
    claimAirdropMut.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "🎉 Airdrop Claimed!", description: `+${coins} coins added!` });
        invalidateAll();
        refetchAirdrops();
      },
      onError: (e: any) => toast({ title: "Cannot claim", description: e.message, variant: "destructive" })
    });
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: CoinsIcon },
    { id: "buy", label: "Buy Coins", icon: ShoppingCart },
    { id: "earn", label: "Earn Free", icon: Trophy },
    { id: "transfer", label: "Transfer", icon: Send },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {buyPkg && (
        <PayHeroBuyModal
          pkg={buyPkg}
          onClose={() => setBuyPkg(null)}
          onSuccess={invalidateAll}
        />
      )}

      {/* Balance Hero */}
      <div className="glass-panel p-10 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover opacity-10 mix-blend-screen pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 mb-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
            <CoinsIcon className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold mb-2">Available Balance</p>
          <h1 className="text-7xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-4 drop-shadow-lg">
            {(balance?.coins || 0).toLocaleString()}
          </h1>
          <p className="text-muted-foreground">Total earned all-time: <span className="text-yellow-400 font-mono">{(balance?.totalEarned || 0).toLocaleString()}</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Streak */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Daily Streak</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-400/20 flex items-center justify-center border border-orange-400/30">
                <span className="text-3xl font-bold text-orange-400">{streak?.currentStreak || 0}</span>
              </div>
              <div>
                <p className="text-sm font-medium">Day {streak?.currentStreak || 0} streak</p>
                <p className="text-xs text-muted-foreground">Reward: +{streak?.reward || 10} coins</p>
                {!streak?.canClaim && streak?.nextClaimAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Next: {new Date(streak.nextClaimAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!streak?.canClaim}
              isLoading={claimStreakMut.isPending}
              onClick={handleStreakClaim}
            >
              {streak?.canClaim ? `🔥 Claim +${streak?.reward} Coins` : "✅ Already Claimed Today"}
            </Button>
          </div>

          {/* Promo Code */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-accent" /> Promo Code</h3>
            <form onSubmit={handlePromoRedeem} className="space-y-4">
              <div>
                <input
                  required
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary font-mono text-lg tracking-widest uppercase"
                  placeholder="ENTER CODE"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground mt-2">Try: <code className="text-accent">BERA2026</code> for 100 free coins!</p>
              </div>
              <Button type="submit" className="w-full" isLoading={redeemPromoMut.isPending}>Redeem Code</Button>
            </form>
          </div>

          {/* Active Airdrops */}
          {airdrops && airdrops.filter((a: any) => !a.claimed).length > 0 && (
            <div className="glass-panel p-6 rounded-2xl md:col-span-2">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-yellow-400" /> Active Airdrops</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {airdrops.filter((a: any) => !a.claimed).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                    <div>
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-yellow-400 font-bold">+{a.coins}</span>
                      <Button size="sm" onClick={() => handleAirdropClaim(a.id, a.coins || 0)} isLoading={claimAirdropMut.isPending} className="text-xs px-3">
                        Claim
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "buy" && (
        <div className="space-y-6">
          <p className="text-muted-foreground">Purchase coins instantly via M-Pesa. Payments are processed securely through PayHero.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans?.map((pkg: any) => (
              <div
                key={pkg.id}
                className={`glass-panel rounded-2xl p-6 border cursor-pointer transition-all duration-200 hover:scale-105 ${
                  pkg.badge === "popular" ? "border-primary/50 shadow-lg shadow-primary/20" : "border-border hover:border-primary/30"
                }`}
              >
                {pkg.badge && (
                  <div className="flex items-center gap-1 mb-3">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400 uppercase">{pkg.badge}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                {pkg.description && <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-mono font-bold text-yellow-400">{pkg.coins.toLocaleString()}</span>
                    <span className="text-muted-foreground">coins</span>
                  </div>
                  {pkg.bonusCoins > 0 && (
                    <p className="text-xs text-success font-medium">+ {pkg.bonusCoins.toLocaleString()} bonus coins!</p>
                  )}
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-500 border-none text-white"
                  onClick={() => setBuyPkg(pkg)}
                >
                  Pay KSH {pkg.priceKsh} via M-Pesa
                </Button>
              </div>
            ))}
          </div>
          <div className="glass-panel rounded-xl p-4 flex items-start gap-3 border border-border">
            <span className="text-xl mt-0.5">🔒</span>
            <div>
              <p className="text-sm font-medium">Secure Payments via PayHero</p>
              <p className="text-xs text-muted-foreground mt-0.5">All payments are processed securely via M-Pesa STK Push. Coins are credited instantly after payment confirmation.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "earn" && (
        <div className="space-y-4">
          {options?.map(opt => (
            <div key={opt.id} className="glass-panel p-5 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${opt.completed ? "bg-success/10 border-success/30" : "bg-primary/10 border-primary/20"}`}>
                  {opt.completed ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Trophy className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <h4 className="font-bold">{opt.title}</h4>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-yellow-400 font-bold text-lg">+{opt.coins}</span>
                {opt.completed && <CheckCircle2 className="w-5 h-5 text-success" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "transfer" && (
        <div className="max-w-md mx-auto glass-panel p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> Send Coins</h3>
          <form onSubmit={handleTransfer} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Username</label>
              <input
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary"
                placeholder="Enter username"
                value={transferForm.toUsername}
                onChange={e => setTransferForm(p => ({ ...p, toUsername: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number" required min="1" max={balance?.coins || 0}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary font-mono text-xl"
                value={transferForm.coins || ""}
                placeholder="0"
                onChange={e => setTransferForm(p => ({ ...p, coins: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Balance: {(balance?.coins || 0).toLocaleString()} coins</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note <span className="text-muted-foreground">(Optional)</span></label>
              <input
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary"
                placeholder="What's this for?"
                value={transferForm.note}
                onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={transferMut.isPending}>Send Coins</Button>
          </form>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-3">
          {!history?.transactions || history.transactions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-16 text-center">
              <History className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">Your coin history will appear here.</p>
            </div>
          ) : (
            history.transactions.map((tx: any) => (
              <div key={tx.id} className="glass-panel rounded-xl p-4 border border-border flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  (tx.coins || 0) > 0 ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  {(tx.coins || 0) > 0
                    ? <ArrowDownLeft className="w-5 h-5 text-success" />
                    : <ArrowUpRight className="w-5 h-5 text-destructive" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-mono font-bold ${(tx.coins || 0) > 0 ? "text-success" : "text-destructive"}`}>
                  {(tx.coins || 0) > 0 ? "+" : ""}{tx.coins} coins
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
