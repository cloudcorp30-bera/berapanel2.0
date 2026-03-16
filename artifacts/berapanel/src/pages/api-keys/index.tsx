import { useState } from "react";
import { useListApiKeys, useCreateApiKey, useDeleteApiKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Key, Plus, Trash2, Copy, Eye, EyeOff, CheckCircle2,
  Shield, Zap, BookOpen, Clock, AlertTriangle
} from "lucide-react";

const PERMISSION_OPTIONS = [
  { value: "read",    label: "Read",    desc: "List projects, view logs, read env vars", icon: BookOpen, color: "text-blue-400" },
  { value: "deploy",  label: "Deploy",  desc: "Create deployments, push code, restart", icon: Zap,      color: "text-yellow-400" },
  { value: "manage",  label: "Manage",  desc: "Create/delete projects, manage domains",  icon: Shield,   color: "text-purple-400" },
];

function NewKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const createMut = useCreateApiKey();
  const { toast } = useToast();

  const toggle = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your API key a descriptive name.", variant: "destructive" });
      return;
    }
    if (permissions.length === 0) {
      toast({ title: "Select permissions", description: "Choose at least one permission.", variant: "destructive" });
      return;
    }
    createMut.mutate(
      { data: { name: name.trim(), permissions } },
      {
        onSuccess: (res: any) => {
          onCreated(res.key);
        },
        onError: (e: any) => {
          toast({ title: "Failed to create key", description: e?.message || "Unknown error", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Create API Key
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            This key grants external access to your BeraPanel account via the developer API.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Key Name</label>
            <input
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              placeholder="e.g. CI/CD Pipeline, My Script, Monitoring Bot"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={64}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="flex flex-col gap-2">
              {PERMISSION_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    permissions.includes(opt.value)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-border/80 bg-secondary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-primary"
                    checked={permissions.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <opt.icon className={`w-4 h-4 ${opt.color}`} />
                      <span className="text-sm font-semibold">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 border-none text-white" isLoading={createMut.isPending}>
              <Key className="w-4 h-4 mr-1.5" /> Generate Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewKeyRevealModal({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(true);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-green-500/30 w-full max-w-lg shadow-2xl">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-green-400">API Key Created!</h2>
            <p className="text-xs text-muted-foreground">Copy it now — you won't be able to see it again.</p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-black/40 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono">SECRET KEY</span>
              <button
                onClick={() => setRevealed(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {revealed ? "Hide" : "Reveal"}
              </button>
            </div>
            <div className="font-mono text-sm text-green-300 break-all select-all">
              {revealed ? apiKey : "•".repeat(apiKey.length)}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">
              Store this key securely. It grants access to your account and will never be shown again after you close this dialog.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              className={`flex-1 border-none text-white ${copied ? "bg-green-600 hover:bg-green-500" : "bg-primary hover:bg-primary/90"}`}
            >
              {copied ? <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Copied!</> : <><Copy className="w-4 h-4 mr-1.5" /> Copy Key</>}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function maskKey(key: string) {
  if (!key) return "•".repeat(32);
  const prefix = key.startsWith("bp_live_") ? "bp_live_" : key.slice(0, 8);
  return prefix + "•".repeat(Math.max(8, key.length - prefix.length - 4)) + key.slice(-4);
}

export function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { data: keys, isLoading, refetch } = useListApiKeys();
  const deleteMut = useDeleteApiKey();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete API key "${name}"? Any integrations using this key will stop working immediately.`)) return;
    deleteMut.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Key deleted", description: `"${name}" has been revoked.` });
        refetch();
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.message || "Failed to delete key", variant: "destructive" });
      },
    });
  };

  const handleCreated = (key: string) => {
    setShowCreate(false);
    setNewKey(key);
    queryClient.invalidateQueries({ queryKey: ["/api/brucepanel/api/keys"] });
    refetch();
  };

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {showCreate && <NewKeyModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {newKey && <NewKeyRevealModal apiKey={newKey} onClose={() => setNewKey(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" /> API Keys
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate keys to integrate BeraPanel into your CI/CD pipelines and scripts.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gap-2 bg-primary hover:bg-primary/90 border-none text-white"
        >
          <Plus className="w-4 h-4" /> New Key
        </Button>
      </div>

      <div className="glass-panel rounded-2xl border border-border p-5 flex flex-col gap-3 text-sm">
        <h3 className="font-semibold flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> Usage
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Include your API key in the <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-foreground">X-API-Key</code> header on requests to the BeraPanel external API:
        </p>
        <div className="bg-black/40 border border-border rounded-xl p-4 font-mono text-xs text-green-300 overflow-x-auto">
          {`curl https://your-domain/api/brucepanel/projects \\
  -H "X-API-Key: bp_live_your_key_here"`}
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Your API Keys</h3>
          {keys && <span className="text-xs text-muted-foreground">{keys.length} key{keys.length !== 1 ? "s" : ""}</span>}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Loading keys...</div>
        ) : !keys || keys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No API keys yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create your first key to start using the developer API.</p>
            <Button className="mt-4 gap-2 bg-primary hover:bg-primary/90 border-none text-white" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create API Key
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(keys as any[]).map((key) => (
              <div key={key.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{key.name || "Unnamed Key"}</span>
                    <div className="flex gap-1 flex-wrap">
                      {(key.permissions || ["read"]).map((perm: string) => {
                        const opt = PERMISSION_OPTIONS.find(o => o.value === perm);
                        return (
                          <span key={perm} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            perm === "manage" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                            perm === "deploy" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                            "bg-blue-500/10 border-blue-500/30 text-blue-400"
                          }`}>
                            {opt?.label || perm}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono">{maskKey(key.key || "")}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Created {formatDate(key.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(key.id, key.name || "Unnamed Key")}
                  disabled={deleteMut.isPending}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
