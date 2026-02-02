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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchClientCosts,
  fetchAdminOverview,
  fetchClientPerformance,
  type ClientCost,
  type ApplierPerformance,
  type AdminOverview,
  type ClientPerformance,
} from "@/lib/api";

type Timeframe = "this_week" | "last_week" | "last_month";

interface ApplierTimeframeStats {
  id: string;
  name: string;
  email: string;
  status: string;
  appsSent: number;
  interviews: number;
  offers: number;
}

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

  // Timeframe state
  const [timeframe, setTimeframe] = useState<Timeframe>("this_week");
  const [timeframeStats, setTimeframeStats] = useState<ApplierTimeframeStats[]>(
    [],
  );
  const [isTimeframeLoading, setIsTimeframeLoading] = useState(false);

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

  // Fetch timeframe stats when timeframe changes
  useEffect(() => {
    const fetchTimeframeStats = async () => {
      setIsTimeframeLoading(true);
      try {
        const response = await fetch(
          `/api/admin/applier-timeframe-stats?timeframe=${timeframe}`,
          { credentials: "include" },
        );
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setTimeframeStats(data);
      } catch (error) {
        console.error("Error fetching timeframe stats:", error);
        setTimeframeStats([]);
      } finally {
        setIsTimeframeLoading(false);
      }
    };

    fetchTimeframeStats();
  }, [timeframe]);

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

  const getTimeframeLabel = (tf: Timeframe) => {
    switch (tf) {
      case "this_week":
        return "This Week";
      case "last_week":
        return "Last Week";
      case "last_month":
        return "Last Month";
    }
  };

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

      {/* Team Performance Grid with Timeframe Selector */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Team Performance</h2>
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as Timeframe)}
          >
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              <SelectItem
                value="this_week"
                className="text-white hover:bg-white/5"
              >
                This Week
              </SelectItem>
              <SelectItem
                value="last_week"
                className="text-white hover:bg-white/5"
              >
                Last Week
              </SelectItem>
              <SelectItem
                value="last_month"
                className="text-white hover:bg-white/5"
              >
                Last Month
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isTimeframeLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : timeframeStats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No data found for {getTimeframeLabel(timeframe).toLowerCase()}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timeframeStats.map((user) => (
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          Apps
                        </div>
                        <div className="font-bold text-white">
                          {user.appsSent}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          Interviews
                        </div>
                        <div className="font-bold text-white">
                          {user.interviews}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          Offers
                        </div>
                        <div className="font-bold text-white">
                          {user.offers}
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
                            {client.lastActivity}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleClientExpanded(client.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {client.totalApps}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Total Apps
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {client.interviews}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Interviews
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {costData
                            ? `$${costData.total_cost.toFixed(0)}`
                            : "$0"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Total Cost
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Offers Received
                          </span>
                          <span className="text-sm font-medium text-white">
                            {client.offers}
                          </span>
                        </div>
                        {costData && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Cost Per App
                              </span>
                              <span className="text-sm font-medium text-white">
                                $
                                {(
                                  costData.total_cost / client.totalApps || 0
                                ).toFixed(2)}
                              </span>
                            </div>
                            {costData.pending_amount > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Pending
                                </span>
                                <span className="text-sm font-medium text-yellow-500">
                                  ${costData.pending_amount.toFixed(0)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Dialog */}
      {selectedUser && (
        <EmailDialog
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          recipient={selectedUser}
        />
      )}
    </div>
  );
}
