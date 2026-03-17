import { useListBots, useDeployBot, useGetBotCategories, useGetFeaturedBots, useGetBotReviews, useReviewBot } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bot, Download, Star, Zap, Search, X, Send, ExternalLink, CheckCircle2 } from "lucide-react";
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
  const reviews = (data as any)?.reviews || (Array.isArray(data) ? data : []);

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

interface EnvVar {
  key: string;
  label: string;
  description?: string;
  required?: boolean;
}

function DeployModal({ bot, onClose, onDeploy, isLoading }: {
  bot: any;
  onClose: () => void;
  onDeploy: (projectName: string, envVars: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const requiredEnvVars: EnvVar[] = (bot.requiredEnvVars || []);
  const isWhatsApp = bot.category === "whatsapp" || requiredEnvVars.some((e: EnvVar) => e.key === "SESSION_ID");
  const defaultName = `${bot.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`;
  const [projectName, setProjectName] = useState(defaultName);
  const [envValues, setEnvValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeploy(projectName, envValues);
  };

  const setEnv = (key: string, val: string) => setEnvValues(prev => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg border border-border shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-2xl border border-border">
              {bot.icon || <Bot className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold">{bot.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{bot.category} bot</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {isWhatsApp && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                <span>💬</span> WhatsApp Session Required
              </div>
              <p className="text-xs text-muted-foreground">
                You need a WhatsApp Session ID to connect this bot. Follow these steps:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1.5">
                {["Open the pairing site below", "Enter your WhatsApp number and get a pairing code", "On your phone: WhatsApp → Settings → Linked Devices → Link with phone number → Enter the code", "Copy the Session ID and paste it below"].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://session.giftedtech.co.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-black font-semibold text-sm"
              >
                <ExternalLink className="w-4 h-4" /> Get Session ID from Pairing Site
              </a>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">PROJECT NAME</label>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full px-3 py-2.5 bg-input border border-border rounded-xl text-sm outline-none focus:border-primary"
              required
            />
          </div>

          {requiredEnvVars.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">CONFIGURATION</label>
              <div className="space-y-4">
                {requiredEnvVars.map((ev: EnvVar) => (
                  <div key={ev.key}>
                    <label className="flex items-center gap-1 text-sm font-medium mb-1">
                      {ev.key === "SESSION_ID" && <span>🔑</span>}
                      {ev.label}
                      {ev.required && <span className="text-red-400">*</span>}
                    </label>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mb-1.5">{ev.description}</p>
                    )}
                    <input
                      value={envValues[ev.key] || ""}
                      onChange={e => setEnv(ev.key, e.target.value)}
                      placeholder={`Paste your ${ev.label} here...`}
                      required={ev.required}
                      className={cn(
                        "w-full px-3 py-2.5 bg-input border rounded-xl text-sm outline-none transition-colors",
                        ev.key === "SESSION_ID" && envValues["SESSION_ID"]
                          ? "border-green-500/50 focus:border-green-500"
                          : "border-border focus:border-primary"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(bot.coinCost || 0) > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
              <span>ⓘ</span>
              <span><strong>{bot.coinCost} coins</strong> will be deducted from your balance to deploy this bot.</span>
            </div>
          )}
        </form>

        <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            isLoading={isLoading}
            className="flex-1 gap-2"
          >
            <Zap className="w-4 h-4" />
            Deploy Bot {bot.coinCost > 0 ? `(${bot.coinCost}c)` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BotCard({ bot, onDeploy, onReview, deploying }: { bot: any; onDeploy: (b: any) => void; onReview: (b: any) => void; deploying: boolean }) {
  const isWhatsApp = bot.category === "whatsapp" || (bot.requiredEnvVars || []).some((e: EnvVar) => e.key === "SESSION_ID");
  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-2xl border border-border">
          {bot.icon || <Bot className="w-6 h-6 text-primary" />}
        </div>
        <div className="flex flex-col items-end gap-1">
          {bot.featured && <Badge variant="success" className="text-[10px] px-2">⚡ Featured</Badge>}
          {bot.verified && (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>
      </div>

      <h3 className="font-bold text-base mb-1">{bot.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{bot.description}</p>

      {bot.tags && bot.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {bot.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}

      <Button className="w-full gap-2 mb-2" onClick={() => onDeploy(bot)} isLoading={deploying}>
        <Zap className="w-4 h-4" />
        {bot.coinCost > 0 ? `Deploy Now — ${bot.coinCost} Coins` : 'Deploy Free'}
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {isWhatsApp && (
          <a
            href="https://session.giftedtech.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <span className="text-[10px]">💬</span> Get Session ID
          </a>
        )}
        {!isWhatsApp && <span />}
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" /> {bot.deployCount || 0} deploys
        </span>
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
  const [deployingBot, setDeployingBot] = useState<any>(null);

  const allBots = (bots as any[]) || [];
  const featuredBots = (featured as any[]) || allBots.filter((b: any) => b.featured);

  const atassaMD = allBots.find((b: any) => b.name === "ATASSA MD") || featuredBots.find((b: any) => b.name === "ATASSA MD");
  const otherFeatured = featuredBots.filter((b: any) => b.name !== "ATASSA MD");

  const filteredBots = allBots.filter((bot: any) => {
    const matchCat = selectedCategory === "all" || bot.category === selectedCategory;
    const matchSearch = !search || bot.name.toLowerCase().includes(search.toLowerCase()) || bot.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDeploy = (bot: any) => setDeployingBot(bot);

  const handleDeploySubmit = (projectName: string, envVars: Record<string, string>) => {
    if (!deployingBot) return;
    deployMut.mutate({ id: deployingBot.id, data: { projectName, envVars } }, {
      onSuccess: (project: any) => {
        toast({ title: "🚀 Bot Deployed!", description: `${deployingBot.name} is being set up. Check your projects tab.` });
        setDeployingBot(null);
        setLocation(`/projects/${project.id}`);
      },
      onError: (e: any) => toast({ title: "Deploy Failed", description: e.message, variant: "destructive" })
    });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-card rounded-xl"></div>;

  const categoryList = (categories as any[]) || [];

  return (
    <div className="space-y-8">
      {reviewBot && <BotReviews botId={reviewBot.id} onClose={() => setReviewBot(null)} />}
      {deployingBot && (
        <DeployModal
          bot={deployingBot}
          onClose={() => setDeployingBot(null)}
          onDeploy={handleDeploySubmit}
          isLoading={deployMut.isPending}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
        <p className="text-muted-foreground">Deploy pre-configured WhatsApp, Telegram, Discord, and utility bots instantly.</p>
      </div>

      {atassaMD && (
        <div className="glass-panel rounded-2xl p-6 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-4xl border border-border flex-shrink-0">
              {atassaMD.icon || <Bot className="w-8 h-8" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl font-bold">{atassaMD.name}</h2>
                {atassaMD.featured && <Badge variant="success" className="text-xs px-2">⚡ Featured</Badge>}
                {atassaMD.verified && (
                  <span className="flex items-center gap-1 text-xs text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{atassaMD.description}</p>
              {atassaMD.tags && atassaMD.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {atassaMD.tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
              <Button className="gap-2 w-full sm:w-auto" onClick={() => handleDeploy(atassaMD)}>
                <Zap className="w-4 h-4" />
                {atassaMD.coinCost > 0 ? `Deploy Now — ${atassaMD.coinCost} Coins` : 'Deploy Free'}
              </Button>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <a
                  href="https://session.giftedtech.co.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  💬 Get Session ID
                </a>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" /> {atassaMD.deployCount || 0} deploys
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {otherFeatured.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Featured Bots</h2>
          <div className="space-y-3">
            {otherFeatured.map((bot: any) => (
              <div key={bot.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl border border-border flex-shrink-0">
                  {bot.icon || <Bot className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm truncate">{bot.name}</h3>
                    {bot.featured && <Badge variant="success" className="text-[10px] px-1.5 flex-shrink-0">⚡ Featured</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{bot.description}</p>
                </div>
                <Button size="sm" onClick={() => handleDeploy(bot)} className="flex-shrink-0 gap-1 text-xs">
                  <Zap className="w-3 h-3" />
                  {bot.coinCost > 0 ? `Deploy (${bot.coinCost}c)` : 'Deploy Free'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors", selectedCategory === "all" ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}>
            All
          </button>
          {categoryList.map((item: any) => {
            const cat = typeof item === 'string' ? item : item.category;
            return (
              <button key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors capitalize", selectedCategory === cat ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {filteredBots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold mb-1">No bots found</p>
          <p className="text-sm">{search ? `No results for "${search}"` : "No bots in this category yet."}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{filteredBots.length} bot{filteredBots.length !== 1 ? "s" : ""} {selectedCategory !== "all" ? `in "${selectedCategory}"` : "available"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBots.map((bot: any) => (
              <BotCard key={bot.id} bot={bot} onDeploy={handleDeploy} onReview={setReviewBot} deploying={deployMut.isPending && deployingBot?.id === bot.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
