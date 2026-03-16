import { useListBots, useDeployBot, useGetBotCategories, useGetFeaturedBots, useGetBotReviews, useReviewBot } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bot, Download, Star, Zap, X, Send, ExternalLink, AlertCircle, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PAIRING_URL = "https://session.giftedtech.co.ke";

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

interface RequiredEnvVar { key: string; label: string; description?: string; required?: boolean; }

function DeployDialog({ bot, onClose, onDeploy, deploying }: { bot: any; onClose: () => void; onDeploy: (name: string, envVars: Record<string, string>) => void; deploying: boolean }) {
  const required: RequiredEnvVar[] = bot.requiredEnvVars || [];
  const isWhatsApp = bot.category === "whatsapp";
  const [projectName, setProjectName] = useState(`${bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(Math.random() * 1000)}`);
  const [envVars, setEnvVars] = useState<Record<string, string>>(
    Object.fromEntries(required.map((v: RequiredEnvVar) => [v.key, ""]))
  );
  const [showValues, setShowValues] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleShow = (key: string) => {
    setShowValues(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missingRequired = required.filter((v: RequiredEnvVar) => v.required !== false && !envVars[v.key]?.trim());
    if (missingRequired.length > 0) {
      toast({ title: "Required fields missing", description: `Please fill: ${missingRequired.map((v: RequiredEnvVar) => v.label).join(", ")}`, variant: "destructive" });
      return;
    }
    if (!projectName.trim()) {
      toast({ title: "Project name required", variant: "destructive" });
      return;
    }
    onDeploy(projectName.trim(), envVars);
  };

  const sessionIdSet = envVars["SESSION_ID"]?.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg border border-border shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl border border-border flex-shrink-0">
            {bot.icon || "🤖"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold">{bot.name}</h3>
            <p className="text-xs text-muted-foreground">{bot.coinCost > 0 ? `${bot.coinCost} coins` : "Free"}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* WhatsApp pairing instructions */}
          {isWhatsApp && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
              <p className="text-sm font-bold text-green-300 flex items-center gap-2">💬 WhatsApp Session Required</p>
              <p className="text-sm text-muted-foreground">You need a WhatsApp Session ID to connect this bot. Follow these steps:</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">1</span>
                  Open the pairing site below
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">2</span>
                  Enter your WhatsApp number and get a pairing code
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">3</span>
                  On your phone: WhatsApp → Settings → Linked Devices → Link with phone number → Enter the code
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">4</span>
                  Copy the Session ID and paste it below
                </li>
              </ol>
              <a href={PAIRING_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors w-full justify-center">
                <ExternalLink className="w-4 h-4" /> Get Session ID from Pairing Site
              </a>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Project Name</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} required
              placeholder="my-bot-123"
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          {/* Required Env Vars */}
          {required.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuration</p>
              {required.map((v: RequiredEnvVar) => {
                const isSessionId = v.key === "SESSION_ID";
                const isSensitive = v.key.toLowerCase().includes("token") || v.key.toLowerCase().includes("key") || v.key.toLowerCase().includes("secret") || isSessionId;
                const filled = !!envVars[v.key]?.trim();
                return (
                  <div key={v.key} className={`space-y-1 p-3 rounded-xl border ${isSessionId ? "border-green-500/30 bg-green-500/5" : "border-border bg-secondary/30"}`}>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        {isSessionId && <span>🔑</span>}
                        {v.label}
                        {v.required !== false && <span className="text-red-400">*</span>}
                        {filled && <Check className="w-3.5 h-3.5 text-green-400" />}
                      </label>
                    </div>
                    {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                    <div className="relative">
                      <input
                        type={isSensitive && !showValues.has(v.key) ? "password" : "text"}
                        value={envVars[v.key] || ""}
                        onChange={e => setEnvVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        placeholder={isSessionId ? "Paste your Session ID here..." : `Enter ${v.label}`}
                        className={`w-full px-3 py-2.5 bg-secondary border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 ${isSessionId && !filled ? "border-green-500/50" : "border-border"}`}
                      />
                      {isSensitive && (
                        <button type="button" onClick={() => toggleShow(v.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showValues.has(v.key) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cost warning */}
          {bot.coinCost > 0 && (
            <div className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>{bot.coinCost} coins</strong> will be deducted from your balance to deploy this bot.</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" onClick={onClose} className="flex-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground">Cancel</Button>
            <Button type="submit" isLoading={deploying} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
              <Zap className="w-4 h-4" /> Deploy Bot {bot.coinCost > 0 ? `(${bot.coinCost}c)` : ""}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BotCard({ bot, onDeploy, onReview }: { bot: any; onDeploy: (b: any) => void; onReview: (b: any) => void; }) {
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
        <Button className="flex-1 gap-2" onClick={() => onDeploy(bot)}>
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
  const [deployBot, setDeployBot] = useState<any>(null);

  const handleDeploy = (bot: any) => {
    setDeployBot(bot);
  };

  const executeDeploy = (name: string, envVars: Record<string, string>) => {
    deployMut.mutate({ id: deployBot.id, data: { projectName: name, envVars } }, {
      onSuccess: (project: any) => {
        toast({ title: "🚀 Bot Deployed!", description: `${deployBot.name} is being set up.` });
        setDeployBot(null);
        setLocation(`/projects/${project.id}`);
      },
      onError: (e: any) => toast({ title: "Deploy Failed", description: e.message, variant: "destructive" })
    });
  };

  const filteredBots = (bots as any[] || []).filter((bot: any) => {
    const matchCat = selectedCategory === "all" || bot.category === selectedCategory;
    const matchSearch = !search || bot.name.toLowerCase().includes(search.toLowerCase()) || bot.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredBots = (featured as any[]) || (bots as any[] || []).filter((b: any) => b.featured);

  if (isLoading) return <div className="animate-pulse h-64 bg-card rounded-xl"></div>;

  return (
    <div className="space-y-8">
      {reviewBot && <BotReviews botId={reviewBot.id} onClose={() => setReviewBot(null)} />}
      {deployBot && (
        <DeployDialog
          bot={deployBot}
          onClose={() => setDeployBot(null)}
          onDeploy={executeDeploy}
          deploying={deployMut.isPending}
        />
      )}

      <div className="mb-2">
        <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
        <p className="text-muted-foreground">Deploy pre-configured WhatsApp, Telegram, Discord, and utility bots instantly.</p>
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
                    <Button size="sm" onClick={() => handleDeploy(bot)} className="text-xs gap-1">
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
          <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
          {((categories as any[]) || []).map((cat: any) => (
            <button key={cat.category || cat}
              onClick={() => setSelectedCategory(cat.category || cat)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors capitalize", selectedCategory === (cat.category || cat) ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}>
              {cat.category || cat}
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
              <BotCard key={bot.id} bot={bot} onDeploy={handleDeploy} onReview={setReviewBot} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
