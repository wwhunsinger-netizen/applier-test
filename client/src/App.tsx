import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import QueuePage from "@/pages/queue";
import ReviewPage from "@/pages/review";
import LeaderboardPage from "@/pages/leaderboard";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={DashboardPage} />
        <Route path="/queue" component={QueuePage} />
        <Route path="/review/:id" component={ReviewPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/applied" component={() => <div className="p-8 text-center text-muted-foreground">Applied Jobs History (Coming Soon)</div>} />
        <Route path="/profile" component={() => <div className="p-8 text-center text-muted-foreground">User Profile (Coming Soon)</div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
