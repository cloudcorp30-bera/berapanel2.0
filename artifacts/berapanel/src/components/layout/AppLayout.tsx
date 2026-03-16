import { ReactNode, useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useGetMe, useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Loader2, Bell, CheckCheck, X, Menu } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications, refetch } = useListNotifications({ unread: false });
  useEffect(() => { const t = setInterval(() => refetch(), 30000); return () => clearInterval(t); }, [refetch]);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = notifications?.filter(n => !n.read) ?? [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAll = () => {
    markAll.mutate(undefined, { onSuccess: () => refetch() });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      default: return "ℹ️";
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] glass-panel rounded-xl border border-border shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-bold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button onClick={handleMarkAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markRead.mutate({ notifId: n.id }, { onSuccess: () => refetch() });
                  }}
                  className={cn(
                    "px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{getIcon(n.type || "info")}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", !n.read && "text-foreground")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: user, isLoading, error } = useGetMe();

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

  const pageTitle = location.split("/").filter(Boolean).join(" › ") || "Dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset on desktop to account for fixed sidebar */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-hidden">
        <header className="h-14 lg:h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>

          <h1 className="text-sm lg:text-lg font-semibold text-foreground tracking-tight capitalize truncate flex-1">
            {pageTitle}
          </h1>

          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <div className="hidden sm:flex px-3 py-1.5 rounded-full bg-secondary border border-border items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-xs lg:text-sm font-mono text-muted-foreground">Online</span>
            </div>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-5 pointer-events-none mix-blend-screen"></div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
