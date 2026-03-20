import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navbar, Sidebar } from "@/components/layout";

// Pages
import { LandingPage } from "@/pages/landing";
import { Login, Register } from "@/pages/auth";
import { Dashboard } from "@/pages/dashboard";
import { Plans } from "@/pages/plans";
import { WorkerClaims } from "@/pages/claims";
import { Profile } from "@/pages/profile";
import { AdminPortal } from "@/pages/admin";
import { About, FAQ } from "@/pages/static";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!user) {
    setLocation("/login");
    return null;
  }

  if (adminOnly && user.role !== 'admin') {
    setLocation("/dashboard");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />

      {/* Protected Worker Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/plans"><ProtectedRoute component={Plans} /></Route>
      <Route path="/claims"><ProtectedRoute component={WorkerClaims} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

      {/* Admin Route */}
      <Route path="/admin/:tab?"><ProtectedRoute component={AdminPortal} adminOnly /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background font-sans text-foreground">
              <Navbar />
              <Sidebar>
                <Router />
              </Sidebar>
              <Toaster />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
