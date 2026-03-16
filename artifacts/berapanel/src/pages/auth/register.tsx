import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Terminal, Lock, User, Mail, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  
  const [formData, setFormData] = useState({ username: "", password: "", email: "", referralCode: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: formData }, {
      onSuccess: (res) => {
        localStorage.setItem("token", res.token);
        toast({ title: "Account Created!", description: "Welcome to BeraPanel." });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err.message || "Please check your inputs", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-20 mix-blend-screen pointer-events-none"></div>
      
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10 shadow-2xl shadow-primary/10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)] mb-4">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Initialize <span className="text-primary">Node</span></h1>
          <p className="text-muted-foreground mt-2">Create your cloud workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
              <input 
                type="text"
                required
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={formData.username}
                onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
              <input 
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
              <input 
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              Referral Code <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
              <input 
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={formData.referralCode}
                onChange={e => setFormData(p => ({ ...p, referralCode: e.target.value }))}
              />
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" size="lg" isLoading={registerMutation.isPending}>
            Deploy Instance
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have access? <Link href="/login" className="text-primary hover:text-accent transition-colors font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
}
