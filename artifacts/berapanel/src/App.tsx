import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/auth/login";
import { Register } from "./pages/auth/register";
import { Dashboard } from "./pages/dashboard";
import { NewProject } from "./pages/projects/new";
import { ProjectDetail } from "./pages/projects/detail";
import { Marketplace } from "./pages/marketplace";
import { CoinsPage } from "./pages/coins";
import { AdminDashboard } from "./pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/projects/new" component={NewProject} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/coins" component={CoinsPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={Dashboard} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Login} />
      <Route path="/*" component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
