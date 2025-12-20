import { MOCK_USER_PERFORMANCE } from "@/lib/adminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HoverCardWrapper } from "@/components/hover-card-wrapper";
import { Users, Zap, Trophy, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  // Calculate aggregate stats
  const totalDailyApps = MOCK_USER_PERFORMANCE.reduce((acc, user) => acc + user.dailyApps, 0);
  const totalWeeklyApps = MOCK_USER_PERFORMANCE.reduce((acc, user) => acc + user.weeklyApps, 0);
  const activeReviewers = MOCK_USER_PERFORMANCE.filter(user => user.status === "Active").length;
  const avgQaScore = Math.round(MOCK_USER_PERFORMANCE.reduce((acc, user) => acc + user.qaScore, 0) / MOCK_USER_PERFORMANCE.length);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time team performance monitoring.</p>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Daily Apps</p>
              <div className="text-2xl font-bold text-white mt-1">{totalDailyApps}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Reviewers</p>
              <div className="text-2xl font-bold text-white mt-1">{activeReviewers} <span className="text-sm font-normal text-muted-foreground">/ {MOCK_USER_PERFORMANCE.length}</span></div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg QA Score</p>
              <div className="text-2xl font-bold text-white mt-1">{avgQaScore}%</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weekly Volume</p>
              <div className="text-2xl font-bold text-white mt-1">{totalWeeklyApps}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_USER_PERFORMANCE.map((user) => (
            <HoverCardWrapper key={user.userId}>
              <Card className="bg-[#111] border-white/10 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                      <div className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111]",
                        user.status === "Active" ? "bg-green-500" :
                        user.status === "Idle" ? "bg-yellow-500" : "bg-gray-500"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium text-white">{user.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{user.status} • {user.lastActive}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{user.dailyApps}</div>
                    <div className="text-xs text-muted-foreground">apps today</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Daily Goal ({user.dailyGoal})</span>
                      <span className={cn(
                        "font-medium",
                        user.dailyApps >= user.dailyGoal ? "text-green-500" : "text-white"
                      )}>
                        {Math.round((user.dailyApps / user.dailyGoal) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(user.dailyApps / user.dailyGoal) * 100} 
                      className="h-2 bg-white/5" 
                      indicatorClassName={cn(
                        user.dailyApps >= user.dailyGoal ? "bg-green-500" : "bg-primary"
                      )} 
                    />
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground mb-1">QA Score</div>
                      <div className={cn(
                        "font-bold font-mono",
                        user.qaScore >= 95 ? "text-green-500" : 
                        user.qaScore >= 90 ? "text-blue-500" : "text-yellow-500"
                      )}>
                        {user.qaScore}%
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Interview Rate</div>
                      <div className="font-bold font-mono text-white">{user.interviewRate}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverCardWrapper>
          ))}
        </div>
      </div>
    </div>
  );
}