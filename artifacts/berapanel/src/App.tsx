import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/auth/login";
import { Register } from "./pages/auth/register";
import { Dashboard } from "./pages/dashboard";
import { ProjectsList } from "./pages/projects/index";
import { NewProject } from "./pages/projects/new";
import { ProjectDetail } from "./pages/projects/detail";
import { Marketplace } from "./pages/marketplace";
import { CoinsPage } from "./pages/coins";
import { AirdropsPage } from "./pages/airdrops";
import { SupportPage } from "./pages/support";
import { ApiKeysPage } from "./pages/api-keys";
import { AdminDashboard } from "./pages/admin";
import { CommunityPage } from "./pages/community";
import { TemplatesPage } from "./pages/templates";
import { ApiDocsPage } from "./pages/api-docs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/login");
    }
  }, [setLocation]);

  if (!isAuthenticated()) return null;
  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated()) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  if (isAuthenticated()) return null;
  return <Component />;
}

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/projects/new">
          <ProtectedRoute component={NewProject} />
        </Route>
        <Route path="/projects/:id">
          <ProtectedRoute component={ProjectDetail} />
        </Route>
        <Route path="/projects">
          <ProtectedRoute component={ProjectsList} />
        </Route>
        <Route path="/marketplace">
          <ProtectedRoute component={Marketplace} />
        </Route>
        <Route path="/coins">
          <ProtectedRoute component={CoinsPage} />
        </Route>
        <Route path="/airdrops">
          <ProtectedRoute component={AirdropsPage} />
        </Route>
        <Route path="/support">
          <ProtectedRoute component={SupportPage} />
        </Route>
        <Route path="/api-keys">
          <ProtectedRoute component={ApiKeysPage} />
        </Route>
        <Route path="/admin">
          <ProtectedRoute component={AdminDashboard} />
        </Route>
        <Route path="/admin/:rest*">
          <ProtectedRoute component={AdminDashboard} />
        </Route>
        <Route path="/community">
          <ProtectedRoute component={CommunityPage} />
        </Route>
        <Route path="/templates">
          <ProtectedRoute component={TemplatesPage} />
        </Route>
        <Route path="/api-docs">
          <ProtectedRoute component={ApiDocsPage} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <AuthRoute component={Login} />
      </Route>
      <Route path="/register">
        <AuthRoute component={Register} />
      </Route>
      <Route path="/">
        <AuthRoute component={Login} />
      </Route>
      <Route path="/*" component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={base}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
