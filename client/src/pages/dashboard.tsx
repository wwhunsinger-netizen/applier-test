import { Link } from "wouter";
import { MOCK_STATS, MOCK_LEADERBOARD } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Clock, TrendingUp, CheckCircle2, AlertCircle, ArrowRight, Flame, Trophy, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const percentComplete = (MOCK_STATS.dailyApps / MOCK_STATS.dailyGoal) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ready to crush your goals today, Alex?</p>
      </div>

      {/* Hero Stats Card */}
      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8 border-primary/20 shadow-lg relative overflow-hidden group">
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
                  <span className="text-4xl font-bold font-heading">{MOCK_STATS.dailyApps}</span>
                  <span className="text-muted-foreground ml-2">/ {MOCK_STATS.dailyGoal} apps</span>
                </div>
                <div className="text-sm font-medium text-primary">
                  {Math.round(percentComplete)}% Complete
                </div>
              </div>
              <Progress value={percentComplete} className="h-4 rounded-full bg-primary/10" indicatorClassName="bg-gradient-to-r from-primary to-primary/80" />
              <p className="text-sm text-muted-foreground pt-1">
                🎯 <span className="font-medium text-foreground">53 more</span> needed for your <span className="text-success font-bold">$25 daily bonus</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" /> Time Worked
                </div>
                <div className="font-mono font-bold text-lg">{MOCK_STATS.timeWorked}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3" /> Avg/App
                </div>
                <div className="font-mono font-bold text-lg">{MOCK_STATS.avgTimePerApp}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <ArrowRight className="w-3 h-3" /> Finish In
                </div>
                <div className="font-mono font-bold text-lg">{MOCK_STATS.projectedFinish}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="md:col-span-4 border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground flex flex-col justify-center items-center text-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          <div className="relative z-10 space-y-6 w-full">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">53 Jobs Waiting</h3>
              <p className="text-primary-foreground/80 text-sm">Your queue is ready. Keep the streak alive!</p>
            </div>
            <Link href="/queue">
              <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                START REVIEWING
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Apps</span>
              <span className="font-mono font-bold">487</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Interview Rate</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">{MOCK_STATS.interviewRate}%</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">QA Error Rate</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">{MOCK_STATS.qaErrorRate}%</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Earnings</span>
              <span className="font-mono font-bold text-xl text-primary">${MOCK_STATS.weeklyEarnings}</span>
            </div>
          </CardContent>
        </Card>

        {/* Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> 
              Active Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Goal (100+)</span>
                <span className="font-bold text-orange-600">{MOCK_STATS.streakDays} days 🔥</span>
              </div>
              <Progress value={70} className="h-2" indicatorClassName="bg-orange-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sub-2min Average</span>
                <span className="font-bold text-blue-500">12 days ⚡</span>
              </div>
              <Progress value={90} className="h-2" indicatorClassName="bg-blue-500" />
            </div>
            <div className="pt-2 flex gap-2">
              <Badge variant="secondary" className="px-2 py-1 h-auto flex flex-col items-center gap-1 text-xs border-primary/20 bg-primary/5">
                <span className="text-lg">🚀</span> Speed Demon
              </Badge>
              <Badge variant="secondary" className="px-2 py-1 h-auto flex flex-col items-center gap-1 text-xs border-warning/20 bg-warning/5">
                <span className="text-lg">🏆</span> Quality Champ
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Mini Leaderboard */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {MOCK_LEADERBOARD.slice(0, 4).map((entry) => (
                <div key={entry.rank} className={cn(
                  "flex items-center justify-between p-3 px-6",
                  entry.isCurrentUser && "bg-primary/5"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      entry.rank === 1 ? "bg-yellow-100 text-yellow-700" : 
                      entry.rank === 2 ? "bg-gray-100 text-gray-700" :
                      entry.rank === 3 ? "bg-orange-100 text-orange-700" : "text-muted-foreground"
                    )}>
                      {entry.rank}
                    </div>
                    <span className={cn("text-sm", entry.isCurrentUser && "font-bold")}>
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
      </div>
    </div>
  );
}