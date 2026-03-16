import { useState } from "react";
import { useListSupportTickets, useCreateSupportTicket } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";

export function SupportPage() {
  const { data: tickets, isLoading, refetch } = useListSupportTickets();
  const createMut = useCreateSupportTicket();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: form }, {
      onSuccess: () => {
        toast({ title: "Ticket Created", description: "We'll respond as soon as possible!" });
        setForm({ subject: "", category: "general", priority: "normal", message: "" });
        setShowForm(false);
        refetch();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-destructive bg-destructive/10 border-destructive/30";
      case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
      default: return "text-muted-foreground bg-secondary border-border";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-primary" /> Support
          </h1>
          <p className="text-muted-foreground mt-1">Get help from our team. We typically respond within 24 hours.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-8 border border-primary/20">
          <h3 className="text-xl font-bold mb-6">Open Support Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <input
                  required
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-primary text-sm"
                  placeholder="Describe your issue briefly"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-primary text-sm"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-primary text-sm"
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                required
                rows={5}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg outline-none focus:border-primary text-sm resize-none"
                placeholder="Describe your issue in detail..."
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" isLoading={createMut.isPending}>Submit Ticket</Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-panel rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : !tickets || tickets.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No Tickets Yet</h3>
          <p className="text-muted-foreground">Have a question? Open a support ticket above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="glass-panel rounded-xl p-5 border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(ticket.status)}
                  <div>
                    <h4 className="font-semibold">{ticket.subject}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-secondary border border-border capitalize">
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
