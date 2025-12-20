import { Link } from "wouter";
import { MOCK_STATS, MOCK_LEADERBOARD } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Clock, TrendingUp, CheckCircle2, AlertCircle, ArrowRight, Flame, Trophy, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCardWrapper } from "@/components/hover-card-wrapper";

export default function DashboardPage() {
  const percentComplete = (MOCK_STATS.dailyApps / MOCK_STATS.dailyGoal) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Alex. Your command center is ready.</p>
      </div>

      {/* Hero Stats Card */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <HoverCardWrapper>
            <Card className="h-full border-white/10 shadow-lg relative overflow-hidden group bg-[#111]">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-32 h-32 text-primary" />
              </div>
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
                  <Zap className="w-5 h-5 text-warning fill-warning" />
                  Daily Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-4xl font-bold font-heading text-white">{MOCK_STATS.dailyApps}</span>
                      <span className="text-muted-foreground ml-2">/ {MOCK_STATS.dailyGoal} apps</span>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {Math.round(percentComplete)}% Complete
                    </div>
                  </div>
                  <Progress value={percentComplete} className="h-4 rounded-full bg-white/5" indicatorClassName="bg-gradient-to-r from-primary to-primary/80" />
                  <p className="text-sm text-muted-foreground pt-1">
                    🎯 <span className="font-medium text-white">53 more</span> needed for your <span className="text-success font-bold">$25 daily bonus</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" /> Time Worked
                    </div>
                    <div className="font-mono font-bold text-lg text-white">{MOCK_STATS.timeWorked}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3" /> Avg/App
                    </div>
                    <div className="font-mono font-bold text-lg text-white">{MOCK_STATS.avgTimePerApp}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <ArrowRight className="w-3 h-3" /> Finish In
                    </div>
                    <div className="font-mono font-bold text-lg text-white">{MOCK_STATS.projectedFinish}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverCardWrapper>
        </div>

        {/* CTA Card - Red Background, White Button, Red Text */}
        <div className="md:col-span-4">
          <HoverCardWrapper>
            <Card className="h-full border-none shadow-xl bg-[#c9352e] text-white flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
              <div className="relative z-10 space-y-6 w-full flex flex-col items-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-2">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">53 Jobs Waiting</h3>
                  <p className="text-white/90 text-sm max-w-[200px] mx-auto leading-relaxed">
                    Your queue is ready. Keep the streak alive!
                  </p>
                </div>
                
                <Link href="/queue" className="w-full">
                  <Button size="lg" className="w-full bg-white text-[#c9352e] hover:bg-white/90 font-bold shadow-xl h-12 text-base tracking-wide uppercase transition-transform hover:scale-[1.02]">
                    START REVIEWING
                  </Button>
                </Link>
              </div>
            </Card>
          </HoverCardWrapper>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Stats */}
        <HoverCardWrapper>
          <Card className="h-full bg-[#111] border-white/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Total Apps</span>
                <span className="font-mono font-bold text-white">487</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Interview Rate</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">{MOCK_STATS.interviewRate}%</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">QA Error Rate</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">{MOCK_STATS.qaErrorRate}%</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Earnings</span>
                <span className="font-mono font-bold text-xl text-primary">${MOCK_STATS.weeklyEarnings}</span>
              </div>
            </CardContent>
          </Card>
        </HoverCardWrapper>

        {/* Streaks */}
        <HoverCardWrapper>
          <Card className="h-full bg-[#111] border-white/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> 
                Active Streaks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Goal (100+)</span>
                  <span className="font-bold text-orange-600">{MOCK_STATS.streakDays} days 🔥</span>
                </div>
                <Progress value={70} className="h-2 bg-white/5" indicatorClassName="bg-orange-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sub-2min Average</span>
                  <span className="font-bold text-blue-500">12 days ⚡</span>
                </div>
                <Progress value={90} className="h-2 bg-white/5" indicatorClassName="bg-blue-500" />
              </div>
              <div className="pt-2 flex gap-2">
                <Badge variant="secondary" className="px-2 py-1 h-auto flex flex-col items-center gap-1 text-xs border-white/10 bg-white/5 text-white">
                  <span className="text-lg">🚀</span> Speed Demon
                </Badge>
                <Badge variant="secondary" className="px-2 py-1 h-auto flex flex-col items-center gap-1 text-xs border-white/10 bg-white/5 text-white">
                  <span className="text-lg">🏆</span> Quality Champ
                </Badge>
              </div>
            </CardContent>
          </Card>
        </HoverCardWrapper>

        {/* Mini Leaderboard */}
        <div className="lg:col-span-1">
          <HoverCardWrapper>
            <Card className="h-full bg-[#111] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-white">Top Performers</CardTitle>
                <Link href="/leaderboard">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-white">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {MOCK_LEADERBOARD.slice(0, 4).map((entry) => (
                    <div key={entry.rank} className={cn(
                      "flex items-center justify-between p-3 px-6",
                      entry.isCurrentUser && "bg-white/5"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          entry.rank === 1 ? "bg-yellow-500/20 text-yellow-500" : 
                          entry.rank === 2 ? "bg-gray-500/20 text-gray-400" :
                          entry.rank === 3 ? "bg-orange-500/20 text-orange-500" : "text-muted-foreground"
                        )}>
                          {entry.rank}
                        </div>
                        <span className={cn("text-sm text-white", entry.isCurrentUser && "font-bold")}>
                          {entry.name}
                        </span>
                      </div>
                      <div className="text-sm font-mono text-muted-foreground">
                        {entry.earnings}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </HoverCardWrapper>
        </div>
      </div>
    </div>
  );
}