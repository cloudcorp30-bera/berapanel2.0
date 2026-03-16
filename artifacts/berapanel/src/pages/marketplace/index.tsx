import { useListBots, useDeployBot, useGetBotCategories, useGetFeaturedBots, useGetBotReviews, useReviewBot } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bot, Download, Star, Zap, Filter, Search, ChevronDown, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
      ))}
    </div>
  );
}

function BotReviews({ botId, onClose }: { botId: string; onClose: () => void }) {
  const { data, refetch } = useGetBotReviews(botId);
  const reviewMut = useReviewBot();
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const { toast } = useToast();
  const reviews = (data as any)?.reviews || [];

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMut.mutate({ id: botId, data: form }, {
      onSuccess: () => { toast({ title: "Review submitted!" }); setForm({ rating: 5, comment: "" }); refetch(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg border border-border shadow-2xl max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">Reviews ({reviews.length})</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No reviews yet. Be the first!</div>
          ) : reviews.map((r: any) => (
            <div key={r.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold">
                  {r.username?.charAt(0)?.toUpperCase()}
                </div>
                <span className="font-medium text-sm">{r.username}</span>
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-muted-foreground ml-9">{r.comment}</p>}
            </div>
          ))}
        </div>

        <form onSubmit={handleReview} className="p-5 border-t border-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Your Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setForm(p => ({ ...p, rating: n }))}>
                  <Star className={cn("w-5 h-5 transition-colors", n <= form.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground hover:text-yellow-400")} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
              placeholder="Leave a comment (optional)"
              className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm outline-none focus:border-primary" />
            <Button type="submit" isLoading={reviewMut.isPending} className="gap-1 px-4"><Send className="w-3 h-3" /> Post</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BotCard({ bot, onDeploy, onReview, deploying }: { bot: any; onDeploy: (b: any) => void; onReview: (b: any) => void; deploying: boolean }) {
  return (
    <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl border border-border">
          {bot.icon || <Bot className="w-6 h-6 text-primary" />}
        </div>
        <div className="flex flex-col items-end gap-1">
          {bot.featured && <Badge variant="success" className="text-[10px] px-2">Featured ⚡</Badge>}
          {bot.verified && <Badge variant="outline" className="text-[10px] px-2 border-blue-500/30 text-blue-400">Verified</Badge>}
        </div>
      </div>

      <h3 className="font-bold text-lg mb-1">{bot.name}</h3>
      {bot.category && <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">{bot.category}</span>}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{bot.description}</p>

      <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1"><Download className="w-3 h-3" /> {bot.deployCount || 0}</div>
          {bot.rating > 0 && (
            <button onClick={() => onReview(bot)} className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
              <StarRating rating={bot.rating} />
              <span className="ml-0.5">{(bot.rating || 0).toFixed(1)}</span>
              {bot.reviewCount > 0 && <span>({bot.reviewCount})</span>}
            </button>
          )}
        </div>
        {bot.runtime && <span className="font-mono bg-secondary px-2 py-0.5 rounded border border-border">{bot.runtime}</span>}
      </div>

      {bot.tags && bot.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {bot.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <Button className="flex-1 gap-2" onClick={() => onDeploy(bot)} isLoading={deploying}>
          <Zap className="w-4 h-4" /> Deploy {bot.coinCost > 0 ? `(${bot.coinCost} coins)` : 'Free'}
        </Button>
        <button onClick={() => onReview(bot)} className="px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Star className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Marketplace() {
  const { data: bots, isLoading } = useListBots();
  const { data: categories } = useGetBotCategories();
  const { data: featured } = useGetFeaturedBots();
  const deployMut = useDeployBot();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [reviewBot, setReviewBot] = useState<any>(null);

  const handleDeploy = (bot: any) => {
    const name = `${bot.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`;
    deployMut.mutate({ id: bot.id, data: { projectName: name, envVars: {} } }, {
      onSuccess: (project: any) => { toast({ title: "🚀 Bot Deployed!", description: "Check your projects tab." }); setLocation(`/projects/${project.id}`); },
      onError: (e: any) => toast({ title: "Deploy Failed", description: e.message, variant: "destructive" })
    });
  };

  const filteredBots = (bots || []).filter((bot: any) => {
    const matchCat = selectedCategory === "all" || bot.category === selectedCategory;
    const matchSearch = !search || bot.name.toLowerCase().includes(search.toLowerCase()) || bot.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredBots = (featured as any[]) || (bots as any[] || []).filter((b: any) => b.featured);

  if (isLoading) return <div className="animate-pulse h-64 bg-card rounded-xl"></div>;

  return (
    <div className="space-y-8">
      {reviewBot && <BotReviews botId={reviewBot.id} onClose={() => setReviewBot(null)} />}

      <div className="mb-2">
        <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
        <p className="text-muted-foreground">Deploy pre-configured Discord, Telegram, and utility bots instantly.</p>
      </div>

      {/* Featured Section */}
      {featuredBots.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Featured Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredBots.slice(0, 3).map((bot: any) => (
              <div key={bot.id} className="glass-panel rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl border border-border flex-shrink-0">
                  {bot.icon || <Bot className="w-7 h-7 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{bot.name}</h3>
                    <Badge variant="success" className="text-[10px] px-1.5 flex-shrink-0">⚡ Featured</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{bot.description}</p>
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={() => handleDeploy(bot)} isLoading={deployMut.isPending} className="text-xs gap-1">
                      <Zap className="w-3 h-3" /> Deploy {bot.coinCost > 0 ? `(${bot.coinCost}c)` : 'Free'}
                    </Button>
                    {bot.rating > 0 && <div className="flex items-center gap-1"><StarRating rating={bot.rating} /><span className="text-xs text-muted-foreground">{(bot.rating || 0).toFixed(1)}</span></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search bots..."
            className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors", selectedCategory === "all" ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}>
            All
          </button>
          {(categories as string[] || []).map((cat: string) => (
            <button key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors capitalize", selectedCategory === cat ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bot Grid */}
      {filteredBots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold mb-1">No bots found</p>
          <p className="text-sm">{search ? `No results for "${search}"` : "No bots in this category yet."}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{filteredBots.length} bot{filteredBots.length !== 1 ? "s" : ""} {selectedCategory !== "all" ? `in "${selectedCategory}"` : "available"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBots.map((bot: any) => (
              <BotCard key={bot.id} bot={bot} onDeploy={handleDeploy} onReview={setReviewBot} deploying={deployMut.isPending} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
