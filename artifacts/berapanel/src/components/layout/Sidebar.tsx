import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Store,
  Coins,
  Gift,
  Users,
  Settings,
  Terminal,
  Activity,
  LogOut,
  LifeBuoy,
  Shield,
  Key,
  X,
  MessageSquare,
  Layers,
  BookOpen
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Server },
  { href: "/templates", label: "Templates", icon: Layers },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/coins", label: "Economy", icon: Coins },
  { href: "/airdrops", label: "Airdrops", icon: Gift },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/api-keys", label: "Developer API", icon: Key },
  { href: "/api-docs", label: "API Docs", icon: BookOpen },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const adminLinks = [
  { href: "/admin", label: "Control Panel", icon: Activity },
];

interface SidebarInnerProps {
  onClose?: () => void;
}

function SidebarInner({ onClose }: SidebarInnerProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-border justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">Bera<span className="text-primary">Panel</span></span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors lg:hidden">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</h3>
          {mainLinks.map((link) => {
            const active = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )}
              >
                <link.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-1">
            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Administration</h3>
            {adminLinks.map((link) => {
              const active = location.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-accent/10 text-accent border border-accent/20 shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  )}
                >
                  <link.icon className={cn("w-5 h-5", active ? "text-accent" : "text-muted-foreground")} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="glass-panel p-3 rounded-xl flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-border flex-shrink-0">
            <span className="font-bold text-sm text-white">{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold truncate">{user?.username}</p>
              {isAdmin && <Shield className="w-3 h-3 text-accent flex-shrink-0" />}
            </div>
            <p className="text-xs text-yellow-400 font-mono">{(user?.coins || 0).toLocaleString()} coins</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 border-r border-border bg-sidebar h-screen flex-col fixed left-0 top-0 z-50">
        <SidebarInner />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-border flex flex-col shadow-2xl">
            <SidebarInner onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
