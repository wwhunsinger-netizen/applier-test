import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCardWrapper } from "@/components/hover-card-wrapper";
import {
  Users,
  Zap,
  Trophy,
  AlertTriangle,
  TrendingUp,
  Mail,
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  Award,
  Gift,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailDialog } from "@/components/admin/email-dialog";
import { Link } from "wouter";
import {
  fetchClientCosts,
  fetchAdminOverview,
  fetchClientPerformance,
  type ClientCost,
  type ApplierPerformance,
  type AdminOverview,
  type ClientPerformance,
} from "@/lib/api";

export default function AdminDashboardPage() {
  const [selectedUser, setSelectedUser] = useState<ApplierPerformance | null>(
    null,
  );
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [clientCosts, setClientCosts] = useState<ClientCost[]>([]);
  const [isCostsLoading, setIsCostsLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [clientPerformance, setClientPerformance] = useState<
    ClientPerformance[]
  >([]);
  const [isClientPerfLoading, setIsClientPerfLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    fetchClientCosts()
      .then(setClientCosts)
      .catch(console.error)
      .finally(() => setIsCostsLoading(false));

    fetchAdminOverview()
      .then(setOverview)
      .catch(console.error)
      .finally(() => setIsOverviewLoading(false));

    fetchClientPerformance()
      .then(setClientPerformance)
      .catch(console.error)
      .finally(() => setIsClientPerfLoading(false));
  }, []);

  const handleEmailClick = (user: ApplierPerformance) => {
    setSelectedUser(user);
    setIsEmailOpen(true);
  };

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Calculate total costs across all clients
  const totalCosts = clientCosts.reduce((acc, c) => acc + c.total_cost, 0);
  const totalPending = clientCosts.reduce(
    (acc, c) => acc + c.pending_amount,
    0,
  );

  // Use real data from overview API
  const totalDailyApps = overview?.summary.totalDailyApps || 0;
  const totalWeeklyApps = overview?.summary.totalWeeklyApps || 0;
  const activeReviewers = overview?.summary.activeReviewers || 0;
  const totalAppliers = overview?.summary.totalAppliers || 0;
  const appliers = overview?.appliers || [];

  // Helper to get cost data for a client
  const getCostForClient = (clientId: string): ClientCost | undefined => {
    return clientCosts.find((c) => c.client_id === clientId);
  };

  const isLoading = isClientPerfLoading || isCostsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Admin Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Real-time team performance monitoring.
        </p>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Daily Apps
              </p>
              <div className="text-2xl font-bold text-white mt-1">
                {totalDailyApps}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Reviewers
              </p>
              <div className="text-2xl font-bold text-white mt-1">
                {activeReviewers}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {totalAppliers}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Weekly Volume
              </p>
              <div className="text-2xl font-bold text-white mt-1">
                {totalWeeklyApps}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Client Spend
              </p>
              <div className="text-2xl font-bold text-white mt-1">
                ${totalCosts.toFixed(0)}
              </div>
              {totalPending > 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  ${totalPending.toFixed(0)} pending
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Team Performance</h2>
        {isOverviewLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : appliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No appliers found. Add team members to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appliers.map((user) => (
              <HoverCardWrapper key={user.id}>
                <Card
                  className="bg-[#111] border-white/10 overflow-hidden"
                  data-testid={`applier-card-${user.id}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div
                          className={cn(
                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111]",
                            user.status === "Active"
                              ? "bg-green-500"
                              : user.status === "Idle"
                                ? "bg-yellow-500"
                                : "bg-gray-500",
                          )}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{user.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {user.status}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEmailClick(user)}
                    >
                      <Mail className="w-4 h-4 text-muted-foreground hover:text-white" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          Today
                        </div>
                        <div className="font-bold text-white">
                          {user.dailyApps}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          Week
                        </div>
                        <div className="font-bold text-white">
                          {user.weeklyApps}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          Int Rate
                        </div>
                        <div className="font-bold text-white">
                          {user.interviewRate}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverCardWrapper>
            ))}
          </div>
        )}
      </div>

      {/* Combined Client Performance & Cost Tracking */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Client Performance & Costs
          </h2>
          <Link href="/admin/clients">
            <Button variant="outline" size="sm">
              View All Clients
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : clientPerformance.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No clients found. Add clients to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clientPerformance.map((client) => {
              const costData = getCostForClient(client.id);
              const isExpanded = expandedClients.has(client.id);

              return (
                <Card
                  key={client.id}
                  className="bg-[#111] border-white/10 hover:border-white/20 transition-colors group"
                  data-testid={`client-card-${client.id}`}
                >
                  <CardContent className="p-6">
                    {/* Client Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-white/10">
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111]",
                              client.status === "active"
                                ? "bg-green-500"
                                : client.status === "placed"
                                  ? "bg-blue-500"
                                  : "bg-yellow-500",
                            )}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">
                              {client.name}
                            </h3>
                            <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                              Started {client.startDate}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last activity {client.lastActivity}
                          </p>
                        </div>
                      </div>
                      {costData && costData.total_cost > 0 && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            ${costData.total_cost.toFixed(0)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            total spend
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Applied</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {client.totalApps}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            Interviews
                          </span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {client.interviews}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Offers</span>
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          {client.offers}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Spend</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          ${client.spend.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Cost Breakdown */}
                    {costData && costData.total_cost > 0 && (
                      <>
                        <button
                          onClick={() => toggleClientExpanded(client.id)}
                          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-white py-2 border-t border-white/5 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              Hide cost breakdown{" "}
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              View cost breakdown{" "}
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                                <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                                  <Target className="w-3.5 h-3.5" />
                                  <span className="text-xs">100 App Bonus</span>
                                </div>
                                <div className="text-lg font-bold text-white">
                                  $
                                  {costData.earnings_breakdown.application_milestone.toFixed(
                                    0,
                                  )}
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                                <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                                  <Award className="w-3.5 h-3.5" />
                                  <span className="text-xs">Interviews</span>
                                </div>
                                <div className="text-lg font-bold text-white">
                                  $
                                  {costData.earnings_breakdown.interview_bonus.toFixed(
                                    0,
                                  )}
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                                <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                                  <Gift className="w-3.5 h-3.5" />
                                  <span className="text-xs">Placements</span>
                                </div>
                                <div className="text-lg font-bold text-green-400">
                                  $
                                  {costData.earnings_breakdown.placement_bonus.toFixed(
                                    0,
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between text-sm px-1">
                              <span className="text-muted-foreground">
                                Paid:{" "}
                                <span className="text-green-400">
                                  ${costData.paid_amount.toFixed(0)}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                Pending:{" "}
                                <span className="text-yellow-400">
                                  ${costData.pending_amount.toFixed(0)}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EmailDialog
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        recipient={selectedUser}
      />
    </div>
  );
}
