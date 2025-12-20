import { useState } from "react";
import { MOCK_USER_PERFORMANCE, UserPerformance } from "@/lib/adminData";
import { MOCK_CLIENT_PERFORMANCE_SUMMARY } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCardWrapper } from "@/components/hover-card-wrapper";
import { Users, Zap, Trophy, AlertTriangle, TrendingUp, Mail, Briefcase, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailDialog } from "@/components/admin/email-dialog";

export default function AdminDashboardPage() {
  const [selectedUser, setSelectedUser] = useState<UserPerformance | null>(null);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const handleEmailClick = (user: UserPerformance) => {
    setSelectedUser(user);
    setIsEmailOpen(true);
  };

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
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-medium text-white">{user.name}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-white hover:bg-white/10"
                          onClick={() => handleEmailClick(user)}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.status} • {user.lastActive}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{user.dailyApps}</div>
                    <div className="text-xs text-muted-foreground">apps today</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Daily Progress Bar */}
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

                  {/* Weekly Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Weekly Goal ({user.weeklyGoal})</span>
                      <span className="text-white font-medium">
                        {Math.round((user.weeklyApps / user.weeklyGoal) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(user.weeklyApps / user.weeklyGoal) * 100} 
                      className="h-1.5 bg-white/5" 
                      indicatorClassName="bg-blue-500" 
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
      
      {/* Client Performance Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Client Performance</h2>
          <Button variant="outline" size="sm">View All Clients</Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MOCK_CLIENT_PERFORMANCE_SUMMARY.map((client) => (
             <Card key={client.clientId} className="bg-[#111] border-white/10 hover:border-white/20 transition-colors group">
               <CardContent className="p-6">
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-4">
                     <div className="relative">
                       <img src={client.avatar} alt={client.name} className="h-12 w-12 rounded-full border border-white/10" />
                       <span className={cn(
                         "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111]",
                         client.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                       )} />
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                         <h3 className="text-lg font-bold text-white">{client.name}</h3>
                         <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                           Started {client.startDate}
                         </span>
                       </div>
                       <p className="text-xs text-muted-foreground mt-0.5">Last activity {client.lastActivity}</p>
                     </div>
                   </div>
                   <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <TrendingUp className="w-4 h-4 text-muted-foreground hover:text-white" />
                   </Button>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                     <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                       <Briefcase className="w-3.5 h-3.5" />
                       <span className="text-xs font-medium">Applied</span>
                     </div>
                     <div className="text-xl font-bold text-white">{client.totalApps}</div>
                   </div>
                   <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                     <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                       <Calendar className="w-3.5 h-3.5" />
                       <span className="text-xs font-medium">Interviews</span>
                     </div>
                     <div className="text-xl font-bold text-white">{client.interviews}</div>
                   </div>
                   <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 group-hover:border-white/10 transition-colors">
                     <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
                       <CheckCircle className="w-3.5 h-3.5" />
                       <span className="text-xs font-medium">Offers</span>
                     </div>
                     <div className="text-xl font-bold text-green-400">{client.offers}</div>
                   </div>
                 </div>
               </CardContent>
             </Card>
          ))}
        </div>
      </div>

      <EmailDialog 
        isOpen={isEmailOpen} 
        onClose={() => setIsEmailOpen(false)} 
        recipient={selectedUser} 
      />
    </div>
  );
}