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
import LoadingScreen from "@/components/loading";
import { useState, useEffect } from "react";
import { UserProvider } from "@/lib/userContext";

function Router() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={DashboardPage} />
        <Route path="/queue" component={QueuePage} />
        <Route path="/review/:id" component={ReviewPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/applied" component={() => <div className="p-8 text-center text-muted-foreground">Applied Jobs History (Coming Soon)</div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <Toaster />
          <Router />
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
