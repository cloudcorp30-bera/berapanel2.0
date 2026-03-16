import { useGetCoinBalance, useGetEarnOptions, useTransferCoins } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Coins as CoinsIcon, Send, Trophy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function CoinsPage() {
  const { data: balance, refetch } = useGetCoinBalance();
  const { data: options } = useGetEarnOptions();
  const transferMut = useTransferCoins();
  const { toast } = useToast();

  const [transferForm, setTransferForm] = useState({ toUsername: "", coins: 0, note: "" });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transferMut.mutate({ data: transferForm }, {
      onSuccess: () => {
        toast({ title: "Transfer Successful" });
        refetch();
        setTransferForm({ toUsername: "", coins: 0, note: "" });
      },
      onError: (err: any) => toast({ title: "Transfer Failed", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="glass-panel p-10 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover opacity-10 mix-blend-screen pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 mb-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
            <CoinsIcon className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold mb-2">Available Balance</p>
          <h1 className="text-7xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-4 drop-shadow-lg">
            {balance?.coins || 0}
          </h1>
          <p className="text-muted-foreground">Total earned all-time: {balance?.totalEarned || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-accent"/> Earn Coins</h3>
          <div className="space-y-4">
            {options?.map(opt => (
              <div key={opt.id} className="p-4 border border-border rounded-xl bg-secondary/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm mb-1">{opt.title}</h4>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-success font-bold">+{opt.coins}</span>
                  {opt.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Send className="w-5 h-5 text-primary"/> Transfer</h3>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Username</label>
              <input 
                required 
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-primary"
                value={transferForm.toUsername}
                onChange={e => setTransferForm(p => ({ ...p, toUsername: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input 
                type="number" required min="1" max={balance?.coins || 0}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-primary font-mono"
                value={transferForm.coins}
                onChange={e => setTransferForm(p => ({ ...p, coins: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (Optional)</label>
              <input 
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-primary"
                value={transferForm.note}
                onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full mt-2" size="lg" isLoading={transferMut.isPending}>Send Coins</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
