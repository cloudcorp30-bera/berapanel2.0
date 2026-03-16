import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useGetMe({
    query: { retry: false }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-muted-foreground font-mono animate-pulse">Initializing BeraPanel...</p>
      </div>
    );
  }

  if (error || !user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-foreground tracking-tight capitalize">
            {location.split('/')[1] || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 rounded-full bg-secondary border border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-sm font-mono text-muted-foreground">Sys: Online</span>
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-5 pointer-events-none mix-blend-screen"></div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
