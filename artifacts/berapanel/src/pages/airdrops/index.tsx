import { useListAirdrops, useClaimAirdrop, useGetCoinBalance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { Gift, Coins, CheckCircle, Clock, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function AirdropsPage() {
  const { data: airdrops, isLoading, refetch } = useListAirdrops();
  const { refetch: refetchBalance } = useGetCoinBalance();
  const claimMut = useClaimAirdrop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClaim = (id: string, coins: number, title: string) => {
    claimMut.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "🎉 Claimed!",
          description: `+${coins} coins added to your balance!`,
        });
        refetch();
        refetchBalance();
        queryClient.invalidateQueries({ queryKey: ["/api/brucepanel/auth/me"] });
      },
      onError: (e: any) => {
        toast({ title: "Cannot claim", description: e.message, variant: "destructive" });
      }
    });
  };

  const formatExpiry = (expiresAt: any) => {
    if (!expiresAt) return "No expiry";
    const d = new Date(expiresAt);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h remaining`;
    return `${Math.floor(hours / 24)}d remaining`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gift className="w-8 h-8 text-accent" /> Airdrops
        </h1>
        <p className="text-muted-foreground mt-1">Claim free coins from active airdrops. First come, first served!</p>
      </div>

      {!airdrops || airdrops.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No Active Airdrops</h3>
          <p className="text-muted-foreground">Check back soon — the admin drops new airdrops regularly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {airdrops.map((airdrop) => (
            <div
              key={airdrop.id}
              className={`glass-panel rounded-2xl p-6 border transition-all duration-300 ${
                airdrop.claimed
                  ? "border-border opacity-60"
                  : "border-accent/30 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${airdrop.claimed ? "bg-secondary" : "bg-accent/20 shadow-lg shadow-accent/20"}`}>
                    <Gift className={`w-6 h-6 ${airdrop.claimed ? "text-muted-foreground" : "text-accent"}`} />
                  </div>
                  <div>
                    <h3 className="font-bold">{airdrop.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatExpiry(airdrop.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-xl font-mono">
                    <Coins className="w-5 h-5" />
                    {airdrop.coins}
                  </div>
                  <p className="text-xs text-muted-foreground">coins</p>
                </div>
              </div>

              {airdrop.description && (
                <p className="text-sm text-muted-foreground mb-4">{airdrop.description}</p>
              )}

              {airdrop.maxClaims && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Claims</span>
                    <span>{airdrop.claimCount || 0} / {airdrop.maxClaims}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-accent h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((airdrop.claimCount || 0) / airdrop.maxClaims) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {airdrop.claimed ? (
                <div className="flex items-center justify-center gap-2 py-2 text-success text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Already Claimed
                </div>
              ) : (
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-accent/80 to-primary border-none text-white"
                  onClick={() => handleClaim(airdrop.id!, airdrop.coins || 0, airdrop.title || '')}
                  isLoading={claimMut.isPending}
                >
                  <Zap className="w-4 h-4" /> Claim {airdrop.coins} Coins
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
