import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Top performers this month. Keep pushing!</p>
      </div>

      <Card className="bg-[#111] border-white/10">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            We're building an awesome leaderboard to track top performers, earnings, and achievements. Check back soon!
          </p>
          <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Launching Q1 2025</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
