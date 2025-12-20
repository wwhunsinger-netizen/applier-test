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

import { ApplicationsProvider } from "@/lib/applicationsContext";
import AdminApplicationsPage from "@/pages/admin/applications";
import AdminReviewPage from "@/pages/admin/review";
import AdminQAPage from "@/pages/admin/qa";
import AdminClientsPage from "@/pages/admin/clients";
import AdminClientDetailPage from "@/pages/admin/clients/detail";
import ClientInterviewsPage from "@/pages/client/interviews";
import ClientDocumentsPage from "@/pages/client/documents";
import ClientApplicationsPage from "@/pages/client/applications";

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
        
        {/* Admin Routes */}
        <Route path="/admin/applications" component={AdminApplicationsPage} />
        <Route path="/admin/review" component={AdminReviewPage} />
        <Route path="/admin/qa" component={AdminQAPage} />
        <Route path="/admin/clients" component={AdminClientsPage} />
        <Route path="/admin/clients/:id" component={AdminClientDetailPage} />

        {/* Client Routes */}
        <Route path="/client/interviews" component={ClientInterviewsPage} />
        <Route path="/client/documents" component={ClientDocumentsPage} />
        <Route path="/client/applications" component={ClientApplicationsPage} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ApplicationsProvider>
          <UserProvider>
            <Toaster />
            <Router />
          </UserProvider>
        </ApplicationsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
