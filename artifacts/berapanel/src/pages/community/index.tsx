import { useState, useEffect, useRef } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MessageSquare, Send, Hash, Users, BadgeCheck,
  Trash2, Shield, Smile, AtSign, ChevronRight
} from "lucide-react";

const BASE = "/api/brucepanel";
function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) },
  }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText); return r.json(); });
}

const EMOJI_QUICK = ["👍", "🚀", "🔥", "❤️", "😂", "🎉", "💯", "🤔"];

function Avatar({ username, verified, role, size = "sm" }: { username: string; verified?: boolean; role?: string; size?: "sm" | "md" }) {
  const colors = ["from-purple-500 to-pink-500", "from-blue-500 to-cyan-500", "from-green-500 to-teal-500", "from-orange-500 to-red-500", "from-yellow-500 to-orange-500"];
  const color = colors[username.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white flex-shrink-0 relative`}>
      {username.charAt(0).toUpperCase()}
      {verified && <span className="absolute -bottom-0.5 -right-0.5 text-[9px]">✓</span>}
    </div>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (role === "superadmin") return <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">SUPER</span>;
  if (role === "admin") return <span className="text-[9px] bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 rounded font-bold">ADMIN</span>;
  return null;
}

export function CommunityPage() {
  const { data: me } = useGetMe();
  const { toast } = useToast();
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("general");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 30) + 5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    apiFetch("/chat/channels").then(d => setChannels(d.channels || []));
  }, []);

  useEffect(() => {
    loadMessages(activeChannel);
    connectSSE(activeChannel);
    return () => { if (eventSourceRef.current) eventSourceRef.current.close(); };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (slug: string) => {
    try {
      const data = await apiFetch(`/chat/channels/${slug}/messages`);
      setMessages(data.messages || []);
    } catch { setMessages([]); }
  };

  const connectSSE = (slug: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const token = localStorage.getItem("token");
    const es = new EventSource(`${BASE}/chat/channels/${slug}/stream?token=${token}`);
    es.onmessage = (e) => {
      try {
        const { type, payload } = JSON.parse(e.data);
        if (type === "message") setMessages(prev => [...prev, payload]);
      } catch {}
    };
    eventSourceRef.current = es;
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/chat/channels/${activeChannel}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: input.trim() }),
      });
      setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
      setInput("");
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  const deleteMsg = async (msgId: string) => {
    try {
      await apiFetch(`/chat/messages/${msgId}`, { method: "DELETE" });
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isAdmin = me?.role === "admin" || me?.role === "superadmin";
  const activeChannelData = channels.find(c => c.slug === activeChannel);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Developer Community
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Connect with other developers on BeraPanel</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{onlineCount} online</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden gap-4 min-h-0">
        {/* Channel List */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Channels</p>
          {channels.map(ch => (
            <button
              key={ch.slug}
              onClick={() => setActiveChannel(ch.slug)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${activeChannel === ch.slug ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"}`}
            >
              <span className="text-base">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate"># {ch.name}</p>
              </div>
              {activeChannel === ch.slug && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            </button>
          ))}
          {channels.length === 0 && [...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-secondary rounded-lg animate-pulse" />
          ))}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Your Info</p>
            <div className="px-2 py-2 flex items-center gap-2">
              <Avatar username={me?.username || "?"} verified={me?.emailVerified} role={me?.role} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{me?.username}</p>
                {me?.emailVerified && <p className="text-[10px] text-blue-400 flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" /> Verified</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-border overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
            <span className="text-xl">{activeChannelData?.icon || "💬"}</span>
            <div>
              <p className="font-bold text-sm"># {activeChannelData?.name || activeChannel}</p>
              <p className="text-xs text-muted-foreground">{activeChannelData?.description}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-5xl mb-4">{activeChannelData?.icon || "💬"}</span>
                <p className="font-bold text-lg mb-1">Welcome to # {activeChannelData?.name || activeChannel}!</p>
                <p className="text-muted-foreground text-sm">{activeChannelData?.description || "Start the conversation."}</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const isGrouped = prevMsg && prevMsg.userId === msg.userId &&
                (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 5 * 60 * 1000;
              const isOwn = msg.userId === me?.id;
              const canDelete = isOwn || isAdmin;

              return (
                <div key={msg.id} className={`group flex gap-3 ${isGrouped ? "mt-0.5" : "mt-3"} hover:bg-secondary/30 rounded-lg px-2 py-0.5 transition-colors`}>
                  <div className="w-8 flex-shrink-0 flex items-start pt-0.5">
                    {!isGrouped ? <Avatar username={msg.username || "?"} verified={msg.emailVerified} role={msg.role} /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm">{msg.username || "Unknown"}</span>
                        {msg.emailVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                        <RoleBadge role={msg.role} />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => deleteMsg(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all flex-shrink-0 self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Message # ${activeChannelData?.name || activeChannel}...`}
                  maxLength={2000}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <div className="relative flex-shrink-0">
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-8 right-0 bg-card border border-border rounded-xl p-2 flex gap-1 shadow-xl z-10">
                      {EMOJI_QUICK.map(em => (
                        <button key={em} type="button" onClick={() => { setInput(p => p + em); setShowEmoji(false); inputRef.current?.focus(); }}
                          className="text-lg hover:scale-125 transition-transform px-0.5">{em}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" isLoading={sending} className="px-4 bg-primary border-none" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-1 px-1">Press Enter to send · Be respectful · No spam</p>
          </div>
        </div>
      </div>
    </div>
  );
}
