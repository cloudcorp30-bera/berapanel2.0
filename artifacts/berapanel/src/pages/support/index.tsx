import { useState } from "react";
import { useListSupportTickets, useCreateSupportTicket, useGetSupportTicket, useSendTicketMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, ChevronLeft, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

function ago(d: string | Date | null | undefined) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ─── Ticket Thread View ────────────────────────────────────────────────────────
function TicketThread({ ticket, onBack }: { ticket: any; onBack: () => void }) {
  const { data, isLoading, refetch } = useGetSupportTicket(ticket.id);
  const addMsgMut = useSendTicketMessage();
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    addMsgMut.mutate({ ticketId: ticket.id, data: { message } }, {
      onSuccess: () => { setMessage(""); refetch(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  const statusColor = {
    open: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    in_progress: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    resolved: "bg-green-500/10 border-green-500/30 text-green-400",
    closed: "bg-secondary border-border text-muted-foreground",
  };

  const messages = (data as any)?.messages || (data as any)?.ticket?.messages || [];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h2 className="font-bold text-lg">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", (statusColor as any)[ticket.status] || statusColor.open)}>{ticket.status}</span>
            <span className="text-xs text-muted-foreground capitalize">{ticket.priority} priority</span>
            <span className="text-xs text-muted-foreground">• {ticket.category}</span>
            <span className="text-xs text-muted-foreground">• Opened {ago(ticket.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-panel rounded-2xl border border-border p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No messages yet. Start the conversation below.</div>
        ) : messages.map((msg: any) => (
          <div key={msg.id} className={cn("flex gap-3", msg.isAdmin ? "flex-row-reverse" : "")}>
            <div className={cn("w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border",
              msg.isAdmin ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border")}>
              {msg.isAdmin ? "A" : "U"}
            </div>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-3", msg.isAdmin ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border")}>
              <p className="text-sm">{msg.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{msg.isAdmin ? "Support Team" : "You"} • {ago(msg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Box */}
      {ticket.status !== "resolved" && ticket.status !== "closed" ? (
        <form onSubmit={handleSend} className="mt-4 flex gap-3">
          <input
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-3 bg-input border border-border rounded-xl outline-none focus:border-primary text-sm"
          />
          <Button type="submit" className="gap-2 px-5" isLoading={addMsgMut.isPending}><Send className="w-4 h-4" /> Send</Button>
        </form>
      ) : (
        <div className="mt-4 text-center text-sm text-muted-foreground glass-panel rounded-xl p-4 border border-border">
          This ticket is {ticket.status}. <button className="text-primary underline" onClick={onBack}>Open a new ticket</button> if you need more help.
        </div>
      )}
    </div>
  );
}

// ─── Main Support Page ─────────────────────────────────────────────────────────
export function SupportPage() {
  const { data: tickets, isLoading, refetch } = useListSupportTickets();
  const createMut = useCreateSupportTicket();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: form }, {
      onSuccess: (newTicket: any) => {
        toast({ title: "✅ Ticket Created", description: "We'll respond as soon as possible!" });
        setForm({ subject: "", category: "general", priority: "normal", message: "" });
        setShowForm(false);
        refetch();
        if (newTicket?.id) setSelectedTicket(newTicket);
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved": return <CheckCircle className="w-4 h-4 text-success" />;
      case "in_progress": return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <AlertCircle className="w-4 h-4 text-primary" />;
    }
  };

  const priorityColor: Record<string, string> = {
    urgent: "text-destructive bg-destructive/10 border-destructive/30",
    high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    normal: "text-muted-foreground bg-secondary border-border",
    low: "text-muted-foreground bg-secondary border-border",
  };

  if (selectedTicket) {
    return (
      <div className="max-w-4xl mx-auto">
        <TicketThread ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><LifeBuoy className="w-8 h-8 text-primary" /> Support</h1>
          <p className="text-muted-foreground mt-1">Get help from our team. We typically respond within 24 hours.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Ticket</>}
        </Button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-8 border border-primary/20">
          <h3 className="text-xl font-bold mb-6">Open Support Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Subject</label>
              <input required className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary"
                placeholder="What do you need help with?" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary">
                  {["general", "billing", "technical", "abuse", "other"].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary">
                  {["low", "normal", "high", "urgent"].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Message</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary resize-none"
                placeholder="Describe your issue in detail..." />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={createMut.isPending}>Submit Ticket</Button>
          </form>
        </div>
      )}

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "📖", title: "Documentation", desc: "Read our guides and API docs", color: "border-primary/20 bg-primary/5" },
          { icon: "💬", title: "Community", desc: "Join our Discord server", color: "border-purple-500/20 bg-purple-500/5" },
          { icon: "📧", title: "Email Us", desc: "support@berapanel.dev", color: "border-green-500/20 bg-green-500/5" },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`glass-panel rounded-xl p-4 border ${color} flex items-center gap-3`}>
            <span className="text-2xl">{icon}</span>
            <div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
          </div>
        ))}
      </div>

      {/* Ticket List */}
      <div>
        <h2 className="text-lg font-bold mb-4">Your Tickets</h2>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}</div>
        ) : !tickets || (tickets as any[]).length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Tickets Yet</h3>
            <p className="text-muted-foreground mb-6">Open a ticket and we'll get back to you.</p>
            <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> New Ticket</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(tickets as any[]).map((ticket: any) => (
              <div key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="glass-panel rounded-xl p-5 border border-border hover:border-primary/30 cursor-pointer transition-all hover:bg-secondary/30 flex items-start gap-4">
                <div className="mt-0.5">{getStatusIcon(ticket.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{ticket.subject}</h3>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0", priorityColor[ticket.priority] || priorityColor.normal)}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{ticket.category} • Opened {ago(ticket.createdAt)}</p>
                  {ticket.lastMessage && <p className="text-sm text-muted-foreground mt-1 truncate">"{ticket.lastMessage}"</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-full", {
                    "text-yellow-400 bg-yellow-500/10": ticket.status === "open",
                    "text-blue-400 bg-blue-500/10": ticket.status === "in_progress",
                    "text-green-400 bg-green-500/10": ticket.status === "resolved",
                    "text-muted-foreground bg-secondary": ticket.status === "closed",
                  })}>{ticket.status}</span>
                  {ticket.messageCount > 0 && <p className="text-xs text-muted-foreground mt-1">{ticket.messageCount} messages</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
